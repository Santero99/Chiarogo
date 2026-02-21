// ChiaraGo - WebRTC Signaling via Supabase Realtime
const Signaling = {
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  callChannel: null,
  currentCallId: null,
  isInitiator: false,

  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },

  async startCall(targetUserId, isVideo = false) {
    this.isInitiator = true;
    this.currentCallId = `${App.currentUser.id}_${targetUserId}_${Date.now()}`;
    await this.setupMedia(isVideo);
    await this.setupPeerConnection();
    await this.setupSignalingChannel();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await window.supabaseClient.from('calls').insert({
      id: this.currentCallId,
      caller_id: App.currentUser.id,
      receiver_id: targetUserId,
      status: 'ringing',
      is_video: isVideo,
      offer: JSON.stringify(offer)
    });

    await window.supabaseClient.from('notifications').insert({
      user_id: targetUserId,
      type: 'call',
      content: JSON.stringify({ callId: this.currentCallId, callerId: App.currentUser.id, isVideo }),
      is_read: false
    });
  },

  async answerCall(callId, offer) {
    this.isInitiator = false;
    this.currentCallId = callId;
    await this.setupMedia(false);
    await this.setupPeerConnection();
    await this.setupSignalingChannel();

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await window.supabaseClient.from('calls')
      .update({ status: 'active', answer: JSON.stringify(answer) })
      .eq('id', callId);
  },

  async setupMedia(isVideo) {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideo });
    const localVideo = document.getElementById('localVideo');
    if (localVideo) localVideo.srcObject = this.localStream;
  },

  async setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.config);
    this.remoteStream = new MediaStream();
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = this.remoteStream;

    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => this.remoteStream.addTrack(track));
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await window.supabaseClient.from('ice_candidates').insert({
          call_id: this.currentCallId,
          candidate: JSON.stringify(event.candidate),
          from_initiator: this.isInitiator
        });
      }
    };
  },

  async setupSignalingChannel() {
    this.callChannel = window.supabaseClient
      .channel(`call:${this.currentCallId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ice_candidates',
        filter: `call_id=eq.${this.currentCallId}` },
        async (payload) => {
          if (payload.new.from_initiator !== this.isInitiator && this.peerConnection) {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(JSON.parse(payload.new.candidate))
            );
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls',
        filter: `id=eq.${this.currentCallId}` },
        async (payload) => {
          if (this.isInitiator && payload.new.answer && this.peerConnection) {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(JSON.parse(payload.new.answer))
            );
          }
          if (payload.new.status === 'ended') this.endCall();
        })
      .subscribe();
  },

  async endCall() {
    if (this.currentCallId) {
      await window.supabaseClient.from('calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', this.currentCallId);
    }
    this.cleanup();
  },

  cleanup() {
    if (this.localStream) this.localStream.getTracks().forEach(t => t.stop());
    if (this.peerConnection) this.peerConnection.close();
    if (this.callChannel) this.callChannel.unsubscribe();
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
  },

  toggleAudio() {
    if (this.localStream) {
      const audio = this.localStream.getAudioTracks()[0];
      if (audio) audio.enabled = !audio.enabled;
      return audio?.enabled;
    }
  },

  toggleVideo() {
    if (this.localStream) {
      const video = this.localStream.getVideoTracks()[0];
      if (video) video.enabled = !video.enabled;
      return video?.enabled;
    }
  }
};

window.Signaling = Signaling;

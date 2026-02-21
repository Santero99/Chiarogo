// ChiaraGo - Notifications System
const Notificacoes = {
  channel: null,
  unreadCount: 0,

  async init() {
    if (!App.currentUser) return;
    this.unreadCount = await this.contarNaoLidas();
    this.atualizarBadge();
    this.inscrever();
    this.solicitarPermissao();
  },

  async listar(limit = 50) {
    const { data, error } = await window.supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', App.currentUser.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async contarNaoLidas() {
    const { count } = await window.supabaseClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', App.currentUser.id)
      .eq('is_read', false);
    return count || 0;
  },

  async marcarLida(notifId) {
    await window.supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notifId);
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.atualizarBadge();
  },

  async marcarTodasLidas() {
    await window.supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', App.currentUser.id)
      .eq('is_read', false);
    this.unreadCount = 0;
    this.atualizarBadge();
  },

  async deletar(notifId) {
    await window.supabaseClient
      .from('notifications')
      .delete()
      .eq('id', notifId);
  },

  inscrever() {
    this.channel = window.supabaseClient
      .channel(`notif:${App.currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${App.currentUser.id}`
      }, (payload) => {
        this.unreadCount++;
        this.atualizarBadge();
        this.mostrarNotifNativa(payload.new);
        document.dispatchEvent(new CustomEvent('nova-notificacao', { detail: payload.new }));
      })
      .subscribe();
  },

  atualizarBadge() {
    document.querySelectorAll('.notif-badge').forEach(badge => {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
    });
  },

  solicitarPermissao() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  mostrarNotifNativa(notif) {
    if (Notification.permission !== 'granted') return;
    const content = this.formatarConteudo(notif);
    const n = new Notification('ChiaraGo', {
      body: content.text,
      icon: 'icons/icon-192.png',
      badge: 'icons/badge.png',
      tag: notif.id
    });
    n.onclick = () => { window.focus(); this.navegarParaNotif(notif); n.close(); };
  },

  formatarConteudo(notif) {
    const data = typeof notif.content === 'string' ? JSON.parse(notif.content) : notif.content;
    switch (notif.type) {
      case 'message': return { text: `Nova mensagem de ${data.senderName || 'alguém'}`, icon: '💬' };
      case 'call': return { text: `Chamada de ${data.callerName || 'alguém'}`, icon: '📞' };
      case 'group': return { text: data.text || 'Atividade no grupo', icon: '👥' };
      case 'contact': return { text: `${data.name || 'Alguém'} adicionou você`, icon: '👤' };
      default: return { text: notif.content || 'Nova notificação', icon: '🔔' };
    }
  },

  navegarParaNotif(notif) {
    const data = typeof notif.content === 'string' ? JSON.parse(notif.content) : notif.content;
    switch (notif.type) {
      case 'message': window.location.href = `chat.html?id=${data.conversationId}`; break;
      case 'call': window.location.href = `chamada.html`; break;
      case 'group': window.location.href = `grupo.html?id=${data.groupId}`; break;
      default: window.location.href = 'notificacoes.html';
    }
  }
};

window.Notificacoes = Notificacoes;

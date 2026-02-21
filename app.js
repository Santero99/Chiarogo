// ChiaraGo - Core Application
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANONIMA';

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const App = {
  currentUser: null,
  currentProfile: null,

  async init() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
      this.currentUser = session.user;
      await this.loadProfile();
    }
    this.setupAuthListener();
    this.registerServiceWorker();
  },

  async loadProfile() {
    if (!this.currentUser) return null;
    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', this.currentUser.id)
      .single();
    if (!error) this.currentProfile = data;
    return data;
  },

  setupAuthListener() {
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        this.currentUser = session.user;
        await this.loadProfile();
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentProfile = null;
        window.location.href = 'login.html';
      }
    });
  },

  async requireAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return false;
    }
    this.currentUser = session.user;
    await this.loadProfile();
    return true;
  },

  async signOut() {
    await window.supabaseClient.auth.signOut();
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW error:', err));
    }
  },

  formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR');
  },

  showToast(msg, type = 'info') {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
  },

  async uploadAvatar(file) {
    const ext = file.name.split('.').pop();
    const path = `avatars/${this.currentUser.id}.${ext}`;
    const { data, error } = await window.supabaseClient.storage
      .from('media')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: url } = window.supabaseClient.storage.from('media').getPublicUrl(path);
    return url.publicUrl;
  }
};

window.App = App;

// ChiaraGo - Internacionalização
const i18n = {
  locale: localStorage.getItem('chiara_locale') || 'pt-BR',

  translations: {
    'pt-BR': {
      app_name: 'ChiaraGo',
      login: 'Entrar', logout: 'Sair', register: 'Cadastrar',
      email: 'E-mail', password: 'Senha', confirm_password: 'Confirmar Senha',
      full_name: 'Nome Completo', username: 'Nome de usuário',
      send: 'Enviar', cancel: 'Cancelar', save: 'Salvar', delete: 'Excluir',
      search: 'Pesquisar', settings: 'Configurações', profile: 'Perfil',
      contacts: 'Contatos', notifications: 'Notificações',
      groups: 'Grupos', calls: 'Chamadas', messages: 'Mensagens',
      online: 'Online', offline: 'Offline', typing: 'digitando...',
      new_message: 'Nova mensagem', group_created: 'Grupo criado',
      call_incoming: 'Chamada recebida', call_ended: 'Chamada encerrada',
      accept: 'Aceitar', decline: 'Recusar',
      mute: 'Silenciar', unmute: 'Ativar som', video_on: 'Câmera on', video_off: 'Câmera off',
      loading: 'Carregando...', error: 'Erro', success: 'Sucesso',
      edit_profile: 'Editar Perfil', change_photo: 'Alterar Foto',
      bio: 'Biografia', phone: 'Telefone',
      privacy: 'Privacidade', security: 'Segurança',
      two_factor: 'Autenticação em dois fatores',
      block_user: 'Bloquear usuário', unblock_user: 'Desbloquear',
      report: 'Denunciar', status: 'Status',
      add_contact: 'Adicionar contato', remove_contact: 'Remover contato',
      verify_email: 'Verificar E-mail', resend_code: 'Reenviar código',
      verification_code: 'Código de Verificação',
      enter_code: 'Digite o código de 6 dígitos enviado para seu e-mail',
      theme_dark: 'Tema Escuro', theme_light: 'Tema Claro',
      language: 'Idioma', notifications_settings: 'Configurações de Notificação',
      about: 'Sobre', version: 'Versão',
      upload_file: 'Enviar arquivo', upload_image: 'Enviar imagem',
      read_receipts: 'Confirmação de leitura',
      last_seen: 'Visto por último',
      create_group: 'Criar grupo', group_name: 'Nome do grupo',
      add_members: 'Adicionar membros', group_description: 'Descrição do grupo',
      no_messages: 'Nenhuma mensagem ainda. Seja o primeiro a enviar!',
      no_contacts: 'Nenhum contato encontrado.',
      no_notifications: 'Sem notificações no momento.',
      forgot_password: 'Esqueceu a senha?', reset_password: 'Redefinir Senha',
      new_password: 'Nova Senha',
    },
    'en': {
      app_name: 'ChiaraGo',
      login: 'Login', logout: 'Logout', register: 'Register',
      email: 'Email', password: 'Password', confirm_password: 'Confirm Password',
      full_name: 'Full Name', username: 'Username',
      send: 'Send', cancel: 'Cancel', save: 'Save', delete: 'Delete',
      search: 'Search', settings: 'Settings', profile: 'Profile',
      contacts: 'Contacts', notifications: 'Notifications',
      groups: 'Groups', calls: 'Calls', messages: 'Messages',
      online: 'Online', offline: 'Offline', typing: 'typing...',
      new_message: 'New message', group_created: 'Group created',
      call_incoming: 'Incoming call', call_ended: 'Call ended',
      accept: 'Accept', decline: 'Decline',
      mute: 'Mute', unmute: 'Unmute', video_on: 'Camera on', video_off: 'Camera off',
      loading: 'Loading...', error: 'Error', success: 'Success',
      edit_profile: 'Edit Profile', change_photo: 'Change Photo',
      bio: 'Bio', phone: 'Phone',
      privacy: 'Privacy', security: 'Security',
      two_factor: 'Two-factor Authentication',
      block_user: 'Block user', unblock_user: 'Unblock',
      report: 'Report', status: 'Status',
      add_contact: 'Add contact', remove_contact: 'Remove contact',
      verify_email: 'Verify Email', resend_code: 'Resend code',
      verification_code: 'Verification Code',
      enter_code: 'Enter the 6-digit code sent to your email',
      theme_dark: 'Dark Theme', theme_light: 'Light Theme',
      language: 'Language', notifications_settings: 'Notification Settings',
      about: 'About', version: 'Version',
      upload_file: 'Upload file', upload_image: 'Upload image',
      read_receipts: 'Read receipts', last_seen: 'Last seen',
      create_group: 'Create group', group_name: 'Group name',
      add_members: 'Add members', group_description: 'Group description',
      no_messages: 'No messages yet. Be the first to send!',
      no_contacts: 'No contacts found.',
      no_notifications: 'No notifications right now.',
      forgot_password: 'Forgot password?', reset_password: 'Reset Password',
      new_password: 'New Password',
    },
    'es': {
      app_name: 'ChiaraGo',
      login: 'Iniciar sesión', logout: 'Cerrar sesión', register: 'Registrarse',
      email: 'Correo', password: 'Contraseña', confirm_password: 'Confirmar Contraseña',
      full_name: 'Nombre Completo', username: 'Nombre de usuario',
      send: 'Enviar', cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar',
      search: 'Buscar', settings: 'Configuración', profile: 'Perfil',
      contacts: 'Contactos', notifications: 'Notificaciones',
      groups: 'Grupos', calls: 'Llamadas', messages: 'Mensajes',
      online: 'En línea', offline: 'Desconectado', typing: 'escribiendo...',
      no_messages: 'Sin mensajes aún. ¡Sé el primero en enviar!',
    }
  },

  t(key) {
    const lang = this.translations[this.locale] || this.translations['pt-BR'];
    return lang[key] || this.translations['pt-BR'][key] || key;
  },

  setLocale(locale) {
    this.locale = locale;
    localStorage.setItem('chiara_locale', locale);
    this.applyToPage();
  },

  applyToPage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });
  }
};

window.i18n = i18n;
document.addEventListener('DOMContentLoaded', () => i18n.applyToPage());

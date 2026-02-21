// ChiaraGo - Groups Management
const Grupos = {
  async criar(nome, descricao, avatarUrl, membros) {
    const { data: grupo, error } = await window.supabaseClient
      .from('groups')
      .insert({ name: nome, description: descricao, avatar_url: avatarUrl, created_by: App.currentUser.id })
      .select().single();
    if (error) throw error;

    const mems = [App.currentUser.id, ...membros].map(uid => ({
      group_id: grupo.id, user_id: uid,
      role: uid === App.currentUser.id ? 'admin' : 'member'
    }));
    await window.supabaseClient.from('group_members').insert(mems);
    return grupo;
  },

  async listar() {
    const { data, error } = await window.supabaseClient
      .from('group_members')
      .select('group_id, groups(id, name, description, avatar_url, created_at)')
      .eq('user_id', App.currentUser.id);
    if (error) throw error;
    return data.map(d => d.groups);
  },

  async buscarMembros(groupId) {
    const { data, error } = await window.supabaseClient
      .from('group_members')
      .select('role, profiles(id, username, full_name, avatar_url, is_online)')
      .eq('group_id', groupId);
    if (error) throw error;
    return data;
  },

  async adicionarMembro(groupId, userId) {
    const { error } = await window.supabaseClient
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role: 'member' });
    if (error) throw error;
  },

  async removerMembro(groupId, userId) {
    const { error } = await window.supabaseClient
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async promoverAdmin(groupId, userId) {
    const { error } = await window.supabaseClient
      .from('group_members')
      .update({ role: 'admin' })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async enviarMensagem(groupId, content, type = 'text') {
    const { data, error } = await window.supabaseClient
      .from('group_messages')
      .insert({ group_id: groupId, sender_id: App.currentUser.id, content, type })
      .select().single();
    if (error) throw error;
    return data;
  },

  async buscarMensagens(groupId, limit = 50) {
    const { data, error } = await window.supabaseClient
      .from('group_messages')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  inscreverMensagens(groupId, callback) {
    return window.supabaseClient
      .channel(`group:${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages',
        filter: `group_id=eq.${groupId}` }, callback)
      .subscribe();
  },

  async atualizarGrupo(groupId, updates) {
    const { data, error } = await window.supabaseClient
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select().single();
    if (error) throw error;
    return data;
  },

  async sairDoGrupo(groupId) {
    const { error } = await window.supabaseClient
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', App.currentUser.id);
    if (error) throw error;
  }
};

window.Grupos = Grupos;

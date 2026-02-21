# ChiaraGo 🌟

Rede social de mensagens estilo Messenger com design moderno e dark.

## 📋 Arquivos do Projeto

### HTML Pages
| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Lista de conversas (home) |
| `cadastro.html` | Cadastro com verificação 6 dígitos |
| `login.html` | Login + redefinição de senha |
| `chat.html` | Chat individual |
| `grupo.html` | Chat em grupo |
| `chamada.html` | Chamada de áudio/vídeo (WebRTC) |
| `perfil.html` | Visualização de perfil |
| `editar-perfil.html` | Edição do próprio perfil |
| `contatos.html` | Gerenciar contatos |
| `notificacoes.html` | Central de notificações |
| `configuracoes.html` | Configurações gerais |
| `privacidade.html` | Configurações de privacidade |
| `seguranca.html` | Segurança e senha |
| `status.html` | Status de 24h (Stories) |
| `upload.html` | Gerenciar arquivos/mídia |
| `offline.html` | Página sem conexão |
| `erro.html` | Página de erro |
| `loading.html` | Splash/loading screen |
| `email-template.html` | Template de e-mail de verificação |

### JavaScript
| Arquivo | Descrição |
|---------|-----------|
| `app.js` | Core: auth, perfil, helpers |
| `signaling.js` | WebRTC signaling via Supabase |
| `grupos.js` | CRUD de grupos e mensagens |
| `notificacoes.js` | Sistema de notificações |
| `i18n.js` | Internacionalização (pt-BR, en, es) |

### PWA
| Arquivo | Descrição |
|---------|-----------|
| `manifest.json` | PWA manifest |
| `service-worker.js` | Cache offline + push notifications |

### Database
| Arquivo | Descrição |
|---------|-----------|
| `database.sql` | Schema completo do Supabase |

---

## 🚀 Setup - Passo a Passo

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL do projeto** e a **chave anônima** (Settings → API)

### 2. Configurar Database
1. No Supabase, vá em **SQL Editor**
2. Cole e execute todo o conteúdo de `database.sql`
3. Vá em **Table Editor** e confirme que todas as tabelas foram criadas

### 3. Configurar Storage
1. Vá em **Storage** → **New Bucket**
2. Crie um bucket chamado `media` com:
   - ✅ Public bucket
   - Max file size: 52428800 (50MB)
3. Em **Policies** do bucket, adicione permissão de leitura pública e upload para usuários autenticados

### 4. Configurar Email (Verificação de Conta)
1. Vá em **Authentication** → **Email Templates**
2. Cole o conteúdo de `email-template.html` no template de "Confirm signup"
3. Em **Settings** → **SMTP**, configure seu servidor de email (ex: SendGrid, Resend)

### 5. Configurar Realtime
No SQL Editor, execute:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE ice_candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

### 6. Conectar o Projeto
Edite `app.js` nas primeiras linhas:
```javascript
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANONIMA_AQUI';
```

### 7. Criar Ícones PWA
Crie uma pasta `icons/` e adicione:
- `icon-72.png`
- `icon-96.png`
- `icon-128.png`
- `icon-192.png`
- `icon-512.png`
- `badge.png` (24x24, para notificações)

Use o logo do ChiaraGo (letra C estilizada em gradiente roxo/rosa).

### 8. Deploy
- **Local**: Use `npx serve .` ou qualquer servidor HTTP
- **Netlify**: Arraste a pasta para [netlify.com/drop](https://netlify.com/drop)
- **Vercel**: `vercel deploy`
- **GitHub Pages**: Push para repositório público

---

## 🎨 Design System

### Cores
```css
--primary: #7c3aed      /* Roxo principal */
--primary-light: #9d5cf8
--accent: #f472b6       /* Rosa accent */
--bg: #0a0a1a           /* Fundo escuro */
--surface: #13132a      /* Cards */
--online: #22c55e       /* Verde online */
```

### Tipografia
- **Títulos**: Syne (800)
- **Corpo**: DM Sans (400/500)

---

## 🔐 Funcionalidades de Autenticação

- ✅ Cadastro com verificação por código de 6 dígitos
- ✅ Login com e-mail e senha
- ✅ Redefinição de senha por e-mail
- ✅ Sessão persistente (Supabase Auth)
- ✅ Logout automático por inatividade
- ✅ 2FA (estrutura preparada)

---

## 💬 Funcionalidades de Chat

- ✅ Mensagens de texto em tempo real
- ✅ Envio de imagens e arquivos
- ✅ Indicador de digitação
- ✅ Confirmação de leitura (✓✓)
- ✅ Mensagens em grupos
- ✅ Status de 24h (Stories)
- ✅ Chamadas de áudio/vídeo (WebRTC)
- ✅ Notificações push (Web Push API)

---

## 📱 PWA

O ChiaraGo é uma PWA completa:
- ✅ Instalável no celular (Add to Home Screen)
- ✅ Funciona offline (Service Worker)
- ✅ Push notifications
- ✅ Tema nativo (theme-color)

---

## 🛠️ Tecnologias

- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **WebRTC**: Chamadas P2P com signaling via Supabase
- **PWA**: Service Worker + Web App Manifest
- **Fonts**: Google Fonts (Syne + DM Sans)

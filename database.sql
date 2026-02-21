-- ============================================================
-- ChiaraGo - Supabase Database Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(60) NOT NULL,
  email VARCHAR(255),
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  phone VARCHAR(20),
  location VARCHAR(100),
  website VARCHAR(255),
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_online ON profiles(is_online);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversation_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text', -- text | image | file | audio | video | location
  metadata JSONB DEFAULT NULL,     -- { name, size, duration, lat, lng }
  is_read BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  max_members INT DEFAULT 256,
  is_public BOOLEAN DEFAULT FALSE,
  invite_code VARCHAR(20) UNIQUE DEFAULT substring(md5(random()::text) from 1 for 12),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',  -- admin | moderator | member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  muted_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  metadata JSONB DEFAULT NULL,
  reply_to UUID REFERENCES group_messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_group_messages_group ON group_messages(group_id, created_at DESC);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nickname VARCHAR(60) DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

CREATE INDEX idx_contacts_user ON contacts(user_id);

-- ============================================================
-- BLOCKED USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- message | call | group | contact | system
  content JSONB NOT NULL DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- CALLS
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
  id VARCHAR(200) PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'ringing', -- ringing | active | ended | declined | missed
  is_video BOOLEAN DEFAULT FALSE,
  offer TEXT,
  answer TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  duration_seconds INT DEFAULT 0
);

CREATE INDEX idx_calls_caller ON calls(caller_id);
CREATE INDEX idx_calls_receiver ON calls(receiver_id);

CREATE TABLE IF NOT EXISTS ice_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id VARCHAR(200) REFERENCES calls(id) ON DELETE CASCADE,
  candidate TEXT NOT NULL,
  from_initiator BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STATUSES (Stories / 24h status)
-- ============================================================
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text', -- text | image | video
  background_color VARCHAR(20) DEFAULT NULL,
  viewers JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_statuses_user ON statuses(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Conversations - viewable by participants
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversations viewable by participants"
  ON conversations FOR SELECT TO authenticated
  USING (id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT TO authenticated WITH CHECK (true);

-- Conversation participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants visible to conversation members"
  ON conversation_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT TO authenticated WITH CHECK (true);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Messages viewable by conversation participants"
  ON messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups viewable by members"
  ON groups FOR SELECT TO authenticated
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins can update groups"
  ON groups FOR UPDATE TO authenticated
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Group members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members visible to members"
  ON group_members FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Group messages
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group messages viewable by members"
  ON group_messages FOR SELECT TO authenticated
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can send group messages"
  ON group_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own group messages"
  ON group_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can add contacts"
  ON contacts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete contacts"
  ON contacts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Blocked users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocks"
  ON blocked_users FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Calls
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Call participants can view calls"
  ON calls FOR SELECT TO authenticated
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Callers can create calls"
  ON calls FOR INSERT TO authenticated WITH CHECK (caller_id = auth.uid());
CREATE POLICY "Participants can update calls"
  ON calls FOR UPDATE TO authenticated
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- ICE candidates
ALTER TABLE ice_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Call participants can view ice candidates"
  ON ice_candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add ice candidates"
  ON ice_candidates FOR INSERT TO authenticated WITH CHECK (true);

-- Statuses
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Statuses viewable by contacts"
  ON statuses FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR
    user_id IN (SELECT contact_id FROM contacts WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create own statuses"
  ON statuses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own statuses"
  ON statuses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- REALTIME
-- Enable realtime for these tables in Supabase Dashboard
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE calls;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ice_candidates;
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ============================================================
-- STORAGE BUCKETS
-- Create these buckets in Supabase Storage:
-- 1. "media" - public bucket for avatars, images, files
--    Allowed MIME: image/*, video/*, application/pdf, etc.
--    Max file size: 52428800 (50MB)
-- ============================================================

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER on_conversation_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER on_group_updated BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update conversation updated_at when message is sent
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION handle_new_message();

-- Update profile last_seen
CREATE OR REPLACE FUNCTION update_last_seen(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET last_seen = NOW(), is_online = TRUE WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire old statuses (call periodically via pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION cleanup_expired_statuses()
RETURNS void AS $$
BEGIN
  DELETE FROM statuses WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE conversations IS 'Direct message conversations between users';
COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON TABLE groups IS 'Group chats';
COMMENT ON TABLE group_messages IS 'Messages within groups';
COMMENT ON TABLE notifications IS 'In-app and push notifications';
COMMENT ON TABLE calls IS 'WebRTC audio/video call sessions';
COMMENT ON TABLE statuses IS '24-hour ephemeral status updates';

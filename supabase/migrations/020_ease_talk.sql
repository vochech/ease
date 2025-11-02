-- Migration 018: Ease Talk - Human-Centric Communication Layer
-- Context-aware messaging with personality integration

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE talk_space_type AS ENUM ('project', 'meeting', 'topic', 'dm');
CREATE TYPE talk_message_sentiment AS ENUM ('positive', 'neutral', 'negative', 'supportive', 'concerned', 'excited', 'stressed');

-- =============================================================================
-- TABLES
-- =============================================================================

-- talk_spaces: Container for conversations (project, meeting, topic, DM)
CREATE TABLE talk_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_type talk_space_type NOT NULL,
  space_ref_id uuid, -- References project_id, meeting_id, etc.
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_archived boolean DEFAULT false
);

CREATE INDEX idx_talk_spaces_org ON talk_spaces(org_id);
CREATE INDEX idx_talk_spaces_type ON talk_spaces(space_type);
CREATE INDEX idx_talk_spaces_ref ON talk_spaces(space_ref_id);

-- talk_threads: Focused conversations within a space
CREATE TABLE talk_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES talk_spaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  context_summary text, -- AI-generated summary of thread purpose
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  is_resolved boolean DEFAULT false,
  participant_count integer DEFAULT 1
);

CREATE INDEX idx_talk_threads_space ON talk_threads(space_id);
CREATE INDEX idx_talk_threads_last_message ON talk_threads(last_message_at DESC);

-- talk_messages: Individual messages with sentiment tracking
CREATE TABLE talk_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES talk_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES user_profiles(id),
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Sentiment & Context Metadata
  sentiment talk_message_sentiment,
  tone_analysis jsonb, -- { clarity: 0.8, empathy: 0.9, urgency: 0.3 }
  context_tags text[], -- ['decision', 'blocker', 'celebration']
  
  -- AI-generated metadata
  ai_summary text, -- Short summary for long messages
  suggested_actions jsonb, -- [{ type: 'task', text: 'Follow up with team' }]
  
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz,
  is_deleted boolean DEFAULT false
);

CREATE INDEX idx_talk_messages_thread ON talk_messages(thread_id, created_at);
CREATE INDEX idx_talk_messages_sender ON talk_messages(sender_id);

-- talk_reactions: Emotional reactions (like Slack reactions)
CREATE TABLE talk_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES talk_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  reaction text NOT NULL, -- '👍', '❤️', '🎉', '🤔', '😔'
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

CREATE INDEX idx_talk_reactions_message ON talk_reactions(message_id);

-- talk_participants: Track who's actively involved in threads
CREATE TABLE talk_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES talk_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id),
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  is_muted boolean DEFAULT false,
  UNIQUE(thread_id, user_id)
);

CREATE INDEX idx_talk_participants_thread ON talk_participants(thread_id);
CREATE INDEX idx_talk_participants_user ON talk_participants(user_id);

-- talk_thread_context: Connects threads to external entities
CREATE TABLE talk_thread_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES talk_threads(id) ON DELETE CASCADE,
  context_type text NOT NULL, -- 'task', 'meeting', 'project', 'document'
  context_id uuid NOT NULL,
  context_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_talk_thread_context_thread ON talk_thread_context(thread_id);
CREATE INDEX idx_talk_thread_context_type ON talk_thread_context(context_type, context_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update thread's last_message_at when new message is posted
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE talk_threads
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_last_message
  AFTER INSERT ON talk_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_last_message();

-- Get unread message count for user in thread
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id uuid, p_thread_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM talk_messages m
  LEFT JOIN talk_participants p ON p.thread_id = m.thread_id AND p.user_id = p_user_id
  WHERE m.thread_id = p_thread_id
    AND m.created_at > COALESCE(p.last_read_at, '1970-01-01'::timestamptz)
    AND m.sender_id != p_user_id
    AND m.is_deleted = false;
$$ LANGUAGE sql STABLE;

-- Get thread summary with personality-aware context
CREATE OR REPLACE FUNCTION get_thread_summary(p_thread_id uuid, p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  user_personality text;
  user_workload text;
  user_mood text;
BEGIN
  -- Get user's personality context
  SELECT 
    bp.personality_type,
    cs.workload_level,
    cs.mood_level
  INTO user_personality, user_workload, user_mood
  FROM profiles p
  LEFT JOIN behavioral_profiles bp ON bp.user_id = p.id
  LEFT JOIN context_snapshots cs ON cs.user_id = p.id
  WHERE p.id = p_user_id
  ORDER BY cs.captured_at DESC
  LIMIT 1;

  -- Build summary
  SELECT jsonb_build_object(
    'thread_id', t.id,
    'title', t.title,
    'message_count', COUNT(m.id),
    'participant_count', t.participant_count,
    'last_activity', t.last_message_at,
    'avg_sentiment', AVG(
      CASE m.sentiment
        WHEN 'positive' THEN 1.0
        WHEN 'supportive' THEN 0.8
        WHEN 'excited' THEN 0.9
        WHEN 'neutral' THEN 0.5
        WHEN 'concerned' THEN 0.3
        WHEN 'stressed' THEN 0.2
        WHEN 'negative' THEN 0.1
        ELSE 0.5
      END
    ),
    'tone_indicators', jsonb_agg(DISTINCT m.sentiment) FILTER (WHERE m.sentiment IS NOT NULL),
    'user_context', jsonb_build_object(
      'personality', user_personality,
      'workload', user_workload,
      'mood', user_mood
    )
  ) INTO result
  FROM talk_threads t
  LEFT JOIN talk_messages m ON m.thread_id = t.id AND m.is_deleted = false
  WHERE t.id = p_thread_id
  GROUP BY t.id;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE talk_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE talk_thread_context ENABLE ROW LEVEL SECURITY;

-- Spaces: visible to org members
CREATE POLICY talk_spaces_org_members ON talk_spaces
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Threads: visible to space participants
CREATE POLICY talk_threads_participants ON talk_threads
  FOR ALL
  USING (
    space_id IN (
      SELECT s.id FROM talk_spaces s
      JOIN org_members om ON om.org_id = s.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Messages: visible to thread participants
CREATE POLICY talk_messages_participants ON talk_messages
  FOR ALL
  USING (
    thread_id IN (
      SELECT t.id FROM talk_threads t
      JOIN talk_spaces s ON s.id = t.space_id
      JOIN org_members om ON om.org_id = s.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Reactions: visible to all, creatable by authenticated users
CREATE POLICY talk_reactions_view ON talk_reactions
  FOR SELECT
  USING (true);

CREATE POLICY talk_reactions_create ON talk_reactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY talk_reactions_delete ON talk_reactions
  FOR DELETE
  USING (user_id = auth.uid());

-- Participants: self-manageable
CREATE POLICY talk_participants_self ON talk_participants
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Context: visible to thread participants
CREATE POLICY talk_thread_context_view ON talk_thread_context
  FOR SELECT
  USING (
    thread_id IN (
      SELECT t.id FROM talk_threads t
      JOIN talk_spaces s ON s.id = t.space_id
      JOIN org_members om ON om.org_id = s.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- =============================================================================
-- VISIBILITY RULES (Feature Access)
-- =============================================================================

-- Insert visibility rules for Talk features

-- FREE: Basic messaging
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('talk_basic', 'talk_spaces', '*', 'member', 'free', false, false, 'Basic messaging in spaces'),
  ('talk_threads', 'talk_threads', '*', 'member', 'free', false, false, 'Create and participate in threads');

-- TEAM: AI insights
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('talk_ai_insights', 'talk_messages', 'tone_analysis,sentiment', 'member', 'team', false, false, 'AI-generated summaries and tone analysis');

-- BUSINESS: Sentiment + personality
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('talk_sentiment_tracking', 'talk_messages', 'sentiment,context_tags', 'member', 'business', false, false, 'Sentiment and mood tracking'),
  ('talk_personality_adaptation', 'behavioral_profiles', '*', 'member', 'business', false, false, 'Personality-aware message adaptation');

-- ENTERPRISE: Advanced analytics
INSERT INTO data_visibility_rules (feature_key, table_name, column_name, min_role, min_subscription_tier, self_only, aggregated_only, description)
VALUES
  ('talk_advanced_analytics', 'talk_messages', '*', 'manager', 'enterprise', false, true, 'Team communication analytics');

-- =============================================================================
-- SEED DATA (Optional - for development)
-- =============================================================================

-- Example: Create a "General" space for each org
-- INSERT INTO talk_spaces (org_id, space_type, title, description, created_by)
-- SELECT 
--   o.id,
--   'topic'::talk_space_type,
--   'General',
--   'Organization-wide announcements and discussions',
--   om.user_id
-- FROM organizations o
-- JOIN org_members om ON om.org_id = o.id AND om.role = 'owner'
-- LIMIT 1;

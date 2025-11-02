-- Create meeting_notes table for AI-generated notes from transcripts
CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by meeting
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting_id ON meeting_notes(meeting_id);

-- Enable RLS
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies: Users can view notes for meetings they can access
CREATE POLICY "Users can view meeting notes for accessible meetings"
  ON meeting_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_notes.meeting_id
    )
  );

-- Users can create notes for meetings they participate in
CREATE POLICY "Users can create meeting notes"
  ON meeting_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meeting_participants mp
      WHERE mp.meeting_id = meeting_notes.meeting_id
      AND mp.user_id = auth.uid()
    )
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own notes"
  ON meeting_notes
  FOR UPDATE
  USING (created_by = auth.uid());

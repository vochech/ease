-- Migration 007: Add meetings table
-- Meetings are organization-level events with participants

-- Drop old meetings table if exists (from migration 001)
DROP TABLE IF EXISTS public.meetings CASCADE;

-- Create new meetings table
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text,
  meeting_link text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meeting participants (many-to-many)
CREATE TABLE public.meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Indexes
CREATE INDEX idx_meetings_org_id ON public.meetings(org_id);
CREATE INDEX idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX idx_meetings_created_by ON public.meetings(created_by);
CREATE INDEX idx_meeting_participants_meeting_id ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user_id ON public.meeting_participants(user_id);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- Meetings policies
CREATE POLICY "Users can view org meetings"
  ON public.meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members.org_id = meetings.org_id 
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and managers can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members.org_id = meetings.org_id 
      AND org_members.user_id = auth.uid() 
      AND org_members.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Authorized users can update meetings"
  ON public.meetings FOR UPDATE
  USING (
    meetings.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members.org_id = meetings.org_id 
      AND org_members.user_id = auth.uid() 
      AND org_members.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "Authorized users can delete meetings"
  ON public.meetings FOR DELETE
  USING (
    meetings.created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.org_members 
      WHERE org_members.org_id = meetings.org_id 
      AND org_members.user_id = auth.uid() 
      AND org_members.role = 'owner'
    )
  );

-- Meeting participants policies
CREATE POLICY "Users can view meeting participants"
  ON public.meeting_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      INNER JOIN public.org_members om ON m.org_id = om.org_id
      WHERE m.id = meeting_participants.meeting_id 
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Authorized users can add participants"
  ON public.meeting_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_participants.meeting_id
      AND (
        m.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.org_id = m.org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can update their own status"
  ON public.meeting_participants FOR UPDATE
  USING (meeting_participants.user_id = auth.uid());

CREATE POLICY "Authorized users can remove participants"
  ON public.meeting_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_participants.meeting_id
      AND (
        m.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.org_members om
          WHERE om.org_id = m.org_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner', 'manager')
        )
      )
    )
  );

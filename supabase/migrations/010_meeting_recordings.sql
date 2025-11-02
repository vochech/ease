-- Migration: Add meeting_recordings table
-- Created: 2025-10-31

create table if not exists meeting_recordings (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  storage_path text not null,
  file_size bigint,
  duration_seconds int,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for finding recordings by meeting
create index if not exists idx_meeting_recordings_meeting_id on meeting_recordings(meeting_id);

-- RLS policies
alter table meeting_recordings enable row level security;

-- Users can view recordings for meetings in their orgs
create policy "Users can view recordings in their orgs"
  on meeting_recordings for select
  using (
    exists (
      select 1 from meetings m
      join org_members om on om.org_id = m.org_id
      where m.id = meeting_recordings.meeting_id
        and om.user_id = auth.uid()
    )
  );

-- Users can create recordings for meetings in their orgs
create policy "Users can create recordings in their orgs"
  on meeting_recordings for insert
  with check (
    exists (
      select 1 from meetings m
      join org_members om on om.org_id = m.org_id
      where m.id = meeting_recordings.meeting_id
        and om.user_id = auth.uid()
    )
  );

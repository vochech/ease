-- 008: Meeting chat and notes

-- Chat messages stored per meeting
create table if not exists public.meeting_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_meeting_messages_meeting_id on public.meeting_messages(meeting_id);
create index if not exists idx_meeting_messages_user_id on public.meeting_messages(user_id);

alter table public.meeting_messages enable row level security;

-- Members of the meeting's org can read messages
create policy "Org members can read messages"
  on public.meeting_messages for select
  using (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_messages.meeting_id
      and om.user_id = auth.uid()
    )
  );

-- Any org member can write messages (optionally restrict to meeting participants)
create policy "Org members can write messages"
  on public.meeting_messages for insert
  with check (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_messages.meeting_id
      and om.user_id = auth.uid()
    )
  );

-- Allow authors and owners/managers to delete
create policy "Authors/owners can delete messages"
  on public.meeting_messages for delete
  using (
    meeting_messages.user_id = auth.uid() or exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_messages.meeting_id
      and om.user_id = auth.uid()
      and om.role in ('owner','manager')
    )
  );

-- Meeting notes (transcript + summary)
create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  transcript text,
  summary text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_meeting_notes_meeting_id on public.meeting_notes(meeting_id);

alter table public.meeting_notes enable row level security;

create policy "Org members can read notes"
  on public.meeting_notes for select
  using (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_notes.meeting_id
      and om.user_id = auth.uid()
    )
  );

create policy "Owners/managers can write notes"
  on public.meeting_notes for insert
  with check (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_notes.meeting_id
      and om.user_id = auth.uid()
      and om.role in ('owner','manager')
    )
  );

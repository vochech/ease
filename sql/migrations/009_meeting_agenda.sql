-- 009: Meeting agenda

create table if not exists public.meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id),
  duration_minutes integer,
  item_order integer not null default 0,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_meeting_agenda_items_meeting_id on public.meeting_agenda_items(meeting_id);
create index if not exists idx_meeting_agenda_items_assigned_to on public.meeting_agenda_items(assigned_to);

alter table public.meeting_agenda_items enable row level security;

-- Org members can read agenda
create policy "Org members can read agenda"
  on public.meeting_agenda_items for select
  using (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_agenda_items.meeting_id
      and om.user_id = auth.uid()
    )
  );

-- Owner/manager can create agenda items
create policy "Owners/managers can create agenda"
  on public.meeting_agenda_items for insert
  with check (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_agenda_items.meeting_id
      and om.user_id = auth.uid()
      and om.role in ('owner','manager')
    )
  );

-- Owner/manager can update all items, members can update only their assigned items (completed status)
create policy "Authorized users can update agenda"
  on public.meeting_agenda_items for update
  using (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_agenda_items.meeting_id
      and om.user_id = auth.uid()
      and (
        om.role in ('owner','manager')
        or meeting_agenda_items.assigned_to = auth.uid()
      )
    )
  );

-- Owner/manager can delete agenda items
create policy "Owners/managers can delete agenda"
  on public.meeting_agenda_items for delete
  using (
    exists (
      select 1 from public.meetings m
      join public.org_members om on om.org_id = m.org_id
      where m.id = meeting_agenda_items.meeting_id
      and om.user_id = auth.uid()
      and om.role in ('owner','manager')
    )
  );

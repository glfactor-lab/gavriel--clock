create table if not exists public.shifts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.shifts enable row level security;

create policy "Users can read their own shifts"
on public.shifts for select
using (auth.uid() = user_id);

create policy "Users can insert their own shifts"
on public.shifts for insert
with check (auth.uid() = user_id);

create policy "Users can update their own shifts"
on public.shifts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own shifts"
on public.shifts for delete
using (auth.uid() = user_id);

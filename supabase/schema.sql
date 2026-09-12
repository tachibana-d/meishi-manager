create table if not exists public.business_cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_cards enable row level security;

create policy "Users can view their own cards"
  on public.business_cards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cards"
  on public.business_cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cards"
  on public.business_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own cards"
  on public.business_cards for delete
  using (auth.uid() = user_id);

create index if not exists business_cards_user_id_idx on public.business_cards(user_id);

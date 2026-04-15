create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  subscription_status text default 'inactive',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

alter table public.profiles
  add column if not exists subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium'));

alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles
  add column if not exists stripe_subscription_id text;

alter table public.profiles
  add column if not exists stripe_price_id text;

alter table public.profiles
  add column if not exists subscription_status text default 'inactive';

create table if not exists public.user_app_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'vitalyx-user'), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name;

  insert into public.user_app_data (user_id, data)
  values (
    new.id,
    jsonb_build_object(
      'planner', '[]'::jsonb,
      'groceryLists', '[]'::jsonb,
      'manualPriceRecords', '[]'::jsonb,
      'workoutLog', '[]'::jsonb,
      'workoutPlans', '[]'::jsonb,
      'cardioLog', '[]'::jsonb,
      'favoriteExerciseIds', '[]'::jsonb,
      'recentExerciseIds', '[]'::jsonb,
      'recentExerciseSearches', '[]'::jsonb,
      'usageDates', '[]'::jsonb
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_app_data enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);


drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

revoke update (role, subscription_tier, stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_status)
on public.profiles
from authenticated;

grant update (display_name, email)
on public.profiles
to authenticated;

drop policy if exists "user_app_data_select_own" on public.user_app_data;
create policy "user_app_data_select_own"
on public.user_app_data
for select
using (auth.uid() = user_id);

drop policy if exists "user_app_data_insert_own" on public.user_app_data;
create policy "user_app_data_insert_own"
on public.user_app_data
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_app_data_update_own" on public.user_app_data;
create policy "user_app_data_update_own"
on public.user_app_data
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

update public.profiles
set role = 'admin',
    subscription_tier = 'premium'
where email = 'VitalyxHealth@gmail.com';

-- ============================================================
-- Shared UPC product cache
-- Written server-side via service role only.
-- Any barcode successfully resolved from any external source
-- is upserted here so future lookups skip external APIs entirely.
-- ============================================================
create table if not exists public.upc_cache (
  barcode      text primary key,
  name         text not null,
  brand        text,
  category     text,
  source_label text not null,
  cached_at    timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now())
);

alter table public.upc_cache enable row level security;

drop policy if exists "upc_cache_public_read" on public.upc_cache;
create policy "upc_cache_public_read"
on public.upc_cache
for select
using (true);

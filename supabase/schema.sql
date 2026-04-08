create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

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

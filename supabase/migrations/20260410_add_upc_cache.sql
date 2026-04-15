-- Migration: add shared UPC product cache
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

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

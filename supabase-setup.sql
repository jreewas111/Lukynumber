-- Run once in Supabase SQL Editor. Safe to re-run.
create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  number text not null check (number ~ '^(0[1-9]|[1-9][0-9])$'),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (phone ~ '^0[0-9]{9}$'),
  slip_path text not null,
  status text not null default 'pending' check (status in ('pending','approved')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create unique index if not exists bookings_active_number_unique on public.bookings(number)
where status in ('pending','approved');

alter table public.bookings enable row level security;
drop policy if exists "public may create bookings" on public.bookings;
create policy "public may create bookings" on public.bookings for insert to anon
with check (status = 'pending' and char_length(name) between 2 and 120 and phone ~ '^0[0-9]{9}$');
drop policy if exists "admins manage bookings" on public.bookings;
create policy "admins manage bookings" on public.bookings for all to authenticated
using (true) with check (true);

create or replace view public.public_number_status with (security_invoker = false) as
select number, status from public.bookings
where status = 'approved' or expires_at > now();
grant select on public.public_number_status to anon, authenticated;
revoke all on public.bookings from anon;
grant insert on public.bookings to anon;
grant all on public.bookings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-slips','booking-slips',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "public upload booking slips" on storage.objects;
create policy "public upload booking slips" on storage.objects for insert to anon
with check (bucket_id='booking-slips');
drop policy if exists "admins read booking slips" on storage.objects;
create policy "admins read booking slips" on storage.objects for select to authenticated
using (bucket_id='booking-slips');
drop policy if exists "admins delete booking slips" on storage.objects;
create policy "admins delete booking slips" on storage.objects for delete to authenticated
using (bucket_id='booking-slips');

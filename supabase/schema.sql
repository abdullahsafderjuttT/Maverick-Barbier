-- ============================================================
-- Maverick Barbier — Supabase schema
-- Run once in your Supabase project's SQL editor.
--
-- Efficiency choices made here (vs. a plain text-only table):
--   1. status is a Postgres ENUM, not free text — 1 byte on disk
--      instead of a variable-length string, and the DB rejects
--      typos ('cofirmed') at write time instead of at read time.
--   2. Targeted indexes only where queries actually need them
--      (by date, by status, by email) — no blanket "index
--      everything," which would slow down every insert for no
--      benefit.
--   3. A partial UNIQUE index stops two people double-booking the
--      same barber at the same date+time at the database level —
--      no need for the app to race-check this itself.
--   4. CHECK constraints reject obviously-bad rows (empty name,
--      malformed email, past dates) before they're ever written,
--      instead of filtering bad data out later.
--   5. updated_at is maintained by a trigger, not by the client —
--      one less thing the front end has to remember to set.
-- ============================================================

-- ---------- status enum ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
  end if;
end $$;

-- ---------- table ----------
create table if not exists public.reservations (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  name          text not null check (char_length(trim(name)) > 0),
  phone         text not null check (char_length(trim(phone)) >= 7),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  service       text not null,
  barber        text not null default 'No preference',

  booking_date  date not null check (booking_date >= current_date),
  booking_time  time not null,

  notes         text,
  status        public.reservation_status not null default 'pending'
);

-- ---------- indexes (only the ones the app / staff dashboard actually query by) ----------

-- staff view: "what's booked on this day"
create index if not exists idx_reservations_booking_date
  on public.reservations (booking_date);

-- staff view: "what's still pending / needs confirming" — partial index, tiny and fast
-- since it only covers the rows that matter (finished/cancelled bookings drop out of it)
create index if not exists idx_reservations_pending
  on public.reservations (booking_date, booking_time)
  where status = 'pending';

-- optional: look up a customer's past bookings by email
create index if not exists idx_reservations_email
  on public.reservations (email);

-- prevent double-booking the same barber for the same date + time slot;
-- ignores cancelled rows and "No preference" so those never collide
create unique index if not exists uq_reservations_barber_slot
  on public.reservations (barber, booking_date, booking_time)
  where status <> 'cancelled' and barber <> 'No preference';

-- ---------- keep updated_at current without relying on the client ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
  before update on public.reservations
  for each row
  execute function public.set_updated_at();

-- ---------- row level security ----------
alter table public.reservations enable row level security;

-- customers (using the public anon key) may only INSERT their own booking request
drop policy if exists "Anyone can submit a reservation" on public.reservations;
create policy "Anyone can submit a reservation"
  on public.reservations
  for insert
  to anon
  with check (
    status = 'pending'          -- can't create a booking that's already "confirmed"
    and booking_date >= current_date
  );

-- NOTE: intentionally no SELECT / UPDATE / DELETE policy for "anon" —
-- customers can submit a booking but can't read, edit, or cancel anyone's
-- (including their own) row through the public API. Manage bookings from
-- the Supabase Table Editor, or build a separate authenticated staff view.

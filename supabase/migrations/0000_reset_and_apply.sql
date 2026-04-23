-- Reset old justice_hire schema and apply craigslist schema.
-- Paste the whole thing into: Supabase Dashboard -> SQL Editor -> New query -> Run.

-- ============================================================
-- 1. Drop old Prisma-style tables (case-sensitive, hence quoted)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;

drop table if exists "Review" cascade;
drop table if exists "EmployerProfile" cascade;
drop table if exists "Business" cascade;
drop table if exists "Otp" cascade;
drop table if exists "PasswordResetToken" cascade;
drop table if exists "PendingSignup" cascade;
drop table if exists "User" cascade;

-- Also drop the new (lowercase) tables in case a partial run happened
drop table if exists public.reports cascade;
drop table if exists public.reviews cascade;
drop table if exists public.bookings cascade;
drop table if exists public.availability_slots cascade;
drop table if exists public.activities cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- 2. Schema (from 0001_initial_schema.sql)
-- ============================================================
create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'guest' check (role in ('guest', 'host', 'both', 'admin')),
  display_name text,
  age int check (age is null or age between 18 and 120),
  city text,
  tagline text,
  bio text,
  photo_url text,
  hourly_rate_cents int check (hourly_rate_cents is null or hourly_rate_cents >= 0),
  id_verified_at timestamptz,
  background_checked_at timestamptz,
  sumup_merchant_code text,
  sumup_email text,
  sumup_access_token text,
  sumup_refresh_token text,
  sumup_token_expires_at timestamptz,
  host_status text default 'none' check (host_status in ('none', 'waitlist', 'approved', 'rejected', 'suspended')),
  created_at timestamptz default now()
);

create index profiles_city_idx on profiles (city);
create index profiles_host_status_idx on profiles (host_status);

create table activities (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles on delete cascade,
  label text not null,
  description text,
  created_at timestamptz default now()
);

create index activities_host_idx on activities (host_id);

create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles on delete cascade,
  starts_at timestamptz not null,
  duration_minutes int not null default 60 check (duration_minutes between 15 and 480),
  status text not null default 'open' check (status in ('open', 'booked', 'blocked')),
  created_at timestamptz default now(),
  unique (host_id, starts_at)
);

create index availability_host_starts_idx on availability_slots (host_id, starts_at);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references availability_slots on delete restrict,
  guest_id uuid not null references profiles on delete restrict,
  host_id uuid not null references profiles on delete restrict,
  activity_id uuid references activities on delete set null,
  meeting_location text,
  amount_cents int not null check (amount_cents >= 0),
  sumup_checkout_id text,
  sumup_checkout_reference text unique,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  booking_status text not null default 'pending_payment' check (
    booking_status in ('pending_payment', 'confirmed', 'checked_in', 'completed', 'cancelled', 'disputed')
  ),
  guest_checked_in_at timestamptz,
  host_checked_in_at timestamptz,
  emergency_contact_phone text,
  created_at timestamptz default now()
);

create index bookings_guest_idx on bookings (guest_id);
create index bookings_host_idx on bookings (host_id);
create index bookings_slot_idx on bookings (slot_id);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings on delete cascade unique,
  reviewer_id uuid not null references profiles on delete cascade,
  reviewee_id uuid not null references profiles on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create index reviews_reviewee_idx on reviews (reviewee_id);

create table reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings on delete set null,
  reporter_id uuid not null references profiles on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz default now()
);

create index reports_status_idx on reports (status);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'guest');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for any existing auth.users
insert into public.profiles (id, role)
select id, 'guest' from auth.users
on conflict (id) do nothing;

-- ============================================================
-- 3. RLS policies (from 0002_rls_policies.sql)
-- ============================================================
alter table profiles enable row level security;
alter table activities enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table reports enable row level security;

create or replace function is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "approved hosts are public"
  on profiles for select
  using (host_status = 'approved' or auth.uid() = id or is_admin());

create policy "users update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "admins manage all profiles"
  on profiles for all
  using (is_admin())
  with check (is_admin());

create policy "activities are public"
  on activities for select using (true);

create policy "host manages own activities"
  on activities for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "availability is public"
  on availability_slots for select using (true);

create policy "host manages own availability"
  on availability_slots for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

create policy "participants read their bookings"
  on bookings for select
  using (auth.uid() = guest_id or auth.uid() = host_id or is_admin());

create policy "guest creates own booking"
  on bookings for insert
  with check (auth.uid() = guest_id);

create policy "participants update their bookings"
  on bookings for update
  using (auth.uid() = guest_id or auth.uid() = host_id)
  with check (auth.uid() = guest_id or auth.uid() = host_id);

create policy "reviews are public"
  on reviews for select using (true);

create policy "reviewer creates own review"
  on reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "reviewer updates own review"
  on reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

create policy "reporter creates own report"
  on reports for insert
  with check (auth.uid() = reporter_id);

create policy "reporter reads own report"
  on reports for select
  using (auth.uid() = reporter_id or is_admin());

create policy "admin manages reports"
  on reports for all
  using (is_admin())
  with check (is_admin());

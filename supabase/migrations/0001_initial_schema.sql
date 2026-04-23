-- Company: initial schema
-- Profiles extend auth.users with marketplace-specific fields.

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

-- Auto-create a profile row whenever a new auth.user is created.
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

-- Row Level Security policies.
-- Default is deny-all; we open up specifically per role and per row.

alter table profiles enable row level security;
alter table activities enable row level security;
alter table availability_slots enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table reports enable row level security;

-- Helper: is the caller an admin?
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

-- profiles ------------------------------------------------------------
-- Anyone (incl. anon) can read approved host profiles for browse.
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

-- activities ----------------------------------------------------------
create policy "activities are public"
  on activities for select using (true);

create policy "host manages own activities"
  on activities for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- availability_slots --------------------------------------------------
create policy "availability is public"
  on availability_slots for select using (true);

create policy "host manages own availability"
  on availability_slots for all
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- bookings ------------------------------------------------------------
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

-- reviews -------------------------------------------------------------
create policy "reviews are public"
  on reviews for select using (true);

create policy "reviewer creates own review"
  on reviews for insert
  with check (auth.uid() = reviewer_id);

create policy "reviewer updates own review"
  on reviews for update
  using (auth.uid() = reviewer_id)
  with check (auth.uid() = reviewer_id);

-- reports -------------------------------------------------------------
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

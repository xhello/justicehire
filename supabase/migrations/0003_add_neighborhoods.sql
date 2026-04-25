-- Add neighborhoods array to profiles for granular location filtering.
-- Pattern borrowed from escort directories (Tryst etc.) — public profile shows
-- the city + neighborhoods worked, but exact meeting address lives only on
-- bookings.meeting_location, which is RLS-gated to participants.

alter table profiles
  add column if not exists neighborhoods text[] not null default '{}';

create index if not exists profiles_neighborhoods_idx
  on profiles using gin (neighborhoods);

-- Seed updates for the demo hosts so the new field shows something on browse.
update profiles set neighborhoods = array['Inner Southeast', 'Eastbank Esplanade', 'Hawthorne']
  where display_name = 'Ana Lindqvist';
update profiles set neighborhoods = array['Clinton Hill', 'Fort Greene', 'Bed-Stuy']
  where display_name = 'Marcus Tran';
update profiles set neighborhoods = array['East Austin', 'Downtown', 'South Congress']
  where display_name = 'Priya Shah';

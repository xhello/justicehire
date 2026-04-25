export type Profile = {
  id: string;
  role: "guest" | "host" | "both" | "admin";
  display_name: string | null;
  age: number | null;
  city: string | null;
  neighborhoods: string[] | null;
  tagline: string | null;
  bio: string | null;
  photo_url: string | null;
  hourly_rate_cents: number | null;
  id_verified_at: string | null;
  background_checked_at: string | null;
  host_status: "none" | "waitlist" | "approved" | "rejected" | "suspended";
};

export type Activity = {
  id: string;
  host_id: string;
  label: string;
  description: string | null;
};

export type AvailabilitySlot = {
  id: string;
  host_id: string;
  starts_at: string;
  duration_minutes: number;
  status: "open" | "booked" | "blocked";
};

export type Review = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

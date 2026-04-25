import type { Activity, AvailabilitySlot, Profile, Review } from "@/lib/types";

export const mockProfile: Profile = {
  id: "preview",
  role: "host",
  display_name: "Maren Holloway",
  age: 31,
  city: "San Francisco",
  neighborhoods: ["Bernal Heights", "Mission", "Hayes Valley"],
  tagline:
    "Long walks, small museums, the kind of dinner that runs three hours.",
  bio: "Architect by day, amateur cartographer on weekends. I moved to SF in 2019 from a town you've never heard of in upstate New York, and I've spent the years since trying to find every staircase in the city. I'll happily show you my favorites — Filbert Steps for tourists, the Vulcan Stairway when you want to feel like you've left the city. I read more than I should and I'll usually pick the restaurant if you let me. Equally happy in a museum or a bar — although I'd prefer not to do both in the same evening.",
  photo_url:
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80",
  hourly_rate_cents: 4500,
  id_verified_at: "2025-09-12T00:00:00Z",
  background_checked_at: "2025-09-15T00:00:00Z",
  host_status: "approved",
};

export const mockActivities: Activity[] = [
  {
    id: "a1",
    host_id: "preview",
    label: "Coffee + walk",
    description:
      "Pick a neighborhood; we'll get a flat white and walk it for an hour.",
  },
  {
    id: "a2",
    host_id: "preview",
    label: "Museum tour",
    description:
      "I have strong opinions about SFMOMA's permanent collection. Bring questions.",
  },
  {
    id: "a3",
    host_id: "preview",
    label: "Long dinner",
    description:
      "Two- or three-hour dinner at a place I've vetted. Conversation, no rush.",
  },
  {
    id: "a4",
    host_id: "preview",
    label: "Hill walk",
    description: "A loop through one of SF's stairway neighborhoods. Wear shoes.",
  },
];

export const mockSlots: AvailabilitySlot[] = (() => {
  const slots: AvailabilitySlot[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const openHours: Record<number, number[]> = {
    0: [10, 11, 14, 15],
    1: [18, 19, 20],
    2: [9, 10, 17, 18],
    3: [],
    4: [12, 13, 14, 19, 20],
    5: [10, 11, 16, 17, 18, 19],
    6: [10, 11, 12, 13, 14, 15],
  };
  const bookedHours: Record<number, number[]> = {
    1: [12],
    4: [16],
    5: [12, 13],
  };
  for (let d = 0; d < 7; d++) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    for (const h of openHours[d] ?? []) {
      const dt = new Date(day);
      dt.setHours(h, 0, 0, 0);
      slots.push({
        id: `s-${d}-${h}`,
        host_id: "preview",
        starts_at: dt.toISOString(),
        duration_minutes: 60,
        status: "open",
      });
    }
    for (const h of bookedHours[d] ?? []) {
      const dt = new Date(day);
      dt.setHours(h, 0, 0, 0);
      slots.push({
        id: `b-${d}-${h}`,
        host_id: "preview",
        starts_at: dt.toISOString(),
        duration_minutes: 60,
        status: "booked",
      });
    }
  }
  return slots;
})();

export const mockReviews: Review[] = [
  {
    id: "r1",
    reviewer_id: "u1",
    reviewee_id: "preview",
    rating: 5,
    comment:
      "Maren is exactly who her profile says she is. We walked Bernal Heights for an hour and I left wanting to move to the city.",
    created_at: "2026-03-14T00:00:00Z",
  },
  {
    id: "r2",
    reviewer_id: "u2",
    reviewee_id: "preview",
    rating: 5,
    comment:
      "Booked a museum hour and ended up staying through dinner. Great recommendations, very easy to talk to.",
    created_at: "2026-02-08T00:00:00Z",
  },
  {
    id: "r3",
    reviewer_id: "u3",
    reviewee_id: "preview",
    rating: 4,
    comment: "Lovely conversation. The cafe she picked was loud but the company made up for it.",
    created_at: "2026-01-22T00:00:00Z",
  },
];

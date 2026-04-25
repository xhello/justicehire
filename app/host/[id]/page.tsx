import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/format";
import AvailabilityGrid from "./AvailabilityGrid";
import type { Activity, AvailabilitySlot, Profile, Review } from "@/lib/types";
import {
  mockActivities,
  mockProfile,
  mockReviews,
  mockSlots,
} from "@/lib/mockData";

export const revalidate = 60;

const PREVIEW_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function HostPage({ params }: { params: { id: string } }) {
  let profile: Profile | null;
  let activities: Activity[] | null;
  let slots: AvailabilitySlot[] | null;
  let reviews: Review[] | null;

  if (PREVIEW_MODE || params.id === "preview") {
    profile = mockProfile;
    activities = mockActivities;
    slots = mockSlots;
    reviews = mockReviews;
  } else {
    const supabase = createClient();
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .eq("host_status", "approved")
      .maybeSingle<Profile>();
    if (!p) notFound();
    profile = p;

    const [a, s, r] = await Promise.all([
      supabase.from("activities").select("*").eq("host_id", params.id),
      supabase
        .from("availability_slots")
        .select("*")
        .eq("host_id", params.id)
        .gte("starts_at", new Date().toISOString())
        .lte(
          "starts_at",
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order("starts_at"),
      supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", params.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    activities = a.data as Activity[] | null;
    slots = s.data as AvailabilitySlot[] | null;
    reviews = r.data as Review[] | null;
  }

  if (!profile) notFound();

  const avgRating =
    reviews && reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Host profile · {profile.city ?? "—"}
        </p>
        {profile.neighborhoods && profile.neighborhoods.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.neighborhoods.map((n) => (
              <span
                key={n}
                className="border border-line px-2.5 py-0.5 text-xs text-muted"
              >
                {n}
              </span>
            ))}
          </div>
        )}

        <header className="mt-6 grid gap-12 border-b border-line pb-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="font-display text-6xl leading-[0.95] tracking-tight md:text-7xl">
              {profile.display_name}
              {profile.age ? `, ${profile.age}` : ""}
            </h1>
            {profile.tagline && (
              <p className="mt-6 max-w-xl font-display text-2xl leading-snug text-ink">
                &ldquo;{profile.tagline}&rdquo;
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <span>
                <span className="text-muted">Rate · </span>
                <span className="font-display text-lg">
                  {formatCents(profile.hourly_rate_cents)}
                </span>{" "}
                <span className="text-muted">/ hour</span>
              </span>
              {avgRating != null && (
                <span>
                  <span className="text-muted">Rating · </span>
                  <span className="font-display text-lg">{avgRating.toFixed(1)}</span>{" "}
                  <span className="text-muted">({reviews?.length} reviews)</span>
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {profile.id_verified_at && (
                <Badge>ID verified</Badge>
              )}
              {profile.background_checked_at && (
                <Badge>Background checked</Badge>
              )}
            </div>
          </div>

          <aside className="md:col-span-5">
            <div
              className="aspect-[4/5] w-full rounded-sm bg-line bg-cover bg-center"
              style={
                profile.photo_url
                  ? { backgroundImage: `url(${profile.photo_url})` }
                  : undefined
              }
              role="img"
              aria-label={`Photo of ${profile.display_name}`}
            />
          </aside>
        </header>

        {profile.bio && (
          <section className="grid gap-12 border-b border-line py-12 md:grid-cols-12">
            <h2 className="md:col-span-3 font-display text-3xl">About</h2>
            <div className="md:col-span-9 max-w-2xl whitespace-pre-line text-base leading-relaxed">
              {profile.bio}
            </div>
          </section>
        )}

        {activities && activities.length > 0 && (
          <section className="grid gap-12 border-b border-line py-12 md:grid-cols-12">
            <h2 className="md:col-span-3 font-display text-3xl">Activities</h2>
            <div className="md:col-span-9 grid gap-6 sm:grid-cols-2">
              {activities.map((a) => (
                <div key={a.id} className="border-t border-ink pt-4">
                  <p className="font-display text-xl">{a.label}</p>
                  {a.description && (
                    <p className="mt-1 text-sm text-muted">{a.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-12 border-b border-line py-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <h2 className="font-display text-3xl">Availability</h2>
            <p className="mt-2 text-sm text-muted">Next 7 days. Pick an open hour.</p>
          </div>
          <div className="md:col-span-9">
            <AvailabilityGrid slots={slots ?? []} />
          </div>
        </section>

        {reviews && reviews.length > 0 && (
          <section className="grid gap-12 py-12 md:grid-cols-12">
            <h2 className="md:col-span-3 font-display text-3xl">Reviews</h2>
            <div className="md:col-span-9 space-y-8">
              {reviews.map((r) => (
                <div key={r.id} className="border-t border-line pt-4">
                  <p className="font-display text-lg">{"★".repeat(r.rating)}</p>
                  {r.comment && <p className="mt-2 text-base leading-relaxed">{r.comment}</p>}
                  <p className="mt-2 text-xs text-muted">
                    {new Date(r.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex justify-end border-t border-line pt-8 pb-28">
          <Link
            href={`/bookings/new?report=${profile.id}`}
            className="text-xs text-muted underline"
          >
            Report this profile
          </Link>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="hidden sm:block">
            <p className="font-display text-lg leading-tight">
              {profile.display_name}
            </p>
            <p className="text-xs text-muted">
              {formatCents(profile.hourly_rate_cents)} / hour · {profile.city}
            </p>
          </div>
          <Link
            href={`/messages/new?to=${profile.id}`}
            className="ml-auto rounded-full bg-ink px-8 py-3 text-sm text-cream hover:opacity-90"
          >
            Message {profile.display_name?.split(" ")[0] ?? "host"}
          </Link>
        </div>
      </div>
    </>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-ink px-3 py-1 text-xs">
      {children}
    </span>
  );
}

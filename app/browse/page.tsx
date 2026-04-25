import Link from "next/link";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/format";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Browse — Company" };
export const revalidate = 60;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { city?: string; neighborhood?: string; activity?: string };
}) {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let hosts: Profile[] | null = null;
  if (configured) {
    const supabase = createClient();
    let query = supabase
      .from("profiles")
      .select("*")
      .eq("host_status", "approved");
    if (searchParams.city) query = query.ilike("city", `%${searchParams.city}%`);
    if (searchParams.neighborhood) {
      query = query.contains("neighborhoods", [searchParams.neighborhood]);
    }
    const { data } = await query.order("created_at", { ascending: false });
    hosts = data as Profile[] | null;
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Directory</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight md:text-6xl">
          Browse people
        </h1>

        <form className="mt-8 flex flex-wrap gap-3 border-b border-line pb-8">
          <input
            name="city"
            defaultValue={searchParams.city ?? ""}
            placeholder="City"
            className="rounded-md border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none"
          />
          <input
            name="neighborhood"
            defaultValue={searchParams.neighborhood ?? ""}
            placeholder="Neighborhood"
            className="rounded-md border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none"
          />
          <input
            name="activity"
            defaultValue={searchParams.activity ?? ""}
            placeholder="Activity (coffee, hike…)"
            className="rounded-md border border-line bg-white px-4 py-2 text-sm focus:border-ink focus:outline-none"
          />
          <button className="rounded-md bg-ink px-4 py-2 text-sm text-cream">
            Filter
          </button>
        </form>

        <section className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {hosts?.length ? (
            hosts.map((h) => <HostCard key={h.id} host={h} />)
          ) : (
            <p className="text-muted">
              {configured
                ? "No hosts found yet."
                : "Connect Supabase in .env.local to see hosts."}
            </p>
          )}
        </section>
      </main>
    </>
  );
}

function HostCard({ host }: { host: Profile }) {
  const verified = host.id_verified_at && host.background_checked_at;
  return (
    <Link href={`/host/${host.id}`} className="group block">
      <div
        className="aspect-[4/5] w-full bg-line bg-cover bg-center"
        style={
          host.photo_url ? { backgroundImage: `url(${host.photo_url})` } : undefined
        }
      />
      <div className="mt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-2xl leading-tight group-hover:underline">
            {host.display_name}
            {host.age ? `, ${host.age}` : ""}
          </p>
          {verified && (
            <span
              className="mt-1 shrink-0 border border-ink px-2 py-0.5 text-[10px] uppercase tracking-widest"
              title="ID verified and background checked"
            >
              Verified
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {host.city}
          {host.neighborhoods?.length
            ? ` · ${host.neighborhoods.slice(0, 2).join(", ")}`
            : ""}
        </p>
        {host.tagline && (
          <p className="mt-3 text-sm leading-snug">&ldquo;{host.tagline}&rdquo;</p>
        )}
        <p className="mt-3 text-xs tracking-widest text-muted">
          {formatCents(host.hourly_rate_cents)} / HR
        </p>
      </div>
    </Link>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Dashboard — Company" };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: upcoming } = await supabase
    .from("bookings")
    .select("*")
    .eq("host_id", user.id)
    .eq("booking_status", "confirmed")
    .gte("created_at", new Date(Date.now() - 60 * 86400 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  const earnings =
    upcoming?.reduce((s, b) => s + (b.payment_status === "paid" ? b.amount_cents : 0), 0) ?? 0;

  const sumupConnected = !!profile?.sumup_merchant_code;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Dashboard</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">
          {profile?.display_name ?? "Welcome"}
        </h1>

        {!sumupConnected && (
          <div className="mt-8 rounded-md border border-accent bg-white p-5">
            <p className="font-display text-lg">Connect your SumUp account</p>
            <p className="mt-1 text-sm text-muted">
              You can&rsquo;t accept bookings until SumUp is connected. Payments go
              direct to you.
            </p>
            <Link
              href="/dashboard/connect"
              className="mt-4 inline-block rounded-md bg-ink px-4 py-2 text-sm text-cream"
            >
              Connect SumUp
            </Link>
          </div>
        )}

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <Stat label="Upcoming" value={String(upcoming?.length ?? 0)} />
          <Stat label="Earnings (60d)" value={formatCents(earnings)} />
          <Stat
            label="Status"
            value={profile?.host_status ?? "none"}
          />
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl">Upcoming bookings</h2>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {upcoming?.length ? (
              upcoming.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="flex items-center justify-between py-4 hover:bg-white"
                >
                  <span className="text-sm">{b.meeting_location}</span>
                  <span className="text-xs text-muted">
                    {formatCents(b.amount_cents)} · {b.payment_status}
                  </span>
                </Link>
              ))
            ) : (
              <p className="py-6 text-sm text-muted">No upcoming bookings yet.</p>
            )}
          </div>
        </section>

        {sumupConnected && (
          <section className="mt-12">
            <h2 className="font-display text-3xl">Payouts</h2>
            <div className="mt-4 grid gap-6 border-t border-line pt-6 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  How money flows
                </p>
                <p className="mt-3 text-sm leading-relaxed">
                  When a guest pays, funds settle <strong>directly to your
                  SumUp Business account</strong>. Company never holds your
                  money. SumUp&rsquo;s US fee is 3.5% + $0.15 per transaction.
                </p>
                <a
                  href="https://me.sumup.com"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm underline"
                >
                  Manage payouts on SumUp →
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  Connected account
                </p>
                <p className="mt-3 font-display text-xl">
                  {profile?.sumup_email ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Merchant: {profile?.sumup_merchant_code}
                </p>
                <Link
                  href="/dashboard/connect"
                  className="mt-3 inline-block text-xs underline text-muted"
                >
                  Reconnect
                </Link>
              </div>
            </div>
          </section>
        )}

        <div className="mt-12 flex gap-3">
          <Link
            href="/dashboard/availability"
            className="rounded-md border border-ink px-4 py-2 text-sm"
          >
            Edit availability
          </Link>
          <form action="/auth/sign-out" method="post">
            <button className="rounded-md border border-ink px-4 py-2 text-sm">
              Sign out
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-ink pt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="font-display mt-2 text-3xl">{value}</p>
    </div>
  );
}

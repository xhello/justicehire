import { notFound, redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: booking } = await supabase
    .from("bookings")
    .select(`*, host:profiles!bookings_host_id_fkey(*), guest:profiles!bookings_guest_id_fkey(*)`)
    .eq("id", params.id)
    .maybeSingle();

  if (!booking) notFound();

  const isGuest = user.id === booking.guest_id;
  const counterparty = isGuest ? booking.host : booking.guest;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Booking · {booking.booking_status.replace("_", " ")}
        </p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">
          {counterparty.display_name}
        </h1>
        <p className="mt-2 text-sm text-muted">{booking.meeting_location}</p>

        <section className="mt-10 grid gap-2 border-t border-line pt-6 text-sm">
          <Row k="Payment" v={booking.payment_status} />
          <Row k="Amount" v={`$${(booking.amount_cents / 100).toFixed(2)}`} />
          <Row
            k="Guest checked in"
            v={booking.guest_checked_in_at ? "Yes" : "Not yet"}
          />
          <Row
            k="Host checked in"
            v={booking.host_checked_in_at ? "Yes" : "Not yet"}
          />
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <button className="rounded-md border border-ink px-4 py-2.5 text-sm">
            Check in
          </button>
          <a
            href={`mailto:?subject=Re: our hangout`}
            className="rounded-md border border-ink px-4 py-2.5 text-sm"
          >
            Email host
          </a>
          <button className="ml-auto rounded-md bg-red-700 px-4 py-2.5 text-sm text-cream">
            SOS
          </button>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <a href={`/bookings/${booking.id}/report`} className="text-sm underline">
            Report a problem
          </a>
        </div>
      </main>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line py-2">
      <span className="text-muted">{k}</span>
      <span>{v}</span>
    </div>
  );
}

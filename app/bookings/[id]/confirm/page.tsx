import Link from "next/link";
import Header from "@/components/Header";

export const metadata = { title: "Booking confirmed — Company" };

export default function ConfirmPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Confirmed</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">
          You&rsquo;re booked.
        </h1>
        <p className="mt-4 text-base text-muted">
          We sent confirmation emails to you and your host with the meeting details.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href={`/bookings/${params.id}`}
            className="rounded-full bg-ink px-6 py-3 text-sm text-cream"
          >
            View booking
          </Link>
          <Link
            href="/browse"
            className="rounded-full border border-ink px-6 py-3 text-sm"
          >
            Browse more
          </Link>
        </div>
      </main>
    </>
  );
}

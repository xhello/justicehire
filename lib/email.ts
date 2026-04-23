import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Company <bookings@company.app>";

export async function sendBookingConfirmationEmails(bookingId: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping email.");
    return;
  }

  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, meeting_location, amount_cents,
       slot:availability_slots(starts_at, duration_minutes),
       host:profiles!bookings_host_id_fkey(display_name),
       guest:profiles!bookings_guest_id_fkey(display_name)`,
    )
    .eq("id", bookingId)
    .maybeSingle<any>();

  if (!booking) return;

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const hostUser = users?.find((u) => u.id === booking.host?.id);
  const guestUser = users?.find((u) => u.id === booking.guest?.id);

  const subject = `Booking confirmed — ${new Date(booking.slot.starts_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric" })}`;
  const lines = [
    `Booking confirmed.`,
    ``,
    `Where: ${booking.meeting_location}`,
    `When: ${new Date(booking.slot.starts_at).toLocaleString()}`,
    `Duration: ${booking.slot.duration_minutes} minutes`,
    `Amount: $${(booking.amount_cents / 100).toFixed(2)}`,
    ``,
    `View it: ${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}`,
  ];

  await Promise.all(
    [guestUser?.email, hostUser?.email].filter(Boolean).map((to) =>
      resend.emails.send({ from: FROM, to: to as string, subject, text: lines.join("\n") }),
    ),
  );
}

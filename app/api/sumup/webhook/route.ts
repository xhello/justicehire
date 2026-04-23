import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCheckoutStatus } from "@/lib/sumup/client";
import { sendBookingConfirmationEmails } from "@/lib/email";

// SumUp posts on status change. Per their docs we MUST verify by re-fetching
// the checkout from the API rather than trusting the webhook payload.
export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    id?: string;
    checkout_reference?: string;
    event_type?: string;
  };

  const checkoutId = payload.id;
  const reference = payload.checkout_reference;
  if (!checkoutId && !reference) return NextResponse.json({ ok: true });

  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, host_id, slot_id, sumup_checkout_id")
    .eq(reference ? "id" : "sumup_checkout_id", reference ?? checkoutId!)
    .maybeSingle();

  if (!booking) return NextResponse.json({ ok: true });

  let status: string | null = null;
  try {
    const auth = await getCheckoutStatus(
      booking.sumup_checkout_id ?? checkoutId!,
      booking.host_id,
    );
    status = auth.status;
  } catch (e) {
    console.error("SumUp verify failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (status === "PAID") {
    // Slot was already claimed when the booking was created.
    await supabase
      .from("bookings")
      .update({ payment_status: "paid", booking_status: "confirmed" })
      .eq("id", booking.id);

    await sendBookingConfirmationEmails(booking.id).catch((e) =>
      console.error("Email send failed", e),
    );
  } else if (status === "FAILED" || status === "EXPIRED") {
    await Promise.all([
      supabase
        .from("bookings")
        .update({ payment_status: "failed", booking_status: "cancelled" })
        .eq("id", booking.id),
      supabase
        .from("availability_slots")
        .update({ status: "open" })
        .eq("id", booking.slot_id),
    ]);
  }

  return NextResponse.json({ ok: true });
}

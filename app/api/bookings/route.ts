import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/sumup/client";

const Body = z.object({
  slot_id: z.string().uuid(),
  activity_id: z.string().uuid().optional().nullable(),
  meeting_location: z.string().min(3).max(500),
  emergency_contact_phone: z.string().min(7).max(40),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const parse = Body.safeParse(await request.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.message }, { status: 400 });
  }
  const input = parse.data;

  const service = createServiceClient();

  // Atomically claim the slot. If two guests race, only one update returns a row.
  const { data: claimed } = await service
    .from("availability_slots")
    .update({ status: "booked" })
    .eq("id", input.slot_id)
    .eq("status", "open")
    .select()
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json({ error: "Slot is no longer open" }, { status: 409 });
  }

  // From here on, any failure must release the slot back to 'open'.
  const releaseSlot = () =>
    service
      .from("availability_slots")
      .update({ status: "open" })
      .eq("id", claimed.id);

  const demoMode = !process.env.SUMUP_CLIENT_ID;

  const { data: host } = await service
    .from("profiles")
    .select("id, display_name, hourly_rate_cents, sumup_email, sumup_merchant_code")
    .eq("id", claimed.host_id)
    .maybeSingle();

  if (!host) {
    await releaseSlot();
    return NextResponse.json({ error: "Host not found" }, { status: 404 });
  }

  if (!demoMode && (!host.sumup_email || !host.sumup_merchant_code)) {
    await releaseSlot();
    return NextResponse.json(
      { error: "Host hasn't finished payment setup" },
      { status: 409 },
    );
  }

  const amount = Math.round(
    ((host.hourly_rate_cents ?? 0) * claimed.duration_minutes) / 60,
  );

  if (amount < 50) {
    await releaseSlot();
    return NextResponse.json(
      { error: "Host's rate is not set" },
      { status: 409 },
    );
  }

  const { data: booking, error } = await service
    .from("bookings")
    .insert({
      slot_id: claimed.id,
      guest_id: user.id,
      host_id: host.id,
      activity_id: input.activity_id ?? null,
      meeting_location: input.meeting_location,
      emergency_contact_phone: input.emergency_contact_phone,
      amount_cents: amount,
      payment_status: demoMode ? "paid" : "pending",
      booking_status: demoMode ? "confirmed" : "pending_payment",
    })
    .select()
    .single();

  if (error || !booking) {
    await releaseSlot();
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  if (demoMode) {
    return NextResponse.json({
      booking_id: booking.id,
      checkout_url: `/bookings/${booking.id}/confirm`,
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const checkout = await createCheckout({
      hostId: host.id,
      hostEmail: host.sumup_email!,
      bookingId: booking.id,
      amountCents: amount,
      description: `1 hour with ${host.display_name}`,
      redirectUrl: `${appUrl}/bookings/${booking.id}/confirm`,
      returnUrl: `${appUrl}/api/sumup/webhook`,
    });

    await service
      .from("bookings")
      .update({
        sumup_checkout_id: checkout.id,
        sumup_checkout_reference: booking.id,
      })
      .eq("id", booking.id);

    return NextResponse.json({
      booking_id: booking.id,
      checkout_url: checkout.checkout_url,
    });
  } catch (e: any) {
    await Promise.all([
      service.from("bookings")
        .update({ payment_status: "failed", booking_status: "cancelled" })
        .eq("id", booking.id),
      releaseSlot(),
    ]);
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

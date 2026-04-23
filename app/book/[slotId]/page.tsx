import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import BookingForm from "./BookingForm";
import type { Activity, AvailabilitySlot, Profile } from "@/lib/types";

export const metadata = { title: "Book — Company" };

export default async function BookSlotPage({ params }: { params: { slotId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/sign-in?next=/book/${params.slotId}`);

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("id", params.slotId)
    .eq("status", "open")
    .maybeSingle<AvailabilitySlot>();

  if (!slot) notFound();

  const [{ data: host }, { data: activities }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", slot.host_id).maybeSingle<Profile>(),
    supabase.from("activities").select("*").eq("host_id", slot.host_id),
  ]);

  if (!host) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Booking</p>
        <h1 className="font-display mt-4 text-5xl tracking-tight">
          {host.display_name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {new Date(slot.starts_at).toLocaleString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            hour: "numeric",
          })}{" "}
          · {slot.duration_minutes} min
        </p>

        <div className="mt-10">
          <BookingForm
            slot={slot}
            host={host}
            activities={(activities ?? []) as Activity[]}
          />
        </div>
      </main>
    </>
  );
}

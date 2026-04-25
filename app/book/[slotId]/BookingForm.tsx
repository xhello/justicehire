"use client";

import { useState } from "react";
import type { Activity, AvailabilitySlot, Profile } from "@/lib/types";
import { formatCents } from "@/lib/format";

export default function BookingForm({
  slot,
  host,
  activities,
}: {
  slot: AvailabilitySlot;
  host: Profile;
  activities: Activity[];
}) {
  const [step, setStep] = useState<"details" | "safety">("details");
  const [activityId, setActivityId] = useState(activities[0]?.id ?? "");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slot.id,
          activity_id: activityId,
          meeting_location: meetingLocation,
          emergency_contact_phone: emergencyPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create booking");
      window.location.href = data.checkout_url;
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (step === "details") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("safety");
        }}
        className="space-y-6"
      >
        <Field label="Activity">
          <select
            value={activityId}
            onChange={(e) => setActivityId(e.target.value)}
            className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
            required
          >
            <option value="">Select an activity</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Where should you meet?">
          <input
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
            placeholder="e.g. Blue Bottle Coffee, Hayes Valley"
            required
            className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
          />
          <div className="mt-3 border-l-2 border-ink bg-white/60 px-4 py-3 text-xs leading-relaxed">
            <p className="font-medium">First meetings must be in a public place.</p>
            <p className="mt-1 text-muted">
              Pick a cafe, restaurant, museum, or park — somewhere with other
              people present. Hotels, private homes, and unlit areas are not
              allowed and will be flagged.
            </p>
          </div>
        </Field>

        <button className="w-full rounded-md bg-ink px-4 py-3 text-sm text-cream hover:opacity-90">
          Continue · {formatCents(host.hourly_rate_cents)}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-line bg-white p-5">
        <p className="font-display text-lg">Safety check</p>
        <p className="mt-2 text-sm text-muted">
          We&rsquo;ll text your emergency contact only if you press SOS during the
          hangout. We&rsquo;ll never share their number with the host.
        </p>
      </div>

      <Field label="Emergency contact phone">
        <input
          type="tel"
          value={emergencyPhone}
          onChange={(e) => setEmergencyPhone(e.target.value)}
          placeholder="+1 555 555 5555"
          required
          className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
        />
      </Field>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span>
          I&rsquo;ve read the{" "}
          <a href="/community-guidelines" className="underline" target="_blank">
            community guidelines
          </a>{" "}
          and understand this is not a dating service.
        </span>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep("details")}
          className="rounded-md border border-ink px-4 py-3 text-sm"
        >
          Back
        </button>
        <button
          onClick={submit}
          disabled={!agreed || !emergencyPhone || submitting}
          className="flex-1 rounded-md bg-ink px-4 py-3 text-sm text-cream hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating checkout…" : "Pay with SumUp"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

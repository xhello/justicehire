"use client";

import { useState } from "react";

export default function HostApplyForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/host-applications", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-md border border-line bg-white p-6">
        <p className="font-display text-lg">You&rsquo;re on the waitlist.</p>
        <p className="mt-1 text-sm text-muted">
          We&rsquo;ll email you when there&rsquo;s a spot to start verification.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Display name">
        <input
          name="display_name"
          required
          className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
        />
      </Field>
      <Field label="City">
        <input
          name="city"
          required
          className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
        />
      </Field>
      <Field label="Tagline">
        <input
          name="tagline"
          maxLength={140}
          placeholder="One line that captures why someone would book you."
          className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
        />
      </Field>
      <Field label="Why you?">
        <textarea
          name="bio"
          rows={5}
          required
          className="w-full rounded-md border border-line bg-white px-4 py-2.5 text-sm"
        />
      </Field>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        disabled={submitting}
        className="w-full rounded-md bg-ink px-4 py-3 text-sm text-cream disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Apply for waitlist"}
      </button>
    </form>
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

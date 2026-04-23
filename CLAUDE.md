# Company

Marketplace for in-person time. Verified hosts, hourly bookings, payments via SumUp, hosted in `pay.sumup.com` checkout.

## Stack

- Next.js 14 App Router, TypeScript
- Tailwind CSS — core utilities only. Custom palette in [tailwind.config.ts](tailwind.config.ts): `cream #FBF7F0`, `ink #1A1A1A`, `muted #6B6B6B`, `accent #8B5A3C`, `line #E5DFD3`.
- Supabase (Postgres + Auth + Storage). Migrations in [supabase/migrations/](supabase/migrations/).
- Resend for transactional email.
- SumUp for payments. Each host connects their own merchant account via OAuth — Company never holds funds and does not sit in the money flow. No platform cut at the SumUp layer.

## Visual direction

Editorial / magazine. Georgia for display, system-ui for UI. Hairline rules (`border-line`), generous whitespace, large display type, ink-on-cream. Avoid round-cornered SaaS chrome on the public-facing pages — keep cards flush, rules thin.

## Conventions

- App Router: server components by default. Client components are explicit, named with PascalCase, and live next to the page that uses them (e.g., [SignInForm.tsx](app/auth/sign-in/SignInForm.tsx)).
- Supabase clients:
  - [lib/supabase/client.ts](lib/supabase/client.ts) — browser
  - [lib/supabase/server.ts](lib/supabase/server.ts) — server components / route handlers; also exports `createServiceClient()` for service-role work (webhooks, OAuth callback)
  - [lib/supabase/middleware.ts](lib/supabase/middleware.ts) — session refresh
- All tables have RLS — see [supabase/migrations/0002_rls_policies.sql](supabase/migrations/0002_rls_policies.sql). Service-role client bypasses RLS — only use it from trusted server entry points (webhooks, OAuth callbacks, admin actions).
- SumUp tokens are encrypted at rest with AES-256-GCM via [lib/crypto.ts](lib/crypto.ts). `ENCRYPTION_KEY` must be a 64-char hex string (32 bytes).
- Prices stored in cents. Format with [lib/format.ts](lib/format.ts).

## SumUp specifics

- OAuth authorize URL is built in [lib/sumup/oauth.ts](lib/sumup/oauth.ts).
- Callback at [app/api/sumup/oauth/callback/route.ts](app/api/sumup/oauth/callback/route.ts) — exchanges the code, stores encrypted tokens + merchant code on the host's profile.
- Checkouts are created with the host's access token in [lib/sumup/client.ts](lib/sumup/client.ts). Token refresh happens transparently before each call.
- Webhook at [app/api/sumup/webhook/route.ts](app/api/sumup/webhook/route.ts) — **never trusts the payload**; always re-fetches `GET /v0.1/checkouts/{id}` to confirm `PAID` before flipping a booking to confirmed.

## Trust & safety (planned wiring)

- Stripe Identity (~$1.50) and Checkr (~$20) — gated before `host_status='approved'`. Not wired yet.
- SOS button on `/bookings/[id]` will Twilio-text the emergency contact stored on the booking.
- First meeting between two users must be in a public location. Currently free-text + manual review.

## Build / run

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build
```

Copy `.env.local.example` to `.env.local` and fill in Supabase + SumUp + Resend credentials. Apply SQL migrations to your Supabase project via the dashboard SQL editor or `supabase db push`.

## Things not built yet

- Sheets-style availability editor (only a placeholder at [/dashboard/availability](app/dashboard/availability/page.tsx))
- Reviews submission UI (read-only render exists on host page)
- Admin dashboard
- ID verification + background check integrations
- SOS / Twilio wiring
- Reports submission UI
- Community guidelines page
- Email templates beyond plain-text booking confirmation

## Things explicitly NOT in v1

Native mobile, in-app chat, virtual hangouts, group bookings, tipping, multi-currency, platform fee splitting via SumUp.

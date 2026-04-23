# Company

A marketplace for verified people listing their time for in-person hangouts. Coffee, hikes, concerts, dinners.

<!-- deploy ping 2 -->


## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · SumUp · Resend

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in credentials
npm run dev
```

### Supabase

1. Create a Supabase project.
2. In SQL editor, run [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql) then [0002_rls_policies.sql](supabase/migrations/0002_rls_policies.sql).
3. Enable Email + Google providers in Auth settings. Add `http://localhost:3000/auth/callback` to redirect URLs.
4. Paste `URL`, `anon` key, and `service_role` key into `.env.local`.

### SumUp

1. Create a developer app at [developer.sumup.com](https://developer.sumup.com).
2. Set redirect URI to `http://localhost:3000/api/sumup/oauth/callback` (for local dev).
3. Paste `client_id` and `client_secret` into `.env.local`.

#### How money flows

Each host connects their own SumUp Business account via OAuth at `/dashboard/connect`. When a guest pays, the checkout is created with **the host's** access token and `pay_to_email` set to the host's SumUp email — funds settle directly into that host's account. The platform never holds funds. There is no marketplace fee split through SumUp; if you need platform revenue later, layer a separate host subscription.

#### Testing locally

SumUp's webhook (and `redirect_url` after payment) needs a publicly reachable URL — `localhost` won't work. Use a tunnel:

```bash
# example with cloudflared
cloudflared tunnel --url http://localhost:3000
# or ngrok
ngrok http 3000
```

Then set `NEXT_PUBLIC_APP_URL` and `SUMUP_OAUTH_REDIRECT_URI` to the tunnel URL, and add the tunnel callback URL to your SumUp app's allowed redirect URIs.

### Encryption key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste into `ENCRYPTION_KEY` — used to encrypt SumUp tokens at rest.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/browse` | Host directory |
| `/host/[id]` | Host profile + 7-day availability |
| `/book/[slotId]` | Booking flow → SumUp checkout |
| `/bookings/[id]` | Booking detail (check-in, SOS, message) |
| `/bookings/[id]/confirm` | Post-payment landing |
| `/dashboard` | Host dashboard |
| `/dashboard/availability` | Availability editor (placeholder) |
| `/dashboard/connect` | SumUp OAuth |
| `/signup/host` | Host waitlist application |
| `/auth/sign-in`, `/auth/sign-up` | Magic-link + Google |

## What's built vs. stubbed

See [CLAUDE.md](CLAUDE.md) for the canonical "done / not done / not v1" list.

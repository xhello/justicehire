# Justice Hire

An anonymous, verified review network for the hospitality industry where employees and employers can leave anonymous reviews on each other.

## Features

- **Two User Roles**: Employee and Employer
- **Anonymous Reviews**: Reviews are completely anonymous to both the public and the reviewed party
- **Email Verification**: OTP-based email verification (mock service for MVP)
- **Business Search**: Filter by State (CA/OR), City, and Category
- **Rating System**: Three-tier rating system (Outstanding, As Expected, Poor)
- **Review Limits**: One review per reviewer → target → business per 30 days

## Tech Stack

- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Prisma ORM** + PostgreSQL
- **Custom Auth** with sessions/cookies
- **Zod** for validation
- **Server Actions** for mutations

## Prerequisites

- Node.js 18+ and npm

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Current Setup (MVP)

**This MVP uses static in-memory data** - no database required! The app is ready to run immediately.

- All data is stored in memory (resets on server restart)
- Pre-seeded with sample businesses, users, and reviews
- Ready to migrate to Supabase/PostgreSQL later

### Static Data Includes:
- 3 businesses (Oceanview Grill, Redwood Coast Hotel, Sunset Brewery)
- 2 verified employers (John Miller, Sarah Thompson)
- 3 verified employees (Alex Rivera, Emily Chen, Marcus Lee)
- 5 sample reviews

### Pre-seeded User Accounts (for testing):
- **Employers:**
  - john.miller@example.com (verified)
  - sarah.thompson@example.com (verified)
- **Employees:**
  - alex.rivera@example.com (verified)
  - emily.chen@example.com (verified)
  - marcus.lee@example.com (verified)

You can log in with any of these emails (no password needed for MVP).

## Email Verification

Email verification uses OTP (One-Time Password) codes:
- OTP codes are generated as 6-digit numbers
- OTP codes expire after 10 minutes
- **Email Service**: Uses Resend to send OTP emails

### Setting up Email (Resend)

1. Sign up for a free account at [resend.com](https://resend.com)
2. Get your API key from the Resend dashboard
3. Add to your `.env.local` file:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```
   Note: For development, you can use `onboarding@resend.dev` as the from email. For production, you'll need to verify your domain with Resend.

**Development Mode**: If `RESEND_API_KEY` is not set, OTP codes will be logged to the console instead of being sent via email.

## Seeded Data

The seed script creates:
- 3 businesses (Oceanview Grill, Redwood Coast Hotel, Sunset Brewery)
- 2 employers (John Miller, Sarah Thompson)
- 3 employees (Alex Rivera, Emily Chen, Marcus Lee)
- 5 sample reviews

## User Flows

### Sign Up
1. Choose role (Employee or Employer)
2. Fill in required information
3. Receive OTP via email (check console)
4. Verify email with OTP
5. Redirected to role-based dashboard

### Employee Dashboard
- Search businesses by state, city, category
- View business details and employers
- Leave anonymous reviews on employers

### Employer Dashboard
- View employees who reviewed you
- View employee profiles with aggregated ratings
- Leave anonymous reviews on employees

### Business Search
- Public view: Shows review counts only
- Verified view: Shows full rating breakdown

## Business Categories

- Hotel
- Motel
- Restaurant
- Cafe
- Bar
- Resort
- Casino
- Food Truck
- Catering
- Brewery

## States Supported

- California (CA)
- Oregon (OR)

## Development

### Future: Migrating to Supabase/PostgreSQL

When ready to migrate to Supabase:
1. Set up your Supabase project
2. Update `.env` with your `DATABASE_URL`
3. Run `npx prisma migrate dev` to create tables
4. Run `npx prisma db seed` to seed initial data
5. The code is already structured to work with Prisma - just swap the static DB layer

### Project Structure

```
app/
  actions/          # Server actions
  dashboard/        # Dashboard pages
  business/         # Business pages
  employee/         # Employee profile pages
  employer/         # Employer profile pages
lib/
  auth.ts           # Authentication utilities
  otp.ts            # OTP generation/verification
  prisma.ts         # Prisma client
prisma/
  schema.prisma     # Database schema
  seed.ts           # Seed script
```

## Notes

- Reviews are completely anonymous - reviewerId is never exposed in API responses
- Users must be verified before viewing full review details or posting reviews
- Self-reviews are prevented
- Review rate limiting: 1 review per 30 days per reviewer → target → business

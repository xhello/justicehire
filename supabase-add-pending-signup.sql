-- Create PendingSignup table for storing signup data before OTP verification
CREATE TABLE IF NOT EXISTS "PendingSignup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "socialUrl" TEXT,
  "photoUrl" TEXT,
  "state" TEXT,
  "city" TEXT,
  "position" TEXT,
  "businessId" TEXT,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "PendingSignup_email_idx" ON "PendingSignup"("email");
CREATE INDEX IF NOT EXISTS "PendingSignup_expiresAt_idx" ON "PendingSignup"("expiresAt");

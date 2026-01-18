-- Create PendingSignup table for temporary signup data storage
-- This ensures no user data is written to the database until OTP verification is successful

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
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "PendingSignup_email_idx" ON "PendingSignup"("email");
CREATE INDEX IF NOT EXISTS "PendingSignup_expiresAt_idx" ON "PendingSignup"("expiresAt");

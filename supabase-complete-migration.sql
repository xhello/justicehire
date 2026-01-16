-- Complete Supabase Migration Script
-- Run this in your Supabase SQL Editor to create all necessary tables and columns

-- Create enums
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'EMPLOYER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "BusinessCategory" AS ENUM ('Hotel', 'Motel', 'Restaurant', 'Cafe', 'Bar', 'Resort', 'Casino', 'FoodTruck', 'Catering', 'Brewery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewRating" AS ENUM ('OUTSTANDING', 'DELIVERED_AS_EXPECTED', 'GOT_NOTHING_NICE_TO_SAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewTargetType" AS ENUM ('EMPLOYEE', 'EMPLOYER', 'BUSINESS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role "UserRole" NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "socialUrl" TEXT,
  "photoUrl" TEXT,
  state TEXT,
  city TEXT,
  position TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"(role);

-- Create Business table
CREATE TABLE IF NOT EXISTS "Business" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "placeId" TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  category "BusinessCategory" NOT NULL,
  "photoUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Business_state_city_idx" ON "Business"(state, city);
CREATE INDEX IF NOT EXISTS "Business_category_idx" ON "Business"(category);

-- Create EmployerProfile table
CREATE TABLE IF NOT EXISTS "EmployerProfile" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
  "businessId" TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "EmployerProfile_businessId_idx" ON "EmployerProfile"("businessId");

-- Create Review table
CREATE TABLE IF NOT EXISTS "Review" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reviewerId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "targetType" "ReviewTargetType" NOT NULL,
  "targetUserId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  "businessId" TEXT NOT NULL REFERENCES "Business"(id) ON DELETE CASCADE,
  rating "ReviewRating",
  "starRating" INTEGER,
  message TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT "Review_reviewerId_targetUserId_businessId_key" UNIQUE ("reviewerId", "targetUserId", "businessId")
);

CREATE INDEX IF NOT EXISTS "Review_reviewerId_targetUserId_businessId_idx" ON "Review"("reviewerId", "targetUserId", "businessId");
CREATE INDEX IF NOT EXISTS "Review_targetUserId_idx" ON "Review"("targetUserId");
CREATE INDEX IF NOT EXISTS "Review_businessId_idx" ON "Review"("businessId");
CREATE INDEX IF NOT EXISTS "Review_targetType_idx" ON "Review"("targetType");

-- Create Otp table
CREATE TABLE IF NOT EXISTS "Otp" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  hash TEXT NOT NULL,
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Otp_email_idx" ON "Otp"(email);
CREATE INDEX IF NOT EXISTS "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmployerProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Otp" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can access all" ON "User";
DROP POLICY IF EXISTS "Service role can access all" ON "Business";
DROP POLICY IF EXISTS "Service role can access all" ON "EmployerProfile";
DROP POLICY IF EXISTS "Service role can access all" ON "Review";
DROP POLICY IF EXISTS "Service role can access all" ON "Otp";

-- Create policies (allow service role to access everything)
-- For production, you'll want to create more restrictive policies
CREATE POLICY "Service role can access all" ON "User" FOR ALL USING (true);
CREATE POLICY "Service role can access all" ON "Business" FOR ALL USING (true);
CREATE POLICY "Service role can access all" ON "EmployerProfile" FOR ALL USING (true);
CREATE POLICY "Service role can access all" ON "Review" FOR ALL USING (true);
CREATE POLICY "Service role can access all" ON "Otp" FOR ALL USING (true);

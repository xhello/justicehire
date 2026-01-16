-- Add business review support
-- Step 1: Add BUSINESS to ReviewTargetType enum
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction, so run this first:
ALTER TYPE "ReviewTargetType" ADD VALUE IF NOT EXISTS 'BUSINESS';

-- Step 2: Make rating nullable (business reviews use starRating instead)
ALTER TABLE "Review" ALTER COLUMN "rating" DROP NOT NULL;

-- Step 3: Add starRating and message fields to Review table
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "starRating" INTEGER CHECK ("starRating" >= 1 AND "starRating" <= 5);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "message" TEXT;

-- Step 4: Allow null targetUserId for business reviews (business reviews don't target a user)
ALTER TABLE "Review" ALTER COLUMN "targetUserId" DROP NOT NULL;

-- Step 5: Add index for business reviews
CREATE INDEX IF NOT EXISTS "Review_businessId_starRating_idx" ON "Review"("businessId", "starRating");

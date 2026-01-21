-- Add notificationsDismissedAt column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationsDismissedAt" TIMESTAMP WITH TIME ZONE;

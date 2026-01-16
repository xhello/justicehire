-- Migration to add photoUrl column to Business table
-- Run this in your Supabase SQL Editor if you already ran the initial migration

ALTER TABLE "Business" 
ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

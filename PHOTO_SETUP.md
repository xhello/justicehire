# Business Photos Setup Guide

## Step 1: Add photoUrl Column to Database

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
ALTER TABLE "Business" 
ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
```

## Step 2: Update Existing Businesses with Photos

After adding the column, run this command to fetch photos from Google Places API:

```bash
npm run db:update-photos
```

This will:
- Find all businesses without photos
- Fetch photos from Google Places API
- Update them in the database

## Step 3: Verify

Refresh your browser and check:
- Business search page should show photos in business cards
- Business detail pages should show large header photos

## Note

- Photos are fetched from Google Places API using the placeId
- If a business doesn't have a photo in Google Places, it won't have a photoUrl
- New businesses fetched with `npm run db:fetch-google` will automatically include photos

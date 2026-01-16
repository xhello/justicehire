# Supabase Setup Instructions

## 1. Run Database Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase-migration.sql`
5. Click **Run** to execute the migration

This will create all necessary tables:
- `User` - User accounts (employees and employers)
- `Business` - Business listings
- `EmployerProfile` - Links employers to businesses
- `Review` - Reviews between users
- `Otp` - Email verification codes

## 2. Environment Variables

The `.env.local` file has been created with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side operations)
- `SUPABASE_DB_PASSWORD` - Database password

## 3. Row Level Security (RLS)

The migration script enables RLS on all tables with permissive policies for the service role. For production, you should:

1. Review and update RLS policies in Supabase dashboard
2. Create more restrictive policies based on your security requirements
3. Consider using Supabase Auth for user authentication

## 4. Testing the Connection

After running the migration:

1. Restart your Next.js dev server: `npm run dev`
2. Try signing up a new user
3. Check your Supabase dashboard → Table Editor to see if data is being created

## 5. Seeding Initial Data (Optional)

If you want to seed initial businesses and test data, you can:

1. Use the Supabase dashboard → Table Editor to manually add data
2. Or create a seed script that uses the Supabase client

## Notes

- Table names use PascalCase to match Prisma conventions
- All timestamps are stored as `TIMESTAMP WITH TIME ZONE`
- Foreign keys use `ON DELETE CASCADE` for automatic cleanup
- The `position` field was added to the User table for employer positions

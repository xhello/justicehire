# Quick Start Guide

## ✅ Server Status
Your dev server is running! Check:
- http://localhost:3000
- http://localhost:3001 (if 3000 is in use)

## ⚠️ Important: Database Setup Required

Before the app will work fully, you need to create the database tables in Supabase:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to SQL Editor**
4. **Copy and paste** the entire contents of `supabase-migration.sql`
5. **Click "Run"** to execute

This will create all necessary tables:
- `User` - User accounts
- `Business` - Business listings  
- `EmployerProfile` - Employer-business links
- `Review` - Reviews
- `Otp` - Email verification codes

## 🔧 If Server Won't Start

If you get errors when running `npm run dev`:

1. **Kill existing processes**:
   ```bash
   lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null
   rm -rf .next/dev/lock
   ```

2. **Clear build cache**:
   ```bash
   rm -rf .next
   ```

3. **Restart server**:
   ```bash
   npm run dev
   ```

## 📝 Environment Variables

Your `.env.local` file is already set up with:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_DB_PASSWORD

## 🐛 Common Issues

**"Table doesn't exist" errors**: Run the migration SQL script first!

**Port already in use**: The server will automatically use the next available port (3001, 3002, etc.)

**Connection errors**: Make sure your Supabase project is active and the credentials are correct.

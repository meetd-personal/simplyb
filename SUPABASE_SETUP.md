# 🚀 Supabase Database Setup Guide

This guide will help you set up a real Supabase database for your Simply Business Tracker app.

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or sign in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `simply-business-tracker`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for the project to be ready (2-3 minutes)

## Step 3: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 5: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `database/schema.sql`
4. Click "Run" to execute the schema
5. You should see "Success. No rows returned" message

## Step 6: Enable Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your app's URL:
   - For development: `exp://localhost:8081`
   - For production: Your actual app URL
3. Under **Redirect URLs**, add:
   - `exp://localhost:8081`
   - `simply://auth/callback` (for deep linking)

## Step 7: Configure Row Level Security (RLS)

The schema already includes RLS policies, but you can verify:

1. Go to **Authentication** → **Policies**
2. You should see policies for:
   - `users` table
   - `businesses` table
   - `business_members` table
   - `transactions` table

## Step 8: Test the Connection

1. Update your app to use Supabase:
   ```typescript
   // In your DatabaseService or AuthService
   import SupabaseDatabaseService from './SupabaseDatabaseService';
   
   // Replace mock calls with Supabase calls
   const user = await SupabaseDatabaseService.getUserByEmail(email);
   ```

2. Run your app:
   ```bash
   npm start
   ```

3. Try signing up/logging in to test the connection

## Step 9: Switch from Mock to Real Database

To switch your app from mock data to real Supabase data:

1. **Update AuthService** to use Supabase authentication
2. **Update DatabaseService** to use SupabaseDatabaseService
3. **Remove mock data** and use real database queries

## Database Schema Overview

Your database includes these main tables:

- **users**: User accounts and profiles
- **businesses**: Business information
- **business_members**: User-business relationships with roles
- **transactions**: Revenue and expense records
- **delivery_integrations**: Third-party platform connections
- **sync_logs**: Integration sync history

## Demo Data

The schema includes demo data:
- 2 demo users (owner and manager)
- 2 demo businesses (Pizza Palace, Cozy Cafe)
- Business member relationships

## Security Features

✅ **Row Level Security (RLS)** enabled
✅ **User isolation** - users only see their data
✅ **Business-based access control**
✅ **Role-based permissions**

## Next Steps

1. **Test basic CRUD operations**
2. **Implement real-time subscriptions** for live updates
3. **Add file storage** for receipts using Supabase Storage
4. **Set up email templates** for team invitations
5. **Configure backup and monitoring**

## Troubleshooting

### Common Issues:

1. **"Missing environment variables"**
   - Make sure `.env` file exists and has correct values
   - Restart your development server after adding env vars

2. **"Failed to connect to Supabase"**
   - Check your Project URL and anon key
   - Verify your internet connection
   - Check Supabase project status

3. **"Row Level Security policy violation"**
   - Make sure you're authenticated
   - Check that RLS policies are correctly set up
   - Verify user has permission to access the data

4. **"Schema errors"**
   - Make sure you ran the complete schema.sql file
   - Check for any SQL errors in the Supabase dashboard
   - Verify all tables and relationships were created

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Authentication Guide](https://supabase.com/docs/guides/auth)

---

🎉 **You're all set!** Your app now has a real, production-ready database with authentication, security, and scalability built-in.

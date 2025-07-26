# 🔧 Fix Supabase Email Verification for React Native

## Problem
You're getting emails from Supabase that redirect to `localhost:3000` which doesn't exist in your React Native app.

## Solution
You need to configure Supabase Auth settings in your dashboard to work with React Native.

## Step 1: Update Supabase Dashboard Settings

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `simply-business-tracker`

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the sidebar
   - Click **Settings** tab

3. **Update Site URL**
   - Find **Site URL** field
   - Change from: `http://localhost:3000`
   - Change to: `exp://localhost:8081` (for Expo development)

4. **Update Redirect URLs**
   - Find **Redirect URLs** section
   - Remove: `http://localhost:3000/**`
   - Add these URLs:
     ```
     exp://localhost:8081
     exp://localhost:8081/**
     simply://auth/callback
     simply://auth/callback/**
     ```

5. **Disable Email Confirmation (Development Only)**
   - Find **Email Confirmation** setting
   - **Disable** "Enable email confirmations"
   - This allows users to sign up without email verification during development

6. **Save Settings**
   - Click **Save** at the bottom

## Step 2: Alternative - Keep Email Confirmation Enabled

If you want to keep email confirmation enabled:

1. **Update Email Templates**
   - Go to **Authentication** → **Email Templates**
   - Click **Confirm signup**
   - Change the redirect URL in the template from:
     ```
     {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
     ```
   - To:
     ```
     simply://auth/callback?token_hash={{ .TokenHash }}&type=signup
     ```

2. **Handle Deep Links in Your App**
   - Add deep link handling to process email verification
   - This is more complex and not needed for development

## Step 3: Test the Fix

1. **Clear App Data**
   - Close your app completely
   - Clear any cached data

2. **Try Signup Again**
   - Open your app
   - Try creating a new account
   - You should no longer get the localhost:3000 redirect

## Step 4: Production Configuration

When you deploy to production:

1. **Update Site URL** to your production domain
2. **Add production redirect URLs**
3. **Re-enable email confirmation** if desired
4. **Update email templates** with production URLs

## Quick Fix for Development

The easiest solution for development is to **disable email confirmation** entirely:

1. Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. **Turn it OFF**
4. Save settings

This allows users to sign up immediately without email verification.

## Code Changes Made

I've already updated your code to handle this better:

1. **Updated Supabase client config** (`src/config/supabase.ts`)
   - Added `flowType: 'pkce'` for better React Native support
   - Disabled URL detection

2. **Updated signup method** (`src/services/SupabaseAuthService.ts`)
   - Added `emailRedirectTo: undefined` to prevent redirect issues

## Next Steps

1. **Update your Supabase dashboard** with the settings above
2. **Test signup again** - it should work without the localhost error
3. **For production**, configure proper redirect URLs and email templates

The main issue was that Supabase was trying to redirect email verification to a web URL that doesn't exist in your React Native app. These changes fix that problem.

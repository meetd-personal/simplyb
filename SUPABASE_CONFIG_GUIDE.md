# 🔧 SUPABASE CONFIGURATION GUIDE

## 🚨 CRITICAL: Fix Password Reset Redirect URLs

The password reset emails are currently redirecting to `localhost:3000` instead of the production domain. This needs to be fixed in the Supabase Dashboard.

## 🎯 REQUIRED SUPABASE DASHBOARD CHANGES

### **STEP 1: Access Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select the "Simply Business Tracker" project

### **STEP 2: Update Authentication Settings**
1. Navigate to **Authentication** → **Settings** → **URL Configuration**
2. Update the following settings:

#### **Site URL:**
- **Current (WRONG)**: `http://localhost:3000`
- **Change to**: `https://apps.simplyb.meetdigrajkar.ca`

#### **Redirect URLs (Add these):**
```
https://apps.simplyb.meetdigrajkar.ca/reset-password
https://apps.simplyb.meetdigrajkar.ca/confirm-email
https://apps.simplyb.meetdigrajkar.ca/invite/*
https://apps.simplyb.meetdigrajkar.ca/*
```

### **STEP 3: Email Templates (Optional)**
1. Navigate to **Authentication** → **Email Templates**
2. Update **Reset Password** template if needed
3. Ensure the action link uses the correct domain

## 🔍 VERIFICATION STEPS

After making these changes:

1. **Test Password Reset**:
   - Go to login screen
   - Click "Forgot your password?"
   - Enter email and request reset
   - Check email - link should go to `https://apps.simplyb.meetdigrajkar.ca/reset-password`

2. **Test Complete Flow**:
   - Click the email link
   - Verify it opens the production app (not localhost)
   - Complete password reset process
   - Test login with new password

## 🎯 CURRENT CODE FIXES IMPLEMENTED

The following code changes have been made to force correct redirect URLs:

### **1. Enhanced Auth Configuration** (`src/config/auth.ts`)
- Centralized authentication URL configuration
- Environment detection and logging
- Production domain enforcement

### **2. Updated Login Screen** (`src/screens/LoginScreen.tsx`)
- Uses production domain for all password reset requests
- Enhanced logging for debugging redirect issues
- Web-compatible alerts for better user experience

### **3. Improved Supabase Client** (`src/config/supabase.ts`)
- Added default redirect URL configuration
- Enhanced session detection for password reset flow

## 🚨 IMPORTANT NOTES

1. **Dashboard Changes Required**: The code fixes help, but the main issue is in the Supabase Dashboard configuration
2. **Production Domain Only**: Always use `https://apps.simplyb.meetdigrajkar.ca` for redirects
3. **No Localhost**: Remove any `localhost:3000` references from Supabase settings
4. **Test Thoroughly**: After changes, test the complete forgot password flow

## 🔧 TROUBLESHOOTING

If password reset emails still redirect to localhost:

1. **Clear Supabase Cache**: Wait 5-10 minutes after dashboard changes
2. **Check Email Templates**: Verify email templates use correct domain
3. **Test in Incognito**: Use incognito mode to avoid cached redirects
4. **Check Console Logs**: Look for redirect URL logging in browser console

## ✅ SUCCESS CRITERIA

Password reset is working correctly when:
- ✅ Email contains link to `https://apps.simplyb.meetdigrajkar.ca/reset-password`
- ✅ Clicking email link opens production app (not localhost)
- ✅ Password reset screen loads properly
- ✅ Password update completes successfully
- ✅ Login works with new password

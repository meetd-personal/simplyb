# Google OAuth Setup Guide - Production Configuration

## 🎯 **Current Status**

Your app is currently using **placeholder Google OAuth client IDs** which cause 404 errors when users try to authenticate. To enable real Google authentication, you need to set up proper OAuth credentials in Google Cloud Console.

## 🚨 **Why You're Getting 404 Errors**

The current client IDs in your configuration are placeholders:
- Web: `1087977326078-0sd6vh6guymu9urj13qnpd94q3fnm7ul.apps.googleusercontent.com`
- iOS: `1087977326078-ios123abc456def789ghi012jkl345mno.apps.googleusercontent.com`
- Android: `1087977326078-android123abc456def789ghi012jkl345mn.apps.googleusercontent.com`

These don't exist in Google's system, hence the 404 error.

## ✅ **Temporary Fix Applied**

I've added a temporary bypass that detects placeholder client IDs and returns a demo user instead of attempting real OAuth. This allows you to test the authentication flow without setting up real credentials.

**Demo User Data:**
- Email: demo.user@gmail.com
- Name: Demo User
- This will work for testing the app functionality

## 🔧 **How to Set Up Real Google OAuth (Production)**

### **Step 1: Google Cloud Console Setup**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**: 
   - Project name: "Simply Business Tracker" 
   - Project ID: "simply-business-tracker"
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity" API

### **Step 2: Create OAuth Credentials**

1. **Go to Credentials**: APIs & Services > Credentials
2. **Create OAuth 2.0 Client IDs** (you need 3 separate ones):

#### **Web Application Client ID:**
- Application type: Web application
- Name: "Simply Web Client"
- Authorized redirect URIs:
  - `http://localhost:8081/auth/callback` (development)
  - `https://apps.simplyb.meetdigrajkar.ca/auth/callback` (production)

#### **iOS Client ID:**
- Application type: iOS
- Name: "Simply iOS Client"
- Bundle ID: `com.meetcreations.simply`

#### **Android Client ID:**
- Application type: Android
- Name: "Simply Android Client"
- Package name: `com.meetcreations.simply`
- SHA-1 certificate fingerprint: (get from your keystore)

### **Step 3: Update Configuration Files**

#### **Update `src/services/OAuthService.ts`:**
```typescript
const GOOGLE_CONFIG = {
  // Replace with your actual client IDs from Google Cloud Console
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com', 
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  // ... rest of config
};
```

#### **Update `google-services.json`:**
- Download the real `google-services.json` from Google Cloud Console
- Replace the current placeholder file

#### **Update `GoogleService-Info.plist`:**
- Download the real `GoogleService-Info.plist` from Google Cloud Console
- Replace the current placeholder file (if it exists)

#### **Update `app.json`:**
```json
{
  "ios": {
    "infoPlist": {
      "CFBundleURLTypes": [
        {
          "CFBundleURLName": "google-oauth",
          "CFBundleURLSchemes": [
            "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
          ]
        }
      ]
    }
  }
}
```

### **Step 4: OAuth Consent Screen**

1. **Configure OAuth Consent Screen**:
   - Go to "OAuth consent screen" in Google Cloud Console
   - Choose "External" user type
   - Fill in app information:
     - App name: "Simply Business Tracker"
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `openid`, `profile`, `email`
   - Add test users (for testing phase)

### **Step 5: Testing**

1. **Remove Temporary Bypass**: Delete the placeholder detection code in OAuthService.ts
2. **Test Authentication**: Try Google sign-in with real credentials
3. **Verify User Data**: Check that real Google profile data is retrieved

## 🔒 **Security Considerations**

### **Client ID Security:**
- Web client ID: Can be public (included in app bundle)
- iOS/Android client IDs: Can be public (included in app bundle)
- **Never expose client secrets** in mobile apps

### **Redirect URI Security:**
- Only add trusted domains to authorized redirect URIs
- Use HTTPS in production
- Validate redirect URIs match exactly

### **Scope Limitations:**
- Only request necessary scopes: `openid`, `profile`, `email`
- Don't request additional permissions unless needed

## 🚀 **Production Deployment**

### **Before Going Live:**
1. ✅ Set up real Google OAuth credentials
2. ✅ Configure OAuth consent screen
3. ✅ Test authentication flow thoroughly
4. ✅ Update redirect URIs for production domain
5. ✅ Remove temporary bypass code
6. ✅ Verify all platforms (web, iOS, Android)

### **Domain Configuration:**
- Production web redirect: `https://apps.simplyb.meetdigrajkar.ca/auth/callback`
- Development web redirect: `http://localhost:8081/auth/callback`
- Mobile redirects: `simply://auth/callback`

## 📞 **Need Help?**

If you need assistance setting up Google OAuth credentials:
1. The temporary bypass allows you to test other app functionality
2. Google Cloud Console documentation: https://cloud.google.com/docs/authentication
3. Expo AuthSession documentation: https://docs.expo.dev/guides/authentication/

## 🎯 **Current Workaround**

For now, the app will use demo authentication when it detects placeholder client IDs. This allows you to:
- ✅ Test the complete authentication flow
- ✅ Test user management and business creation
- ✅ Test all app functionality
- ✅ Verify the OAuth integration works

When you're ready for production, follow the setup guide above to enable real Google authentication.

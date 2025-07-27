# 🚀 Netlify Deployment Guide for Simply Business Tracker

## Quick Setup Steps

### 1. Create Netlify Site
1. Go to [netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub and authorize access
5. Select repository: `meetd-personal/simplyb`

### 2. Configure Build Settings
```
Branch to deploy: main
Build command: npm ci && npx expo export --platform web --output-dir dist --clear
Publish directory: dist
```

### 3. Add Environment Variables
In Site settings → Environment variables, add:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Deploy!
Click "Deploy site" - Netlify will:
- Clone your repository
- Install dependencies
- Build your app
- Deploy to a temporary URL

## Custom Domain Setup

### Option A: Netlify DNS (Recommended)
1. In Site settings → Domain management
2. Add custom domain: `apps.simplyb.meetdigrajkar.ca`
3. Follow Netlify's DNS instructions
4. Update your domain's nameservers to Netlify's

### Option B: External DNS (Current Setup)
1. In Site settings → Domain management
2. Add custom domain: `apps.simplyb.meetdigrajkar.ca`
3. Get the Netlify site URL (e.g., `amazing-name-123456.netlify.app`)
4. In AWS Route 53, create a CNAME record:
   ```
   Name: apps.simplyb
   Type: CNAME
   Value: amazing-name-123456.netlify.app
   ```

## Automatic Deployments

✅ **Every git push to main branch will automatically:**
- Trigger a new build
- Deploy the updated app
- Update your live site

✅ **Pull requests will get preview URLs for testing**

## Build Optimization

The `netlify.toml` file in your repo configures:
- ✅ Security headers
- ✅ SPA routing (serves index.html for all routes)
- ✅ Asset caching (1 year for static files)
- ✅ Gzip compression
- ✅ Performance optimizations

## Monitoring & Logs

In Netlify dashboard you can:
- View build logs
- Monitor site performance
- Set up notifications
- Configure redirects
- Manage environment variables

## Troubleshooting

### Build Fails?
1. Check build logs in Netlify dashboard
2. Verify environment variables are set
3. Ensure all dependencies are in package.json

### Site Not Loading?
1. Check if custom domain is properly configured
2. Verify DNS propagation (can take up to 24 hours)
3. Check browser console for errors

### Need to Rollback?
1. Go to Site overview → Deploys
2. Click on a previous successful deploy
3. Click "Publish deploy"

## Next Steps After Deployment

1. **Test the live site** at your Netlify URL
2. **Configure custom domain** to point to Netlify
3. **Update invitation landing page** to use new domain
4. **Test the complete invitation flow**
5. **Monitor for any issues**

## Support

- Netlify Docs: https://docs.netlify.com
- Expo Web Docs: https://docs.expo.dev/workflow/web/
- Your deployment is configured for optimal performance and security!

---

🎉 **Your Simply Business Tracker is ready for production!**

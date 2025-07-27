# 🚀 Complete Deployment Setup Guide

## One-Command Setup (Recommended)

### Step 1: Run Netlify Setup
```bash
./scripts/netlify-setup.sh
```

This will:
- ✅ Install Netlify CLI
- ✅ Login to Netlify (opens browser)
- ✅ Create and configure your site
- ✅ Set environment variables
- ✅ Deploy your app

### Step 2: Run AWS DNS Setup
```bash
./scripts/aws-route53-setup.sh
```

This will:
- ✅ Configure DNS records in Route 53
- ✅ Point your domains to Netlify
- ✅ Wait for DNS propagation

## Manual Setup (If scripts don't work)

### Netlify Manual Setup

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Create Site from GitHub**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Select your GitHub repo: `meetd-personal/simplyb`
   - Build command: `npm ci && npx expo export --platform web --output-dir dist --clear`
   - Publish directory: `dist`

4. **Set Environment Variables**
   ```bash
   netlify env:set EXPO_PUBLIC_SUPABASE_URL "your_supabase_url"
   netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "your_supabase_key"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### AWS Route 53 Manual Setup

1. **Get your Netlify site URL** (e.g., `amazing-name-123456.netlify.app`)

2. **Update DNS in AWS Console**
   - Go to Route 53 → Hosted zones → meetdigrajkar.ca
   - Create CNAME record:
     - Name: `apps.simplyb`
     - Type: `CNAME`
     - Value: `your-netlify-site.netlify.app`
   - Create another CNAME record:
     - Name: `join.simplyb`
     - Type: `CNAME`
     - Value: `your-netlify-site.netlify.app`

## Environment Variables Needed

You'll need these from your Supabase project:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase dashboard → Settings → API

## Verification Steps

### 1. Check Netlify Deployment
```bash
curl -I https://your-site.netlify.app
```

### 2. Check Custom Domain
```bash
curl -I https://apps.simplyb.meetdigrajkar.ca
curl -I https://join.simplyb.meetdigrajkar.ca
```

### 3. Test App Functionality
- Open https://apps.simplyb.meetdigrajkar.ca
- Try logging in
- Test creating a business
- Test sending an invitation

## Troubleshooting

### Netlify Build Fails
- Check environment variables are set
- Verify Supabase credentials
- Check build logs in Netlify dashboard

### DNS Not Working
- Wait up to 24 hours for propagation
- Check DNS with: `dig apps.simplyb.meetdigrajkar.ca`
- Verify CNAME records in Route 53

### App Not Loading
- Check browser console for errors
- Verify Supabase connection
- Check network tab for failed requests

## What Happens After Setup

✅ **Automatic Deployments**: Every git push triggers new deployment  
✅ **Custom Domains**: Your domains point to Netlify  
✅ **SSL Certificates**: Automatically provisioned by Netlify  
✅ **Performance**: Optimized with CDN and caching  
✅ **Monitoring**: Build logs and deploy previews  

## Support

If you encounter issues:
1. Check the build logs in Netlify dashboard
2. Verify environment variables are set correctly
3. Test DNS propagation with online tools
4. Check AWS Route 53 records are correct

Your Simply Business Tracker will be live and production-ready! 🎉

# Vercel Deployment Guide

This guide will help you deploy the Hotel Admin Panel to Vercel.

## Quick Start

### 1. Prepare Your Code

Make sure your code is ready:
```bash
# Test the build locally first
npm run build

# If build succeeds, you're ready to deploy!
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/yourusername/hotel-admin-panel.git
git push -u origin main
```

### 3. Deploy to Vercel

#### Method A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add `VITE_SUPABASE_URL` with your Supabase project URL
   - Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key
   - Make sure to add for **Production**, **Preview**, and **Development**
6. Click **"Deploy"**

#### Method B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time will ask questions)
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

## Environment Variables

You need to set these in Vercel:

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase Dashboard > Settings > API > anon public key |

## Configuration Files

The project includes:
- `vercel.json` - Vercel configuration for SPA routing
- Build output: `dist/` (auto-generated)
- Framework: Vite (auto-detected by Vercel)

## Post-Deployment Checklist

- [ ] Verify the site loads at your Vercel URL
- [ ] Test login functionality
- [ ] Check that Supabase connection works
- [ ] Test room management features
- [ ] Verify reports are working
- [ ] Check mobile responsiveness

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure TypeScript compiles without errors: `npm run build`

### Environment Variables Not Working
- Make sure variables start with `VITE_` prefix
- Redeploy after adding environment variables
- Check Vercel logs for errors

### 404 Errors on Routes
- The `vercel.json` file handles SPA routing
- All routes should redirect to `index.html`

### Supabase Connection Issues
- Verify environment variables in Vercel dashboard
- Check Supabase project is active
- Ensure RLS policies allow your Vercel domain

### CORS Errors
- Add your Vercel domain to Supabase allowed origins
- Go to Supabase Dashboard > Settings > API > Allowed Origins

## Updating Your Deployment

After making changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically:
- Detect the push
- Build the new version
- Deploy it (usually takes 1-2 minutes)

## Monitoring

- View deployment logs in Vercel dashboard
- Check analytics in Vercel project overview
- Monitor errors in Vercel logs

## Support

For issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Test Supabase connection independently


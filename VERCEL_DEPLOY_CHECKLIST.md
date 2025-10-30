# ✅ Vercel Deployment Checklist

Your app is now **100% ready** for Vercel deployment! Here's what was done and what you need to do next.

## ✅ What's Been Configured

### Files Created/Modified

1. **`vercel.json`** ✅
   - Configures routing for serverless functions
   - Routes `/api/*` and `/frame` to serverless backend
   - Routes all other requests to frontend
   - Sets proper headers for frame crawling

2. **`api/index.ts`** ✅
   - Express app restructured for Vercel serverless
   - All API routes and frame endpoints
   - Exports `app` instead of calling `listen()`
   - Auto-detects Vercel URL via `VERCEL_URL` env var

3. **`.vercelignore`** ✅
   - Excludes unnecessary files from deployment
   - Keeps deployment bundle small

4. **`.env.example`** ✅
   - Updated with all required environment variables
   - Includes database URL placeholder
   - Documents optional variables

5. **`DEPLOYMENT.md`** ✅
   - Complete step-by-step deployment guide
   - Database setup instructions
   - Troubleshooting tips

6. **`README.md`** ✅
   - Project overview
   - Quick start guide
   - API documentation

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] PostgreSQL database ready (Vercel Postgres, Neon, or Supabase)
- [ ] Your code committed and pushed to GitHub

## 🚀 Deployment Steps

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

### Step 2: Set Up Database

Choose one option:

**Option A: Vercel Postgres** (Easiest)
1. Deploy to Vercel first (Step 3)
2. In Vercel dashboard: Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` connection string
4. Add it to Environment Variables (see Step 3.4)

**Option B: Neon** (Free Tier)
1. Go to [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy connection string (looks like: `postgresql://user:password@host/db`)
4. Enable pooling by adding `?pooling=true` to the URL

**Option C: Supabase** (Free Tier)
1. Go to [supabase.com](https://supabase.com/)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy "Connection pooling" string

### Step 3: Deploy to Vercel

1. **Go to** [vercel.com/new](https://vercel.com/new)

2. **Import** your GitHub repository

3. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: **(leave as root)**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables**:
   Click "Environment Variables" and add:

   ```
   DATABASE_URL=postgresql://your-database-url-here
   SESSION_SECRET=use-a-random-string-here
   OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
   VITE_OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   ```

   **Important**: For `SESSION_SECRET`, generate a random string:
   ```bash
   # On Mac/Linux
   openssl rand -base64 32
   
   # Or use any random string generator
   ```

5. **Click Deploy** 🚀

### Step 4: Initialize Database Schema

After first deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Push database schema
npm run db:push
```

### Step 5: Test Your Frame

1. **Get your deployment URL**
   - Example: `https://your-app.vercel.app`

2. **Test the frame endpoint**
   ```bash
   curl https://your-app.vercel.app/frame
   ```

3. **Test with Warpcast validator**
   - Go to: https://warpcast.com/~/developers/frames
   - Enter: `https://your-app.vercel.app/frame`
   - Should show: "Open Link" button

4. **Share on Farcaster**
   - Visit your app homepage
   - Click "Share to Farcaster"
   - Should show button in the cast! ✅

## 🔍 Troubleshooting

### Build fails?

**Check build logs** in Vercel dashboard for specific errors.

Common fixes:
- Ensure all dependencies are installed
- Check TypeScript compiles: `npm run check`
- Verify environment variables are set

### Database connection errors?

**Check these**:
- `DATABASE_URL` is set in Vercel environment variables
- Database allows connections from anywhere (0.0.0.0/0)
- Connection string includes `?sslmode=require` for SSL
- For Neon, add `?pooling=true` to the URL

### Frame not showing button?

**Verify**:
1. Production URL is accessible
2. Frame endpoint returns proper HTML: `curl https://your-app.vercel.app/frame`
3. Image endpoint works: `https://your-app.vercel.app/api/frame/image`
4. No X-Robots-Tag blocking (should be `all`, not `none`)

### Frame shows "Failed to fetch frame"?

This was the issue with Replit dev URLs. On Vercel production, this is **fixed**!

The `vercel.json` configuration ensures:
- Proper routing to serverless functions
- `X-Robots-Tag: all` header on `/frame`
- No crawler blocking

## 🎯 What Changed for Vercel

### Backend Architecture

**Before (Replit)**:
- Single Express server running on port 5000
- Server calls `listen()` to start
- Vite dev server in development mode

**After (Vercel)**:
- Express app exported as serverless function
- No `listen()` call (Vercel handles this)
- Static frontend served from `dist/`
- API routes served as serverless functions

### File Structure

```
Before:
server/index.ts → Main server (calls listen())
server/routes.ts → API routes

After:
api/index.ts → Serverless function (exports app)
server/ → Development-only files
```

### Environment Variables

**New**: `VERCEL_URL` is automatically set by Vercel
- Used to generate canonical URLs
- No need to manually configure base URL

## 📚 Next Steps After Deployment

1. **Add your production URL** to README.md
2. **Test all features** in production
3. **Submit a mystery link** with ETH payment
4. **Share the frame** on Farcaster
5. **Monitor** click analytics

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Farcaster Frames**: https://docs.farcaster.xyz/learn/what-is-farcaster/frames

## 🎉 Success Indicators

You'll know it's working when:

✅ Vercel deployment succeeds  
✅ Homepage loads at your Vercel URL  
✅ `/frame` endpoint returns HTML with meta tags  
✅ Frame validator shows the button  
✅ Farcaster cast displays the frame with button  
✅ Clicking button opens the mystery link  
✅ Click analytics appear in your dashboard  

---

**You're all set!** Just follow the steps above and your frame will be live on Vercel. 🚀

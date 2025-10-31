# Complete Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

1. ✅ Supabase account and project created
2. ✅ Database tables created with ALL required columns
3. ✅ Supabase credentials ready (URL and keys)
4. ✅ GitHub repository for your code

---

## Step 1: Fix Your Supabase Database Schema

**IMPORTANT:** Your database is missing columns that the app needs!

### Run This SQL in Supabase SQL Editor

Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new`

Copy and paste this entire SQL script:

```sql
-- Add missing columns to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_username TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS submitter_pfp_url TEXT;

-- Add missing columns to clicks table
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_username TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS clicker_pfp_url TEXT;

-- Verify the schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'links'
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clicks'
ORDER BY ordinal_position;
```

Click **RUN** to execute this SQL.

### Expected Output:
You should see these columns in the `links` table:
- id
- url
- submitted_by
- **submitter_username** ← NEW
- **submitter_pfp_url** ← NEW
- tx_hash
- created_at

You should see these columns in the `clicks` table:
- id
- link_id
- clicked_by
- **clicker_username** ← NEW
- **clicker_pfp_url** ← NEW
- user_agent
- clicked_at

---

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase project settings
2. Navigate to: **Settings → API**
3. Copy these values:

   - **Project URL** → This is your `SUPABASE_URL`
   - **anon/public key** → This is your `SUPABASE_ANON_KEY`
   - **service_role key** → This is your `SUPABASE_SERVICE_ROLE_KEY` (recommended)

**Example:**
```
SUPABASE_URL=https://tmmqzpybrhmjutotvmxn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Push Your Code to GitHub

```bash
git add .
git commit -m "Fix Vercel deployment with simplified API handler"
git push
```

---

## Step 4: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **DO NOT click Deploy yet!**
4. Configure Environment Variables first ↓

### Configure Environment Variables

Click "Environment Variables" and add these **EXACTLY** as shown:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://tmmqzpybrhmjutotvmxn.supabase.co` | Production ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbXF6cHlicmhtanV0b3R2bXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjg1MCwiZXhwIjoyMDc2ODg4ODUwfQ.DWNA6s-JmGjhWEBRzhddKUxI5N5sPkG2h1Fmgr-Wq-E` | Production ✅ |
| `OWNER_WALLET_ADDRESS` | `0x31F02Ed2c900A157C851786B43772F86151C7E34` | Production ✅ |
| `VITE_OWNER_WALLET_ADDRESS` | `0x31F02Ed2c900A157C851786B43772F86151C7E34` | Production ✅ |
| `BASE_MAINNET_RPC_URL` | `https://mainnet.base.org` | Production ✅ |

**CRITICAL CHECKLIST:**
- ✅ **Production** checkbox is checked for EACH variable
- ✅ No extra spaces before or after values
- ✅ All values are copied exactly as shown
- ✅ SUPABASE_URL starts with `https://`
- ✅ Keys are the full JWT tokens (very long strings)

5. Now click **Deploy**

---

## Step 5: Verify Deployment

### After deployment completes:

1. **Check Runtime Logs:**
   - Go to your deployment in Vercel Dashboard
   - Click **View Function Logs** or **Runtime Logs**
   - You should see: `✓ Database connected`
   - If you see errors, check Step 6 below

2. **Test Your API Endpoints:**

   Open these URLs (replace `your-app.vercel.app` with your actual domain):

   ```
   https://your-app.vercel.app/api/base-url
   https://your-app.vercel.app/api/current-link
   https://your-app.vercel.app/api/recent-clicks
   ```

   - `/api/base-url` should return: `{"baseUrl":"https://your-app.vercel.app"}`
   - `/api/current-link` might return 404 if no links exist (this is OK!)
   - `/api/recent-clicks` should return: `[]` (empty array if no clicks)

3. **Test the Frontend:**
   - Visit: `https://your-app.vercel.app`
   - The page should load without errors in the browser console
   - Check browser console (F12 → Console tab)
   - You should NOT see: `404 (Not Found)` for API calls

---

## Step 6: Troubleshooting

### Problem: API returns 404 errors

**Solution:** Check that `api/index.js` file exists in your repository

```bash
# Verify the file exists
ls -la api/

# Should show:
# api/index.js
```

### Problem: Database connection errors

**Solution:** Verify environment variables in Vercel

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. Click "Edit" on each variable to verify the values are correct
4. After fixing, click **Redeploy** on your latest deployment

### Problem: "No link available yet" showing when you have data

**Solution:** You're connecting to the wrong Supabase database

1. Check your `SUPABASE_URL` in Vercel matches your data
2. Log into Supabase and verify you're looking at the right project
3. Check if your data is in: `https://supabase.com/dashboard/project/tmmqzpybrhmjutotvmxn/editor`

### Problem: Missing columns error in logs

**Solution:** Run the SQL from Step 1 again

The error will look like: `column "submitter_username" does not exist`

---

## Step 7: Testing Your Deployed App

### Test 1: Check the Home Page
```
Visit: https://your-app.vercel.app
Expected: Page loads, shows "No link added" or your existing links
```

### Test 2: Check API Endpoints
```bash
# Test base URL
curl https://your-app.vercel.app/api/base-url

# Test current link
curl https://your-app.vercel.app/api/current-link

# Test recent clicks
curl https://your-app.vercel.app/api/recent-clicks
```

### Test 3: Check Farcaster Frame
```
Visit: https://your-app.vercel.app/frame
Expected: HTML with frame metadata
```

---

## Summary of Changes Made

I've simplified your Vercel deployment by:

1. **Created a new `/api/index.js` file** - A standalone Express app that doesn't need bundling
2. **Updated `vercel.json`** - Simplified rewrites to point to `/api` directly
3. **Fixed database schema** - Added missing columns for username and profile pictures
4. **Removed complex build process** - Now just builds the frontend with `vite build`

The new setup is:
- ✅ Simpler and more reliable
- ✅ Works with Vercel's serverless functions out of the box
- ✅ Uses your correct Supabase database
- ✅ All API routes properly configured

---

## Need Help?

If you're still having issues after following all steps:

1. Share the **Runtime Logs** from Vercel
2. Share the **browser console errors** (F12 → Console)
3. Confirm which Supabase project URL you're using
4. Check that all environment variables are set in Vercel (with Production checked)

---

## Quick Reference: Required Environment Variables

Copy this and set in Vercel:

```bash
SUPABASE_URL=https://tmmqzpybrhmjutotvmxn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbXF6cHlicmhtanV0b3R2bXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjg1MCwiZXhwIjoyMDc2ODg4ODUwfQ.DWNA6s-JmGjhWEBRzhddKUxI5N5sPkG2h1Fmgr-Wq-E
OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
VITE_OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

**Important:** Make sure "Production" is checked ✅ for EVERY variable!

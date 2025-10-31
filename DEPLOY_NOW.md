# 🚀 Ready to Deploy to Vercel

## ✅ What's Fixed

### Replit (Working Now!)
- ✅ Connected to correct Supabase database
- ✅ Showing 3 links and 14 clicks
- ✅ All API endpoints working

### Vercel (Ready to Deploy)
- ✅ Created new simplified `/api/index.js` serverless function
- ✅ Updated `vercel.json` configuration  
- ✅ Database schema fixed with all required columns

---

## 📋 Deploy to Vercel in 3 Steps

### Step 1: Push Code to GitHub (2 minutes)

```bash
git add .
git commit -m "Fix Vercel deployment with simplified API"
git push
```

### Step 2: Configure Vercel Environment Variables (5 minutes)

Go to your Vercel project: **Settings → Environment Variables**

Add these variables (make sure **Production** ✅ is checked for each one):

```env
SUPABASE_URL=https://tmmqzpybrhmjutotvmxn.supabase.co

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbXF6cHlicmhtanV0b3R2bXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjg1MCwiZXhwIjoyMDc2ODg4ODUwfQ.DWNA6s-JmGjhWEBRzhddKUxI5N5sPkG2h1Fmgr-Wq-E

OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34

VITE_OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34

BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

**CRITICAL CHECKLIST:**
- [ ] "Production" checkbox is checked ✅ for EVERY variable
- [ ] No extra spaces in the values
- [ ] All 5 variables are added
- [ ] SUPABASE_SERVICE_ROLE_KEY is the long JWT token (starts with `eyJ`)

### Step 3: Deploy (1 minute)

1. Go to your latest deployment in Vercel
2. Click **Redeploy** button
3. Wait for deployment to complete (~2 minutes)

---

## 🧪 Test Your Deployment

Once deployed, test these URLs (replace `your-app.vercel.app` with your actual domain):

### 1. Test API Endpoints
```bash
# Should return: {"baseUrl":"https://your-app.vercel.app"}
curl https://your-app.vercel.app/api/base-url

# Should return your latest link data
curl https://your-app.vercel.app/api/current-link

# Should return array of clicks
curl https://your-app.vercel.app/api/recent-clicks
```

### 2. Test in Browser
Visit: `https://your-app.vercel.app`

**Open browser console (F12 → Console)**

You should **NOT** see these errors anymore:
- ❌ `GET /api/current-link 404 (Not Found)`
- ❌ `GET /api/recent-clicks 404 (Not Found)`

You **SHOULD** see:
- ✅ Your 3 links displayed
- ✅ Your 14 clicks showing up
- ✅ No 404 errors in console

### 3. Check Vercel Logs
In Vercel Dashboard → Your Deployment → **Runtime Logs**

Look for:
```
✓ Database connected
```

---

## 🐛 Troubleshooting

### Still getting 404 errors?

**Check 1:** Verify `api/index.js` exists in your GitHub repository
```bash
# Run this command locally
ls -la api/
# Should show: api/index.js
```

**Check 2:** Verify environment variables in Vercel
- Go to Settings → Environment Variables
- Make sure all 5 variables are set
- Check "Production" is enabled for each
- Click "Redeploy" after fixing

### Database connection errors in Vercel logs?

**Fix:** Double-check the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values
- Copy them directly from Supabase Dashboard → Settings → API
- Make sure there are no extra spaces
- Redeploy after fixing

### Showing "No link available" when you have data?

**Fix:** You might have the wrong SUPABASE_URL
- Check that your URL is: `https://tmmqzpybrhmjutotvmxn.supabase.co`
- This should match where your 3 links and 14 clicks are stored

---

## 📁 What Changed

### New Files:
- `/api/index.js` - Simplified serverless function (works directly with Vercel)
- `VERCEL_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `DEPLOY_NOW.md` - This quick reference file
- `FIX_SUMMARY.md` - Detailed summary of all fixes
- `scripts/diagnose-database.ts` - Database diagnostic tool

### Modified Files:
- `vercel.json` - Simplified rewrites configuration
- `setup_supabase_tables.sql` - Added missing database columns

### How It Works Now:
1. **Frontend** → Built with `vite build` to `dist/public`
2. **API** → Runs as Vercel serverless function from `/api/index.js`
3. **Database** → Connects to your Supabase database with 3 links and 14 clicks
4. **Routing** → All `/api/*` and `/frame` requests go to the serverless function

---

## ✨ Expected Results

After successful deployment:

✅ **Vercel site loads without errors**
✅ **All API endpoints return data (not 404)**
✅ **Your 3 links are visible in the UI**
✅ **Your 14 clicks are displayed**
✅ **Farcaster frame works at /frame**
✅ **No console errors in browser**

---

## 🎯 Quick Verification Script

After deploying, run this to test everything:

```bash
# Replace YOUR_DOMAIN with your actual Vercel domain
export DOMAIN="your-app.vercel.app"

echo "Testing API endpoints..."
curl -s https://$DOMAIN/api/base-url | jq
curl -s https://$DOMAIN/api/current-link | jq
curl -s https://$DOMAIN/api/recent-clicks | jq

echo "✅ If all commands returned JSON data, your deployment is working!"
```

---

## 🆘 Still Need Help?

If deployment fails after following all steps, share:

1. **Vercel Runtime Logs** (from Vercel Dashboard)
2. **Browser Console Errors** (F12 → Console tab)
3. **Screenshot of Environment Variables** (in Vercel Settings)

I can help debug from there!

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ No 404 errors in browser console
- ✅ Vercel logs show "✓ Database connected"
- ✅ Your links and clicks display on the page
- ✅ `/frame` endpoint returns frame metadata HTML

Good luck with your deployment! 🚀

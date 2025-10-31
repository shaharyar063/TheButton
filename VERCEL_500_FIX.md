# Fix Vercel 500 Errors

## 🚨 Current Issue

Your Vercel deployment at `https://the-button-eight.vercel.app` is returning **500 Internal Server Error** on all API endpoints:

```
GET /api/recent-clicks → 500
GET /api/current-link → 500
GET /api/base-url → 500
```

This means the serverless function is **crashing** - most likely due to missing environment variables.

---

## ✅ Step 1: Check Vercel Runtime Logs (CRITICAL!)

1. Go to: https://vercel.com/dashboard
2. Click on your project: **the-button-eight**
3. Click on the latest **Deployment**
4. Click the **"Functions"** tab or **"Runtime Logs"** tab
5. Look for error messages

### What to Look For:

**If you see:**
```
Error: Database credentials not configured
```
→ Your `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing

**If you see:**
```
Cannot find module '@supabase/supabase-js'
```
→ Your `api/index.js` needs a `package.json`

**If you see:**
```
ECONNREFUSED or connection error
```
→ Your database URL is wrong

**Share the exact error message you see in the logs!**

---

## ✅ Step 2: Verify Environment Variables in Vercel

Go to: **Vercel Dashboard → the-button-eight → Settings → Environment Variables**

You MUST have these **5 variables** with **Production** ✅ checked:

### Required Variables:

| Variable Name | Value Starts With | Production ✅ |
|---------------|-------------------|---------------|
| `SUPABASE_URL` | `https://tmmqzpybrhmjutotvmxn.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `OWNER_WALLET_ADDRESS` | `0x31F02Ed2c900A157C851786B43772F86151C7E34` | ✅ |
| `VITE_OWNER_WALLET_ADDRESS` | `0x31F02Ed2c900A157C851786B43772F86151C7E34` | ✅ |
| `BASE_MAINNET_RPC_URL` | `https://mainnet.base.org` | ✅ |

### Common Mistakes:

❌ **Production checkbox NOT checked** → Variable won't be available  
❌ **Extra spaces** before/after values → Connection will fail  
❌ **Wrong SUPABASE_URL** → Will connect to wrong database  
❌ **ANON_KEY instead of SERVICE_ROLE_KEY** → Limited permissions

---

## ✅ Step 3: Create package.json for Vercel Serverless Function

Vercel serverless functions need their own `package.json` to specify dependencies.

Create this file: `api/package.json`

```json
{
  "name": "mystery-link-api",
  "version": "1.0.0",
  "type": "commonjs",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2"
  }
}
```

This tells Vercel to install `@supabase/supabase-js` and `express` for the serverless function.

---

## ✅ Step 4: Push Code and Redeploy

```bash
# Push the new api/package.json
git add api/package.json
git commit -m "Add package.json for Vercel serverless function"
git push

# Vercel will auto-deploy, or manually trigger redeploy
```

After deploying:
1. Check **Runtime Logs** again
2. Look for success message or new errors
3. Test your API endpoints

---

## 🧪 Step 5: Test After Redeployment

```bash
# Test these URLs in your browser or with curl
curl https://the-button-eight.vercel.app/api/base-url
curl https://the-button-eight.vercel.app/api/current-link
curl https://the-button-eight.vercel.app/api/recent-clicks
```

### Expected Results:

✅ **Should return JSON data** (not 500 error)  
✅ **Browser console shows no 500 errors**  
✅ **Vercel logs show:** `✓ Database connected`

---

## 📋 Full Environment Variables (Copy-Paste)

**IMPORTANT:** These values are specific to your project. Copy them EXACTLY:

```env
SUPABASE_URL=https://tmmqzpybrhmjutotvmxn.supabase.co

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbXF6cHlicmhtanV0b3R2bXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMxMjg1MCwiZXhwIjoyMDc2ODg4ODUwfQ.DWNA6s-JmGjhWEBRzhddKUxI5N5sPkG2h1Fmgr-Wq-E

OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34

VITE_OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34

BASE_MAINNET_RPC_URL=https://mainnet.base.org
```

**After adding these:**
1. Make sure **Production** ✅ is checked for EVERY variable
2. Click **Save**
3. Click **Redeploy** on your latest deployment

---

## 🐛 Still Getting 500 Errors?

### Debug Checklist:

1. ✅ **All 5 environment variables are set in Vercel?**
2. ✅ **Production checkbox is checked for each variable?**
3. ✅ **No extra spaces in the values?**
4. ✅ **`api/package.json` file exists in your repository?**
5. ✅ **`api/index.js` file exists in your repository?**
6. ✅ **Latest code is pushed to GitHub?**
7. ✅ **Redeployed after making changes?**

### Share These for Help:

If still broken, share:
1. **Screenshot of Vercel Environment Variables** (Settings → Environment Variables)
2. **Vercel Runtime Logs** (copy the error messages)
3. **List of files in `/api` folder** (run: `ls -la api/`)

---

## 📝 Quick Reference

### Files That Should Exist:
```
api/
  ├── index.js        ← Serverless function
  └── package.json    ← Dependencies (CREATE THIS!)
```

### Vercel Configuration:
```
vercel.json configured to route:
  /api/:path* → /api
  /frame → /api
```

### How to View Logs:
```
Vercel Dashboard → Your Project → Latest Deployment → Functions Tab
```

---

## 🎯 Most Likely Cause

Based on the 500 errors, the issue is **99% likely** one of these:

1. **Missing `api/package.json`** ← CREATE THIS FILE!
2. **Missing environment variables** in Vercel
3. **Wrong SUPABASE_URL** value
4. **Production checkbox not checked** on env vars

Start with creating `api/package.json` and redeploying!

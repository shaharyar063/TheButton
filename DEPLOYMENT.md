# Vercel Deployment Guidenknk

This app is ready to deploy on Vercel! Follow these steps:

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Database** - Your app is configured to use Supabase
   - Make sure you have created the tables in Supabase (see SUPABASE_SETUP.md)

## Step 1: Ensure Database is Set Up

Make sure you have:
1. Created your Supabase project
2. Created the required tables (see SUPABASE_SETUP.md)
3. Have your Supabase credentials ready:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)

## Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3: Deploy to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: Leave as default (root)
   - **Build Command**: Leave as default (will use vercel.json)
   - **Output Directory**: Leave as default (will use vercel.json)
   - **Install Command**: `npm install`

4. Add Environment Variables (CRITICAL - Must include all):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
   VITE_OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   ```
   
   **Important Notes:**
   - Make sure "Production" environment is checked ✅ for each variable
   - Double-check there are no typos in variable names
   - Verify the values are correct (copy directly from Supabase dashboard)

5. Click **Deploy**

6. **After first deployment completes, click "Redeploy"**
   - Environment variables only apply to NEW deployments
   - This ensures your variables are active

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

## Step 4: Verify Deployment

After deployment:

1. Check the **Runtime Logs** in Vercel dashboard
   - Look for any errors related to database connection
   - Should see "✓ Database connected" message

2. Test the API endpoints:
   - Visit `https://your-app.vercel.app/frame`
   - Visit `https://your-app.vercel.app/api/current-link`

3. If you see database errors:
   - Verify environment variables are set correctly
   - Make sure "Production" is checked for all variables
   - Redeploy the application

## Step 5: Test Your Frame

1. Get your production URL (e.g., `https://your-app.vercel.app`)
2. Visit: `https://your-app.vercel.app/frame`
3. Test with Warpcast Frame Validator: [warpcast.com/~/developers/frames](https://warpcast.com/~/developers/frames)
4. Share on Farcaster!

## Troubleshooting

### "Database not showing any data" on Vercel

**Common Causes:**
1. **Environment variables not applied** - Variables only apply to NEW deployments
   - Solution: Click "Redeploy" after adding/changing variables
   
2. **Variables not enabled for Production** 
   - Solution: Go to Settings → Environment Variables → Edit each variable → Check "Production" ✅
   
3. **Tables not created in Supabase**
   - Solution: Follow SUPABASE_SETUP.md to create tables
   
4. **Incorrect variable values**
   - Solution: Copy values directly from Supabase dashboard, verify no typos

### "Cannot find module" errors

If you see `Cannot find module '/var/task/server/app'`:
- This means the build didn't complete properly
- Make sure your code is pushed to GitHub
- Check that `vercel.json` and `scripts/build-vercel.sh` exist in your repo
- Redeploy the application

### Checking Runtime Logs

To see what's actually happening:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on your latest deployment
3. Click "Runtime Logs" tab
4. Look for database connection messages or errors

## Important Notes

### Required Environment Variables

- `SUPABASE_URL`: Your Supabase project URL (required)
- `SUPABASE_ANON_KEY`: Supabase anonymous key (required)
- `OWNER_WALLET_ADDRESS`: Your ETH wallet address for payment verification
- `VITE_OWNER_WALLET_ADDRESS`: Same as above, for frontend
- `BASE_MAINNET_RPC_URL`: Base network RPC URL
- `VERCEL_URL`: Automatically set by Vercel (don't set manually)

### Database Connection Pooling

For Vercel's serverless functions, use connection pooling:

If using **Neon**:
```
DATABASE_URL=postgresql://user:password@host/db?sslmode=require&pooling=true
```

If using **Vercel Postgres**: Pooling is built-in, no changes needed.

### Image Conversion (SVG to PNG)

The frame uses ImageMagick (`convert` command) to convert SVG to PNG. Vercel doesn't have ImageMagick by default.

**Two options:**

1. **Keep SVG** (simplest): Some Farcaster clients support SVG
2. **Use a service**: Consider using a service like [Cloudinary](https://cloudinary.com/) for image conversion

If frames don't show images, SVG fallback will work for most clients.

### Cold Starts

Vercel serverless functions may have cold starts (1-3 second delay on first request). This is normal.

## Troubleshooting

### Frame not loading in Warpcast?

- Check that your production URL is accessible: `curl https://your-app.vercel.app/frame`
- Verify `X-Robots-Tag: all` header is present
- Use the Warpcast validator to check for errors

### Database connection errors?

- Ensure `DATABASE_URL` is set in Vercel environment variables
- Check that database allows connections from Vercel's IP range
- Verify SSL is enabled in connection string (`?sslmode=require`)

### Build fails?

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json` (not `devDependencies`)
- Verify TypeScript compiles: `npm run check`

## Updating Your Deployment

```bash
# Push changes to GitHub
git add .
git commit -m "Update"
git push

# Vercel will automatically deploy
```

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

Your frame URLs will then use your custom domain!

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Farcaster Frames Spec: [docs.farcaster.xyz/learn/what-is-farcaster/frames](https://docs.farcaster.xyz/learn/what-is-farcaster/frames)

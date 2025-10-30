# Vercel Deployment Guide

This app is ready to deploy on Vercel! Follow these steps:

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **PostgreSQL Database** - Use one of these options:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (recommended)
   - [Neon](https://neon.tech/) (free tier available)
   - [Supabase](https://supabase.com/) (free tier available)

## Step 1: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Click "Storage" → "Create Database" → "Postgres"
3. Copy the `DATABASE_URL` from the connection string

### Option B: Neon (Free Tier)

1. Go to [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string (starts with `postgresql://`)

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

### Via Vercel Dashboard (Easiest)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: Leave as default (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-random-secret-here
   OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
   VITE_OWNER_WALLET_ADDRESS=0x31F02Ed2c900A157C851786B43772F86151C7E34
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   ```

5. Click **Deploy**

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

## Step 4: Initialize Database

After deployment, run database migrations:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Run database push
vercel env pull .env.local
npm run db:push
```

## Step 5: Test Your Frame

1. Get your production URL (e.g., `https://your-app.vercel.app`)
2. Visit: `https://your-app.vercel.app/frame`
3. Test with Warpcast Frame Validator: [warpcast.com/~/developers/frames](https://warpcast.com/~/developers/frames)
4. Share on Farcaster!

## Important Notes

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required)
- `SESSION_SECRET`: Random secret for sessions (required)
- `OWNER_WALLET_ADDRESS`: Your ETH wallet address for payment verification
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

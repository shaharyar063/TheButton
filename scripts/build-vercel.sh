#!/bin/bash
set -e

echo "Building frontend..."
vite build

echo "Building API handler for Vercel serverless..."
npx esbuild src/api/index.ts --platform=node --bundle --format=cjs --outdir=api --external:express --external:@supabase/supabase-js --external:ws --external:bufferutil --external:@neondatabase/serverless --external:drizzle-orm --external:ethers

echo "Build complete!"

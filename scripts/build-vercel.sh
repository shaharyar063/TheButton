#!/bin/bash
set -e

echo "Building frontend..."
vite build

echo "Building server for standalone deployment..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Building API handler for Vercel serverless..."
npx esbuild api/index.ts --platform=node --bundle --format=esm --outdir=api --out-extension:.js=.js --external:@supabase/supabase-js --external:ws --external:bufferutil

echo "Build complete!"

#!/bin/bash
set -e

echo "Building frontend..."
vite build

echo "Building API handler for Vercel serverless..."
npx esbuild src/api/index.ts --platform=node --bundle --format=esm --outdir=api --out-extension:.js=.js --external:@supabase/supabase-js --external:ws --external:bufferutil --external:@neondatabase/serverless

echo "Build complete!"

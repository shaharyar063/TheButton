#!/bin/bash
set -e

echo "Building frontend..."
vite build

echo "Building API handler for Vercel serverless..."
npx esbuild src/api/index.ts --platform=node --bundle --format=cjs --outdir=api --out-extension:.js=.cjs --external:bufferutil --external:utf-8-validate

echo "Build complete!"

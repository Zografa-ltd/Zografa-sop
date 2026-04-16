#!/bin/bash
# scripts/deploy.sh
# Run on VPS: bash scripts/deploy.sh

set -e

echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
npm ci --production=false

echo "==> Building..."
npm run build

echo "==> Restarting app..."
pm2 restart zografa-sop || pm2 start ecosystem.config.js

echo "==> Done! App running."
pm2 status zografa-sop

#!/bin/bash
echo "🚀 Starting Bitcoin Monitor Development Server..."
echo "📍 Current directory: $(pwd)"
echo "📁 Checking for package.json..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

echo "📁 Checking for crypto_feeds.csv..."
if [ -f "crypto_feeds.csv" ]; then
    echo "✅ crypto_feeds.csv found ($(wc -l < crypto_feeds.csv) lines)"
else
    echo "❌ crypto_feeds.csv not found"
    exit 1
fi

echo "🔧 Starting Next.js development server..."
npx next dev --port 3000

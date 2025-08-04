#!/bin/bash

# Bitcoin Monitor Deployment Script
echo "🚀 Starting Bitcoin Monitor deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Find available port
    PORT=${PORT:-3001}
    while netstat -tlnp 2>/dev/null | grep -q ":$PORT "; do
        PORT=$((PORT + 1))
    done
    
    echo "🌐 Starting production server on port $PORT..."
    echo "📍 Application will be available at: http://localhost:$PORT"
    echo "📍 Network access at: http://$(hostname -I | cut -d' ' -f1):$PORT"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the production server
    PORT=$PORT npm start
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

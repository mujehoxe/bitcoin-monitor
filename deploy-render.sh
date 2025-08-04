#!/bin/bash

echo "🚀 Bitcoin Monitor - Render Deployment Setup"
echo "=============================================="
echo ""

# Check if render.yaml exists
if [[ -f "render.yaml" ]]; then
    echo "✅ render.yaml configuration file found"
else
    echo "❌ render.yaml not found. Creating it now..."
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: bitcoin-monitor
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    plan: free
    healthCheckPath: /
    env:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    envVars:
      - key: NEXT_TELEMETRY_DISABLED
        value: 1
EOF
    echo "✅ render.yaml created"
fi

# Check git status
echo ""
echo "🔍 Checking Git repository status..."
if git status --porcelain | grep -q .; then
    echo "📝 Uncommitted changes found. Committing them..."
    git add .
    git commit -m "Add Render deployment configuration"
    git push upstream main
    echo "✅ Changes pushed to GitHub"
else
    echo "✅ Repository is up to date"
fi

echo ""
echo "🌐 Repository Information:"
echo "   URL: $(git remote get-url upstream)"
echo "   Branch: $(git branch --show-current)"
echo ""

echo "📋 DEPLOYMENT OPTIONS:"
echo "======================"
echo ""
echo "Option 1: Blueprint Deployment (Recommended - Fully Automated)"
echo "--------------------------------------------------------------"
echo "1. Go to: https://dashboard.render.com/blueprints"
echo "2. Click 'New Blueprint'"
echo "3. Select 'Connect GitHub' and choose: mujehoxe/bitcoin-monitor"
echo "4. Render will auto-detect the render.yaml file"
echo "5. Click 'Apply Blueprint'"
echo ""

echo "Option 2: Manual Web Service Creation"
echo "------------------------------------"
echo "1. Go to: https://dashboard.render.com"
echo "2. Click 'New +' -> 'Web Service'"
echo "3. Connect GitHub repository: mujehoxe/bitcoin-monitor"
echo "4. Configure with these settings:"
echo "   - Name: bitcoin-monitor"
echo "   - Runtime: Node"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Plan: Free"
echo ""

echo "🔧 Configuration Details (from render.yaml):"
echo "============================================"
cat render.yaml
echo ""

echo "🎯 After deployment, your app will be available at:"
echo "   https://bitcoin-monitor-[random].onrender.com"
echo ""

echo "📊 To monitor deployment progress:"
echo "   render services list --output json | jq '.[] | select(.service.name==\"bitcoin-monitor\")'"
echo ""

echo "✨ Deployment preparation complete!"
echo "   Choose one of the options above to deploy to Render."

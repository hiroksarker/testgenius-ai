#!/bin/bash

# TestGenius AI - The Internet Tests Setup Script
# This script helps you set up the environment for running tests against The Internet site

echo "🚀 TestGenius AI - Setting up The Internet Tests"
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if Chrome is installed
if command -v google-chrome &> /dev/null; then
    echo "✅ Google Chrome is installed"
elif command -v chromium-browser &> /dev/null; then
    echo "✅ Chromium is installed"
elif command -v chrome &> /dev/null; then
    echo "✅ Chrome is installed"
else
    echo "⚠️  Chrome/Chromium not found. Please install a Chromium-based browser."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p test-results
mkdir -p reports
mkdir -p screenshots
mkdir -p logs

# Create a simple test file for demonstration
echo "📝 Creating test file..."
cat > test-file.txt << EOF
This is a test file for the file upload test.
Created by TestGenius AI setup script.
EOF

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Run tests directly (no standalone server needed):"
echo "   npm run test:internet:list     # List all available tests"
echo "   npm run test:internet          # Run all tests"
echo "   npm run test:internet:single INTERNET-001  # Run specific test"
echo ""
echo "2. View results:"
echo "   npm run test:report            # Generate report"
echo "   npm run test:open              # Open latest report"
echo ""
echo "📚 For more information, see: THE_INTERNET_TESTING_GUIDE.md"
echo ""
echo "🌐 Testing site: https://the-internet.herokuapp.com/"
echo ""
echo "✨ TestGenius AI now uses direct browser automation - no Selenium server required!"
echo ""
echo "Happy testing! 🚀" 
#!/bin/bash

# TestGenius AI Setup Script
# This script helps you set up the TestGenius AI framework

set -e

echo "🧠 TestGenius AI Setup Script"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
echo ""
echo "📁 Creating project directories..."
mkdir -p tests
mkdir -p test-results
mkdir -p reports
mkdir -p screenshots
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "⚙️  Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your OpenAI API key."
else
    echo "✅ .env file already exists"
fi

# Check if Selenium is installed
if ! command -v selenium-standalone &> /dev/null; then
    echo ""
    echo "🔧 Installing Selenium Standalone Server..."
    npm install -g selenium-standalone
    selenium-standalone install
    echo "✅ Selenium Standalone Server installed"
else
    echo "✅ Selenium Standalone Server already installed"
fi

# Make the CLI executable
echo ""
echo "🔧 Making CLI executable..."
chmod +x bin/testgenius.js

# Create a global symlink for development
echo ""
echo "🔗 Creating global symlink..."
npm link

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your OpenAI API key"
echo "2. Start Selenium server: selenium-standalone start"
echo "3. Run your first test: testgenius run test AUTH-001"
echo "4. Or start the test recorder: testgenius run test-recorder"
echo ""
echo "For more information, run: testgenius help"
echo "" 
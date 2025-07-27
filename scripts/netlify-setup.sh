#!/bin/bash

# Netlify Automated Setup Script for Simply Business Tracker
# This script will set up Netlify deployment using the Netlify CLI

set -e

echo "🚀 Setting up Netlify deployment for Simply Business Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    print_status "Installing Netlify CLI..."
    npm install -g netlify-cli
    print_success "Netlify CLI installed"
else
    print_success "Netlify CLI already installed"
fi

# Login to Netlify
print_status "Logging into Netlify..."
print_warning "This will open your browser for authentication"
netlify login

# Initialize Netlify site
print_status "Creating Netlify site..."
netlify init

# Set build settings
print_status "Configuring build settings..."
netlify env:set BUILD_COMMAND "npm ci && npx expo export --platform web --output-dir dist --clear"
netlify env:set PUBLISH_DIR "dist"

# Prompt for environment variables
echo ""
print_warning "IMPORTANT: You need to add your Supabase environment variables"
echo "Please provide your Supabase credentials:"

read -p "Enter your EXPO_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "Enter your EXPO_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_KEY

if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_KEY" ]; then
    print_status "Setting environment variables..."
    netlify env:set EXPO_PUBLIC_SUPABASE_URL "$SUPABASE_URL"
    netlify env:set EXPO_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_KEY"
    print_success "Environment variables set"
else
    print_error "Environment variables not provided. You'll need to set them manually in Netlify dashboard."
fi

# Deploy the site
print_status "Deploying to Netlify..."
netlify deploy --prod

# Get site info
SITE_URL=$(netlify status --json | jq -r '.site_url')
SITE_ID=$(netlify status --json | jq -r '.site_id')

print_success "Deployment complete!"
echo ""
echo "📦 Site Information:"
echo "   Site URL: $SITE_URL"
echo "   Site ID: $SITE_ID"
echo "   Admin URL: https://app.netlify.com/sites/$SITE_ID"
echo ""
echo "🌐 Next Steps:"
echo "   1. Configure custom domain in Netlify dashboard"
echo "   2. Update DNS settings in AWS Route 53"
echo "   3. Test your live application"
echo ""
print_success "Netlify setup completed successfully!"

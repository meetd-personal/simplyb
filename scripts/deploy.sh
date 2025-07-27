#!/bin/bash

# Simply Business Tracker - Production Deployment Script
# This script builds and deploys the web app to production

set -e  # Exit on any error

echo "🚀 Starting Simply Business Tracker deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="dist"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"

# Function to print colored output
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please ensure environment variables are configured."
    exit 1
fi

# Verify Supabase configuration
print_status "Checking environment configuration..."
if ! grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
    print_error "EXPO_PUBLIC_SUPABASE_URL not found in .env file"
    exit 1
fi

if ! grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
    print_error "EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env file"
    exit 1
fi

print_success "Environment configuration verified"

# Clean previous build
print_status "Cleaning previous build..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    print_success "Previous build cleaned"
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Run tests (if they exist)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    print_status "Running tests..."
    npm test -- --watchAll=false || {
        print_error "Tests failed. Deployment aborted."
        exit 1
    }
    print_success "Tests passed"
fi

# Build the web app
print_status "Building web application..."
npx expo export --platform web --output-dir "$BUILD_DIR" --clear

if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build failed - $BUILD_DIR directory not created"
    exit 1
fi

print_success "Web application built successfully"

# Verify build contents
print_status "Verifying build contents..."
if [ ! -f "$BUILD_DIR/index.html" ]; then
    print_error "Build verification failed - index.html not found"
    exit 1
fi

if [ ! -d "$BUILD_DIR/_expo" ]; then
    print_error "Build verification failed - _expo directory not found"
    exit 1
fi

print_success "Build verification passed"

# Calculate build size
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
print_status "Build size: $BUILD_SIZE"

# Create deployment summary
cat > "$BUILD_DIR/DEPLOYMENT_INFO.txt" << EOF
Simply Business Tracker - Deployment Info
==========================================

Deployment Date: $(date)
Build Size: $BUILD_SIZE
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not a git repository")
Git Branch: $(git branch --show-current 2>/dev/null || echo "Not a git repository")

Bug Fixes Included:
- Deep linking configuration fixes
- Transaction validation improvements
- Authentication context race condition fixes
- Error boundary implementation
- Network error handling
- Performance optimizations
- Memory leak prevention
- Production logging system
- Crash reporting system
- Input validation enhancements

Deployment Instructions:
1. Upload contents of dist/ to your web hosting provider
2. Ensure all files maintain their directory structure
3. Configure your hosting to serve index.html for all routes (SPA routing)
4. Test the deployment at your production URL

Production URLs:
- Web App: https://apps.simplyb.meetdigrajkar.ca
- Invitation Page: https://join.simplyb.meetdigrajkar.ca
EOF

print_success "Deployment package ready!"

echo ""
echo "📦 Deployment Summary:"
echo "   Build Directory: $BUILD_DIR"
echo "   Build Size: $BUILD_SIZE"
echo "   Files Ready: $(find "$BUILD_DIR" -type f | wc -l) files"
echo ""
echo "🌐 Next Steps:"
echo "   1. Upload the contents of '$BUILD_DIR' to your web hosting"
echo "   2. Ensure SPA routing is configured (serve index.html for all routes)"
echo "   3. Test at https://apps.simplyb.meetdigrajkar.ca"
echo ""
print_success "Deployment script completed successfully!"

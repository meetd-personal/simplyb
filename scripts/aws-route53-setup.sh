#!/bin/bash

# AWS Route 53 DNS Setup Script for Simply Business Tracker
# This script configures DNS records to point to Netlify

set -e

echo "🌐 Setting up AWS Route 53 DNS for Simply Business Tracker..."

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

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first:"
    echo "  brew install awscli"
    echo "  aws configure"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run:"
    echo "  aws configure"
    exit 1
fi

# Get Netlify site URL
print_status "Please provide your Netlify site URL (without https://):"
read -p "Enter Netlify URL (e.g., amazing-name-123456.netlify.app): " NETLIFY_URL

if [ -z "$NETLIFY_URL" ]; then
    print_error "Netlify URL is required"
    exit 1
fi

# Get hosted zone ID for meetdigrajkar.ca
print_status "Finding hosted zone for meetdigrajkar.ca..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='meetdigrajkar.ca.'].Id" --output text | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    print_error "Could not find hosted zone for meetdigrajkar.ca"
    print_warning "Please check your AWS account and domain configuration"
    exit 1
fi

print_success "Found hosted zone: $HOSTED_ZONE_ID"

# Create DNS change batch
print_status "Creating DNS records..."

# Update the JSON template with actual Netlify URL
sed "s/YOUR_NETLIFY_SITE_URL_HERE/$NETLIFY_URL/g" scripts/aws-dns-setup.json > /tmp/dns-changes.json

# Apply DNS changes
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file:///tmp/dns-changes.json \
    --query 'ChangeInfo.Id' \
    --output text)

print_success "DNS changes submitted with ID: $CHANGE_ID"

# Wait for changes to propagate
print_status "Waiting for DNS changes to propagate..."
aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"

print_success "DNS changes have propagated!"

# Clean up
rm -f /tmp/dns-changes.json

echo ""
print_success "AWS Route 53 setup completed!"
echo ""
echo "📋 DNS Records Created:"
echo "   apps.simplyb.meetdigrajkar.ca → $NETLIFY_URL"
echo "   join.simplyb.meetdigrajkar.ca → $NETLIFY_URL"
echo ""
echo "🌐 Your domains should now point to Netlify!"
echo "   Note: DNS propagation can take up to 24 hours globally"
echo ""
echo "🧪 Test your setup:"
echo "   curl -I https://apps.simplyb.meetdigrajkar.ca"
echo "   curl -I https://join.simplyb.meetdigrajkar.ca"

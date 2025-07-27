# Send Invitation Email Function

This Supabase Edge Function handles sending team invitation emails with support for multiple email providers.

## Setup

### 1. Deploy the Function

```bash
supabase functions deploy send-invitation-email
```

### 2. Set Environment Variables

Set these environment variables in your Supabase project:

```bash
# Option 1: Resend (Recommended)
supabase secrets set RESEND_API_KEY=your_resend_api_key

# Option 2: SendGrid (Alternative)
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key
```

### 3. Configure Email Domain

Update the `from` email address in the function:
- Line 47: Change `noreply@your-domain.com` to your verified domain
- Line 95: Change `noreply@your-domain.com` to your verified domain

## Email Providers

### Resend (Recommended)
- Sign up at [resend.com](https://resend.com)
- Verify your domain
- Get API key from dashboard
- Set `RESEND_API_KEY` environment variable

### SendGrid (Alternative)
- Sign up at [sendgrid.com](https://sendgrid.com)
- Verify your domain
- Get API key from dashboard
- Set `SENDGRID_API_KEY` environment variable

## Development Mode

If no email service is configured, the function will log email details to the console for development purposes.

## Function Usage

The function is automatically called by the TeamInvitationService when sending invitations:

```typescript
const { data, error } = await supabase.functions.invoke('send-invitation-email', {
  body: {
    to: 'user@example.com',
    subject: 'You\'re invited to join Business Name',
    html: emailHtmlContent,
    invitationData: {
      businessName: 'Business Name',
      inviterName: 'John Doe',
      role: 'EMPLOYEE',
      invitationUrl: 'https://your-app.com/invite/token123',
      deepLinkUrl: 'simply://invite/token123',
      expiresAt: '2024-01-01T00:00:00.000Z'
    }
  }
});
```

## Email Template

The function generates a professional HTML email template with:
- Business branding
- Role information and permissions
- Clear call-to-action button
- Invitation expiration date
- Instructions for new users

## Testing

Test the function locally:

```bash
supabase functions serve send-invitation-email
```

Then make a POST request to test:

```bash
curl -X POST http://localhost:54321/functions/v1/send-invitation-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Invitation",
    "html": "<h1>Test</h1>",
    "invitationData": {
      "businessName": "Test Business",
      "inviterName": "Test User",
      "role": "EMPLOYEE",
      "invitationUrl": "https://test.com/invite/123",
      "deepLinkUrl": "simply://invite/123",
      "expiresAt": "2024-12-31T23:59:59.000Z"
    }
  }'
```

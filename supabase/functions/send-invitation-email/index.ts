import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Email service configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationEmailRequest {
  to: string;
  subject: string;
  html: string;
  invitationData: {
    businessName: string;
    inviterName: string;
    role: string;
    invitationUrl: string;
    deepLinkUrl: string;
    expiresAt: string;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, invitationData }: InvitationEmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !invitationData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Note: Supabase client not needed for this email-only function

    // Check if any email service is configured
    if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
      console.warn('⚠️ No email service configured. Logging invitation details instead.')

      // Log invitation details for development
      console.log('📧 INVITATION EMAIL DETAILS:')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('Business:', invitationData.businessName)
      console.log('Inviter:', invitationData.inviterName)
      console.log('Role:', invitationData.role)
      console.log('Invitation URL:', invitationData.invitationUrl)
      console.log('Deep Link:', invitationData.deepLinkUrl)
      console.log('Expires:', invitationData.expiresAt)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email logged (no service configured)',
          emailDetails: {
            to,
            subject,
            invitationUrl: invitationData.invitationUrl,
            deepLinkUrl: invitationData.deepLinkUrl
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Option 1: Use Resend (recommended for production)
    console.log('🔑 RESEND_API_KEY available:', !!RESEND_API_KEY)
    if (RESEND_API_KEY) {
      const emailPayload = {
        from: 'noreply@mail.meetdigrajkar.ca',
        to: [to],
        subject: subject,
        html: html,
        tags: [
          { name: 'category', value: 'team-invitation' },
          { name: 'business', value: invitationData.businessName.replace(/[^a-zA-Z0-9_-]/g, '_') },
          { name: 'environment', value: 'development' }
        ]
      }
      console.log('📧 Sending email with payload:', JSON.stringify(emailPayload, null, 2))

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text()
        console.error('❌ Resend API error:', errorData)
        console.error('❌ Response status:', emailResponse.status)
        console.error('❌ Response headers:', Object.fromEntries(emailResponse.headers.entries()))
        throw new Error(`Resend API error (${emailResponse.status}): ${errorData}`)
      }

      const emailData = await emailResponse.json()
      console.log('✅ Email sent via Resend:', emailData.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          emailId: emailData.id,
          provider: 'resend'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Option 2: Use SendGrid as fallback
    if (SENDGRID_API_KEY) {
      const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            subject: subject
          }],
          from: { 
            email: 'noreply@your-domain.com', 
            name: 'Simply Business' 
          },
          content: [{
            type: 'text/html',
            value: html
          }],
          categories: ['team-invitation'],
          custom_args: {
            business_name: invitationData.businessName,
            invitation_role: invitationData.role
          }
        }),
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text()
        console.error('SendGrid API error:', errorData)
        throw new Error(`Email service error: ${emailResponse.status}`)
      }

      console.log('✅ Email sent via SendGrid')

      return new Response(
        JSON.stringify({ 
          success: true,
          provider: 'sendgrid'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Option 3: Log for development (no email service configured)
    console.log('📧 DEVELOPMENT MODE - Email would be sent:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Business:', invitationData.businessName)
    console.log('Inviter:', invitationData.inviterName)
    console.log('Role:', invitationData.role)
    console.log('Invitation URL:', invitationData.invitationUrl)
    console.log('Deep Link:', invitationData.deepLinkUrl)
    console.log('Expires:', invitationData.expiresAt)

    return new Response(
      JSON.stringify({ 
        success: true,
        provider: 'development-log',
        message: 'Email logged for development (no email service configured)'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Email function error:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))

    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: (error as Error).message || 'Unknown error',
        fullError: String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

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
  html?: string; // Optional - we'll generate our own
  invitationData: {
    businessName: string;
    inviterName: string;
    role: string;
    invitationUrl: string;
    deepLinkUrl: string;
    expiresAt: string;
  };
}

// Generate modern, responsive email template
function generateModernEmailTemplate(data: InvitationEmailRequest['invitationData']): string {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited to join ${data.businessName}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset and base styles */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
        }

        /* Container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }

        .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }

        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        /* Content */
        .content {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 24px;
        }

        .invitation-card {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid #667eea;
        }

        .business-name {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
        }

        .role-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
        }

        .inviter-info {
            margin-top: 16px;
            font-size: 16px;
            color: #4a5568;
        }

        /* CTA Button */
        .cta-container {
            text-align: center;
            margin: 32px 0;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
        }

        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        /* Features */
        .features {
            margin: 32px 0;
        }

        .feature {
            display: flex;
            align-items: center;
            margin: 16px 0;
            padding: 12px 0;
        }

        .feature-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            font-size: 18px;
        }

        .feature-text {
            flex: 1;
            font-size: 16px;
            color: #4a5568;
        }

        /* Links section */
        .links-section {
            background: #f7fafc;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }

        .link-item {
            margin: 12px 0;
        }

        .link-label {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
        }

        .link-url {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 14px;
            color: #667eea;
            word-break: break-all;
        }

        /* Expiry notice */
        .expiry-notice {
            background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
            border-left: 4px solid #e53e3e;
        }

        .expiry-notice .icon {
            font-size: 20px;
            margin-bottom: 8px;
        }

        .expiry-text {
            font-weight: 600;
            color: #742a2a;
        }

        /* Footer */
        .footer {
            background: #2d3748;
            color: #a0aec0;
            padding: 24px 30px;
            text-align: center;
            font-size: 14px;
        }

        .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: white;
            margin-bottom: 8px;
        }

        /* Mobile responsiveness */
        @media (max-width: 600px) {
            .email-container { margin: 10px; border-radius: 12px; }
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
            .header h1 { font-size: 24px; }
            .business-name { font-size: 20px; }
            .cta-button { padding: 14px 24px; font-size: 16px; }
            .invitation-card { padding: 20px; }
        }
    </style>
</head>
<body>
    <div style="background-color: #f8fafc; padding: 20px 0;">
        <div class="email-container">
            <!-- Header -->
            <div class="header">
                <div class="logo">S</div>
                <h1>🎉 You're Invited!</h1>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="greeting">
                    Hi there! 👋
                </div>

                <p style="font-size: 16px; color: #4a5568; margin-bottom: 24px;">
                    <strong>${data.inviterName}</strong> has invited you to join their business team on Simply Business.
                </p>

                <div class="invitation-card">
                    <div class="business-name">${data.businessName}</div>
                    <div class="role-badge">${data.role}</div>
                    <div class="inviter-info">
                        Invited by <strong>${data.inviterName}</strong>
                    </div>
                </div>

                <div class="cta-container">
                    <a href="${data.invitationUrl}" class="cta-button">
                        🚀 Accept Invitation & Join Team
                    </a>
                </div>

                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">📊</div>
                        <div class="feature-text">
                            <strong>Track Revenue & Expenses</strong><br>
                            Monitor your business finances in real-time
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">👥</div>
                        <div class="feature-text">
                            <strong>Team Collaboration</strong><br>
                            Work together with your business team
                        </div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">📱</div>
                        <div class="feature-text">
                            <strong>Mobile & Web Access</strong><br>
                            Access your business data anywhere
                        </div>
                    </div>
                </div>

                <div class="links-section">
                    <h3 style="margin-bottom: 16px; color: #2d3748;">Alternative Access Methods:</h3>

                    <div class="link-item">
                        <div class="link-label">🌐 Web Application:</div>
                        <div class="link-url">${data.invitationUrl}</div>
                    </div>

                    <div class="link-item">
                        <div class="link-label">📱 Mobile Deep Link:</div>
                        <div class="link-url">${data.deepLinkUrl}</div>
                    </div>
                </div>

                <div class="expiry-notice">
                    <div class="icon">⏰</div>
                    <div class="expiry-text">
                        This invitation expires on ${expiryDate}
                    </div>
                </div>

                <p style="font-size: 14px; color: #718096; text-align: center; margin-top: 32px;">
                    If you have any questions, please contact ${data.inviterName} or reply to this email.
                </p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="footer-logo">Simply Business</div>
                <div>Professional business management made simple</div>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim();
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, invitationData }: InvitationEmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !invitationData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, invitationData' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate modern email template
    const modernEmailHtml = generateModernEmailTemplate(invitationData);

    console.log('📧 Processing invitation email:')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Business:', invitationData.businessName)
    console.log('Inviter:', invitationData.inviterName)
    console.log('Role:', invitationData.role)
    console.log('Invitation URL:', invitationData.invitationUrl)
    console.log('Deep Link:', invitationData.deepLinkUrl)
    console.log('Expires:', invitationData.expiresAt)

    // Check if any email service is configured
    if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
      console.warn('⚠️ No email service configured. Logging invitation details instead.')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email logged (no service configured)',
          emailDetails: {
            to,
            subject,
            invitationUrl: invitationData.invitationUrl,
            deepLinkUrl: invitationData.deepLinkUrl,
            htmlPreview: modernEmailHtml.substring(0, 200) + '...'
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
        from: 'Simply Business <noreply@mail.meetdigrajkar.ca>',
        to: [to],
        subject: subject,
        html: modernEmailHtml,
        tags: [
          { name: 'category', value: 'team-invitation' },
          { name: 'business', value: invitationData.businessName.replace(/[^a-zA-Z0-9_-]/g, '_') },
          { name: 'environment', value: 'production' },
          { name: 'role', value: invitationData.role }
        ]
      }
      console.log('📧 Sending modern email via Resend to:', to)

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
      console.log('📧 Sending modern email via SendGrid to:', to)

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
            email: 'noreply@mail.meetdigrajkar.ca',
            name: 'Simply Business'
          },
          content: [{
            type: 'text/html',
            value: modernEmailHtml
          }],
          categories: ['team-invitation'],
          custom_args: {
            business_name: invitationData.businessName,
            invitation_role: invitationData.role,
            inviter_name: invitationData.inviterName
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

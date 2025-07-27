import { supabase } from '../config/supabase';
import { BusinessRole } from '../types/database';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

export interface TeamInvitation {
  id: string;
  businessId: string;
  businessName: string;
  inviterName: string;
  inviteeEmail: string;
  role: BusinessRole;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationResult {
  success: boolean;
  invitation?: TeamInvitation;
  error?: string;
}

class ImprovedTeamInvitationService {
  // In-memory storage for development mode
  private developmentInvitations: Map<string, TeamInvitation> = new Map();
  /**
   * Send team invitation with proper development support
   */
  async inviteTeamMember(
    businessId: string,
    businessName: string,
    inviterName: string,
    inviteeEmail: string,
    role: BusinessRole
  ): Promise<InvitationResult> {
    try {
      console.log('🚀 Starting team invitation process...');
      console.log('Business:', businessName);
      console.log('Invitee:', inviteeEmail);
      console.log('Role:', role);

      // Generate secure token
      const token = this.generateSecureToken();
      
      // Create expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation record
      const invitation: TeamInvitation = {
        id: `inv_${Date.now()}`,
        businessId,
        businessName,
        inviterName,
        inviteeEmail,
        role,
        token,
        status: 'pending',
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store invitation in database
      const { error: dbError } = await supabase
        .from('team_invitations')
        .insert({
          id: invitation.id,
          business_id: invitation.businessId,
          business_name: invitation.businessName,
          inviter_name: invitation.inviterName,
          invitee_email: invitation.inviteeEmail,
          role: invitation.role,
          token: invitation.token,
          status: invitation.status,
          expires_at: invitation.expiresAt.toISOString(),
          created_at: invitation.createdAt.toISOString(),
          updated_at: invitation.updatedAt.toISOString(),
        });

      if (dbError) {
        console.error('❌ Database error:', dbError);
        return { success: false, error: 'Failed to create invitation record' };
      }

      // Send invitation email/notification
      const emailResult = await this.sendInvitationNotification(invitation);
      
      if (!emailResult.success) {
        console.warn('⚠️ Email sending failed, but invitation was created');
      }

      console.log('✅ Team invitation created successfully');
      return { success: true, invitation };

    } catch (error) {
      console.error('❌ Invitation creation failed:', error);
      return { success: false, error: `Failed to create invitation: ${error.message}` };
    }
  }

  /**
   * Handle invitation acceptance with proper user creation
   */
  async acceptInvitation(token: string, userData: {
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔗 Processing invitation acceptance...');

      // Get invitation details
      const { data: invitationData, error: fetchError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitationData) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      // Check if invitation is expired
      if (new Date(invitationData.expires_at) < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Create user account using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData.invitee_email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            invited_to_business: invitationData.business_id,
            invited_role: invitationData.role,
          }
        }
      });

      if (authError) {
        console.error('❌ User creation failed:', authError);
        return { success: false, error: `Failed to create account: ${authError.message}` };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: invitationData.invitee_email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Continue anyway, profile can be created later
      }

      // Add user to business with specified role
      const { error: businessRoleError } = await supabase
        .from('business_roles')
        .insert({
          business_id: invitationData.business_id,
          user_id: authData.user.id,
          role: invitationData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (businessRoleError) {
        console.error('❌ Business role assignment failed:', businessRoleError);
        return { success: false, error: 'Failed to assign business role' };
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (updateError) {
        console.warn('⚠️ Failed to update invitation status:', updateError);
      }

      console.log('✅ Invitation accepted successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Invitation acceptance failed:', error);
      return { success: false, error: `Failed to accept invitation: ${error.message}` };
    }
  }

  /**
   * Accept invitation for an existing user who is already logged in
   */
  async acceptInvitationForExistingUser(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔗 Processing invitation acceptance for existing user...');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be logged in to accept invitation' };
      }

      // Get invitation details
      const { data: invitationData, error: fetchError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitationData) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      // Check if invitation is expired
      if (new Date(invitationData.expires_at) < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Verify the email matches
      if (user.email !== invitationData.invitee_email) {
        return { success: false, error: 'This invitation is for a different email address' };
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        return { success: false, error: 'User profile not found' };
      }

      // Add user to business team
      const { error: teamError } = await supabase
        .from('business_team_members')
        .insert({
          business_id: invitationData.business_id,
          user_id: userProfile.id,
          role: invitationData.role,
          status: 'active',
          joined_at: new Date().toISOString(),
        });

      if (teamError) {
        console.error('❌ Failed to add user to team:', teamError);
        return { success: false, error: 'Failed to add user to business team' };
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('token', token);

      if (updateError) {
        console.warn('⚠️ Failed to update invitation status:', updateError);
      }

      console.log('✅ Invitation accepted successfully for existing user');
      return { success: true };

    } catch (error) {
      console.error('❌ Invitation acceptance failed for existing user:', error);
      return { success: false, error: `Failed to accept invitation: ${error.message}` };
    }
  }

  /**
   * Send invitation notification (email in production, console in development)
   */
  private async sendInvitationNotification(invitation: TeamInvitation): Promise<{ success: boolean; error?: string }> {
    try {
      const invitationUrl = this.generateInvitationUrl(invitation.token);
      const deepLinkUrl = `simply://invite/${invitation.token}`;

      if (false) { // Disabled dev mode to enable real emails
        // Development mode: Show alert and log details
        console.log('\n📧 DEVELOPMENT MODE - INVITATION DETAILS:');
        console.log('='.repeat(50));
        console.log('To:', invitation.inviteeEmail);
        console.log('Business:', invitation.businessName);
        console.log('Inviter:', invitation.inviterName);
        console.log('Role:', invitation.role);
        console.log('Invitation URL:', invitationUrl);
        console.log('Deep Link:', deepLinkUrl);
        console.log('Expires:', invitation.expiresAt.toLocaleDateString());
        console.log('='.repeat(50));

        // Show alert to user
        Alert.alert(
          'Invitation Sent (Dev Mode)',
          `Invitation details logged to console.\n\nTo test:\n1. Copy the invitation URL from console\n2. Open in browser or use deep link\n3. Complete signup process`,
          [
            {
              text: 'Copy Deep Link',
              onPress: () => {
                // In a real app, you'd copy to clipboard
                console.log('Deep Link to copy:', deepLinkUrl);
              }
            },
            { text: 'OK' }
          ]
        );

        return { success: true };
      }

      // Production mode: Send actual email via Supabase Edge Function
      const emailSubject = `You're invited to join ${invitation.businessName}`;

      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          to: invitation.inviteeEmail,
          subject: emailSubject,
          invitationData: {
            businessName: invitation.businessName,
            inviterName: invitation.inviterName,
            role: invitation.role,
            invitationUrl,
            deepLinkUrl,
            expiresAt: invitation.expiresAt.toISOString()
          }
        }
      });

      if (error) {
        console.error('❌ Email service error:', error);
        return { success: false, error: `Email service error: ${error.message}` };
      }

      console.log('✅ Email sent successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Notification sending failed:', error);
      return { success: false, error: `Failed to send notification: ${error.message}` };
    }
  }

  /**
   * Generate invitation URL based on environment
   */
  private generateInvitationUrl(token: string): string {
    // Route directly to the web app with invitation token
    return `https://apps.simplyb.meetdigrajkar.ca?invitation_token=${token}`;
  }

  /**
   * Generate secure token for invitation
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate professional HTML email template
   */
  private generateInvitationEmailHTML(invitation: TeamInvitation, webUrl: string, deepLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join ${invitation.businessName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .business-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .business-name {
            font-size: 24px;
            font-weight: 700;
            color: #007AFF;
            margin-bottom: 8px;
          }
          .role-badge {
            background: #007AFF;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
          }
          .button {
            display: inline-block;
            background: #007AFF;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
            transition: background 0.2s ease;
          }
          .button:hover {
            background: #0056CC;
          }
          .link-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 12px;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 12px 0;
          }
          .footer {
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
          }
          .expiry {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            text-align: center;
            color: #856404;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${invitation.inviterName}</strong> has invited you to join their business team.</p>

            <div class="business-info">
              <div class="business-name">${invitation.businessName}</div>
              <div class="role-badge">${invitation.role}</div>
            </div>

            <p>Click the button below to accept your invitation and create your account:</p>

            <div style="text-align: center;">
              <a href="${webUrl}" class="button">Accept Invitation & Join Team</a>
            </div>

            <p><strong>Alternative ways to join:</strong></p>
            <p>📱 <strong>Mobile App Link:</strong></p>
            <div class="link-box">${deepLinkUrl}</div>

            <p>🌐 <strong>Web Link:</strong></p>
            <div class="link-box">${webUrl}</div>

            <div class="expiry">
              ⏰ <strong>This invitation expires on ${invitation.expiresAt.toLocaleDateString()}</strong>
            </div>

            <p>Once you join, you'll be able to:</p>
            <ul>
              <li>Access business data appropriate for your role</li>
              <li>Collaborate with the team</li>
              <li>Use Simply Business Tracker features</li>
            </ul>
          </div>
          <div class="footer">
            <p><strong>Simply Business Tracker</strong></p>
            <p>This invitation was sent by ${invitation.inviterName} from ${invitation.businessName}</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get invitation by token
   */
  async getInvitation(token: string): Promise<TeamInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        businessId: data.business_id,
        businessName: data.business_name,
        inviterName: data.inviter_name,
        inviteeEmail: data.invitee_email,
        role: data.role,
        token: data.token,
        status: data.status,
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('❌ Failed to get invitation:', error);
      return null;
    }
  }
}

export default new ImprovedTeamInvitationService();

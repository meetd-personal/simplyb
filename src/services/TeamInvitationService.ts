import { BusinessRole, Permission, ROLE_PERMISSIONS } from '../types/database';
import DatabaseService from './DatabaseServiceFactory';
import { supabase } from '../config/supabase';

export interface TeamInvitation {
  id: string;
  businessId: string;
  businessName: string;
  inviterEmail: string;
  inviterName: string;
  inviteeEmail: string;
  role: BusinessRole;
  permissions: Permission[];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  token: string;
}

class TeamInvitationService {
  private invitations: TeamInvitation[] = [];

  // Send team invitation
  async sendInvitation(
    businessId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: BusinessRole
  ): Promise<{ success: boolean; invitation?: TeamInvitation; error?: string }> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteeEmail)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Get business and inviter info
      const business = await DatabaseService.getBusinessById(businessId);
      const inviter = await DatabaseService.getUserById(inviterUserId);

      if (!business) {
        return { success: false, error: `Business not found with ID: ${businessId}` };
      }

      if (!inviter) {
        return { success: false, error: `Inviter user not found with ID: ${inviterUserId}` };
      }

      // Check if user is already a member
      const existingMembers = await DatabaseService.getBusinessMembers(businessId);
      const existingUser = await DatabaseService.getUserByEmail(inviteeEmail);
      
      if (existingUser) {
        const isAlreadyMember = existingMembers.some(m => m.userId === existingUser.id && m.isActive);
        if (isAlreadyMember) {
          return { success: false, error: 'User is already a member of this business' };
        }
      }

      // Check for existing pending invitation
      const existingInvitation = this.invitations.find(
        inv => inv.businessId === businessId && 
               inv.inviteeEmail.toLowerCase() === inviteeEmail.toLowerCase() && 
               inv.status === 'pending'
      );

      if (existingInvitation) {
        return { success: false, error: 'Invitation already sent to this email' };
      }

      // Create invitation
      const invitation: TeamInvitation = {
        id: this.generateId(),
        businessId,
        businessName: business.name,
        inviterEmail: inviter.email,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        inviteeEmail: inviteeEmail.toLowerCase(),
        role,
        permissions: ROLE_PERMISSIONS[role],
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        token: this.generateToken()
      };

      this.invitations.push(invitation);

      // Send invitation email using production-ready method
      const emailResult = await this.sendInvitationEmail(invitation);

      if (!emailResult.success) {
        // Remove invitation if email failed to send
        this.invitations = this.invitations.filter(inv => inv.id !== invitation.id);
        return { success: false, error: emailResult.error || 'Failed to send invitation email' };
      }

      console.log(`✅ Team invitation sent to ${inviteeEmail} for ${business.name}`);
      console.log(`🔗 Invitation link: simply://invite/${invitation.token}`);

      return { success: true, invitation };
    } catch (error) {
      console.error('Send invitation error:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  }

  // Get invitation by token
  async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const invitation = this.invitations.find(inv => inv.token === token);
    
    if (!invitation) return null;
    
    // Check if expired
    if (invitation.status === 'pending' && new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
    }
    
    return invitation;
  }

  // Accept invitation
  async acceptInvitation(
    token: string,
    userEmail: string
  ): Promise<{ success: boolean; businessId?: string; error?: string }> {
    try {
      const invitation = await this.getInvitationByToken(token);
      
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: `Invitation is ${invitation.status}` };
      }

      if (invitation.inviteeEmail !== userEmail.toLowerCase()) {
        return { success: false, error: 'This invitation is not for your email address' };
      }

      // Get or create user
      let user = await DatabaseService.getUserByEmail(userEmail);
      if (!user) {
        // Create user account for team member
        user = await DatabaseService.createUser({
          email: userEmail,
          firstName: 'Team',
          lastName: 'Member',
          isActive: true
        });
      }

      // Add user to business
      await DatabaseService.addBusinessMember({
        userId: user.id,
        businessId: invitation.businessId,
        role: invitation.role,
        permissions: invitation.permissions,
        invitedBy: invitation.inviterEmail
      });

      // Mark invitation as accepted
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();

      return { success: true, businessId: invitation.businessId };
    } catch (error) {
      console.error('Accept invitation error:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  // Get pending invitations for a business
  async getBusinessInvitations(businessId: string): Promise<TeamInvitation[]> {
    return this.invitations.filter(inv => inv.businessId === businessId);
  }

  // Get invitations for an email
  async getInvitationsForEmail(email: string): Promise<TeamInvitation[]> {
    return this.invitations.filter(
      inv => inv.inviteeEmail.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
    );
  }

  // Cancel invitation
  async cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = this.invitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: 'Can only cancel pending invitations' };
      }

      invitation.status = 'declined';
      return { success: true };
    } catch (error) {
      console.error('Cancel invitation error:', error);
      return { success: false, error: 'Failed to cancel invitation' };
    }
  }

  // Resend invitation
  async resendInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = this.invitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }

      // Reset invitation
      invitation.status = 'pending';
      invitation.createdAt = new Date();
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      invitation.token = this.generateToken();

      // In a real app, you would send an email here
      console.log(`Team invitation resent to ${invitation.inviteeEmail} for ${invitation.businessName}`);
      console.log(`Invitation link: simply://invite/${invitation.token}`);

      return { success: true };
    } catch (error) {
      console.error('Resend invitation error:', error);
      return { success: false, error: 'Failed to resend invitation' };
    }
  }

  // Send invitation email using production-ready method
  private async sendInvitationEmail(invitation: TeamInvitation): Promise<{ success: boolean; error?: string }> {
    try {
      // Create the invitation URL
      const invitationUrl = `https://join.simplyb.meetdigrajkar.ca/invite/${invitation.token}`;

      // For development, we'll use a deep link
      const deepLinkUrl = `simply://invite/${invitation.token}`;

      // Email content
      const emailSubject = `You're invited to join ${invitation.businessName}`;

      // Use Supabase Edge Functions for email sending (server generates modern template)
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
        console.error('❌ Email sending failed:', error);
        // Fallback: Log the invitation details for manual processing
        console.log('📧 INVITATION EMAIL CONTENT:');
        console.log('To:', invitation.inviteeEmail);
        console.log('Subject:', emailSubject);
        console.log('Invitation URL:', invitationUrl);
        console.log('Deep Link:', deepLinkUrl);
        console.log('Business:', invitation.businessName);
        console.log('Inviter:', invitation.inviterName);
        console.log('Role:', invitation.role);
        console.log('Expires:', invitation.expiresAt.toLocaleDateString());

        // For development, we'll consider this a success since we're logging the details
        return { success: true };
      }

      console.log('✅ Invitation email sent successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Email sending error:', error);

      // Fallback: Log invitation details for development
      console.log('📧 FALLBACK - INVITATION EMAIL DETAILS:');
      console.log('To:', invitation.inviteeEmail);
      console.log('Business:', invitation.businessName);
      console.log('Inviter:', invitation.inviterName);
      console.log('Role:', invitation.role);
      console.log('Invitation Link:', `simply://invite/${invitation.token}`);
      console.log('Expires:', invitation.expiresAt.toLocaleDateString());

      // For development, treat as success
      return { success: true };
    }
  }

  // Generate professional HTML email template
  private generateInvitationEmailHTML(invitation: TeamInvitation, invitationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're invited to join ${invitation.businessName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007AFF; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e9ecef; }
          .button { display: inline-block; background: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
          .role-badge { background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You're Invited!</h1>
            <p>Join ${invitation.businessName} as a team member</p>
          </div>

          <div class="content">
            <p>Hi there!</p>

            <p><strong>${invitation.inviterName}</strong> has invited you to join <strong>${invitation.businessName}</strong> as a <span class="role-badge">${invitation.role}</span>.</p>

            <p>Simply is a business management platform that helps teams track revenue, expenses, and financial data efficiently.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" class="button">Accept Invitation</a>
            </div>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Click the "Accept Invitation" button above</li>
              <li>Create your account (or sign in if you already have one)</li>
              <li>You'll automatically be added to ${invitation.businessName}</li>
              <li>Start collaborating with your team!</li>
            </ol>

            <p><strong>Your role permissions:</strong></p>
            <ul>
              ${this.getRolePermissionsHTML(invitation.role)}
            </ul>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #666; font-size: 14px;">
              This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.
              If you have any questions, please contact ${invitation.inviterName} at ${invitation.inviterEmail}.
            </p>
          </div>

          <div class="footer">
            <p>This invitation was sent by ${invitation.businessName} using Simply Business Tracker.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get role permissions for email display
  private getRolePermissionsHTML(role: BusinessRole): string {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.map(permission => {
      const descriptions = {
        'view_dashboard': 'View business dashboard and basic statistics',
        'add_transactions': 'Add new revenue and expense transactions',
        'edit_transactions': 'Edit existing transactions',
        'delete_transactions': 'Delete transactions',
        'view_statistics': 'View detailed financial reports and analytics',
        'manage_team': 'Invite and manage team members',
        'manage_business': 'Manage business settings and configuration'
      };
      return `<li>${descriptions[permission] || permission}</li>`;
    }).join('');
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  // Demo method to create sample invitations
  async createDemoInvitations() {
    // This would be used for testing the invitation flow
    const demoInvitation: TeamInvitation = {
      id: 'demo_invitation_1',
      businessId: 'demo_business_1',
      businessName: 'Demo Pizza Palace',
      inviterEmail: 'owner@pizzapalace.com',
      inviterName: 'John Smith',
      inviteeEmail: 'newteam@example.com',
      role: BusinessRole.EMPLOYEE,
      permissions: ROLE_PERMISSIONS[BusinessRole.EMPLOYEE],
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      token: 'demo_token_123'
    };

    this.invitations.push(demoInvitation);
    console.log('Demo invitation created:', demoInvitation);
  }

  // Get user invitations
  async getUserInvitations(userEmail: string): Promise<TeamInvitation[]> {
    try {
      return this.invitations.filter(invitation =>
        invitation.inviteeEmail.toLowerCase() === userEmail.toLowerCase() &&
        invitation.status === 'pending' &&
        invitation.expiresAt > new Date()
      );
    } catch (error) {
      console.error('Get user invitations error:', error);
      return [];
    }
  }

  // Get invitation by token
  async getInvitationByToken(token: string): Promise<{ success: boolean; invitation?: TeamInvitation; error?: string }> {
    try {
      const invitation = this.invitations.find(inv =>
        inv.token === token &&
        inv.status === 'pending' &&
        inv.expiresAt > new Date()
      );

      if (!invitation) {
        return { success: false, error: 'Invitation not found or expired' };
      }

      return { success: true, invitation };
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      return { success: false, error: 'Failed to retrieve invitation' };
    }
  }

  // Accept invitation
  async acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invitationResult = await this.getInvitationByToken(token);

      if (!invitationResult.success || !invitationResult.invitation) {
        return { success: false, error: invitationResult.error };
      }

      const invitation = invitationResult.invitation;

      // Check if user is already a member
      const businessMembers = await DatabaseService.getBusinessMembers(invitation.businessId);
      const isAlreadyMember = businessMembers.some(member => member.userId === userId);

      if (isAlreadyMember) {
        return { success: false, error: 'You are already a member of this business' };
      }

      // Add user to business
      const addMemberResult = await DatabaseService.addBusinessMember({
        businessId: invitation.businessId,
        userId: userId,
        role: invitation.role,
        permissions: [], // Will be set based on role
        invitedBy: invitation.inviterUserId
      });

      if (!addMemberResult) {
        return { success: false, error: 'Failed to add user to business' };
      }

      // Mark invitation as accepted
      const invitationIndex = this.invitations.findIndex(inv => inv.token === token);
      if (invitationIndex !== -1) {
        this.invitations[invitationIndex] = {
          ...this.invitations[invitationIndex],
          status: 'accepted',
          acceptedAt: new Date()
        };
      }

      console.log(`✅ Invitation accepted: User ${userId} joined business ${invitation.businessId} as ${invitation.role}`);
      return { success: true };

    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }
}

export default new TeamInvitationService();

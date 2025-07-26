import { BusinessRole, Permission, ROLE_PERMISSIONS } from '../types/database';
import DatabaseService from './DatabaseService';

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
      // Get business and inviter info
      const business = await DatabaseService.getBusinessById(businessId);
      const inviter = await DatabaseService.getUserById(inviterUserId);
      
      if (!business || !inviter) {
        return { success: false, error: 'Business or inviter not found' };
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

      // In a real app, you would send an email here
      console.log(`Team invitation sent to ${inviteeEmail} for ${business.name}`);
      console.log(`Invitation link: simply://invite/${invitation.token}`);

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
}

export default new TeamInvitationService();

import { supabase } from '../config/supabase';
import {
  User,
  Business,
  BusinessMember,
  Transaction,
  BusinessType,
  BusinessRole,
  TransactionType
} from '../types/database';

class SupabaseDatabaseService {
  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User> {
    try {
      console.log('👤 Creating user:', userData.email);

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          profile_image: userData.profileImage || null,
          is_active: userData.isActive
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Create user error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create user: ${error.message}`);
      }

      console.log('✅ User created successfully:', data.email);
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.error('❌ Network error in createUser:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      console.log('🔍 Getting user by email:', email);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log('👤 User not found:', email);
          return null;
        }
        console.error('❌ Get user by email error:', error);
        throw new Error(`Failed to get user: ${error.message}`);
      }

      console.log('✅ User found:', data.email);
      return this.mapSupabaseUserToUser(data);
    } catch (error) {
      console.error('❌ Network error in getUserByEmail:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    console.log('🔍 SupabaseDB: Looking up user by ID:', id);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ SupabaseDB: User not found with ID:', id);
        return null;
      }
      console.error('❌ SupabaseDB: Get user by ID error:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }

    console.log('✅ SupabaseDB: User found:', data.email, 'ID:', data.id);
    return this.mapSupabaseUserToUser(data);
  }

  // Business Management
  async createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        name: businessData.name,
        type: businessData.type,
        description: businessData.description,
        address: businessData.address,
        phone: businessData.phone,
        email: businessData.email,
        website: businessData.website,
        timezone: businessData.timezone,
        currency: businessData.currency,
        is_active: businessData.isActive,
        owner_id: businessData.ownerId
      })
      .select()
      .single();

    if (error) {
      console.error('Create business error:', error);
      throw new Error(`Failed to create business: ${error.message}`);
    }

    // Add owner as business member
    await this.addBusinessMember({
      userId: businessData.ownerId,
      businessId: data.id,
      role: BusinessRole.OWNER,
      permissions: [],
      invitedBy: null
    });

    return this.mapSupabaseBusinessToBusiness(data);
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const { data, error } = await supabase
      .from('business_members')
      .select(`
        business_id,
        businesses (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Get user businesses error:', error);
      throw new Error(`Failed to get user businesses: ${error.message}`);
    }

    return data
      .filter(item => item.businesses)
      .map(item => this.mapSupabaseBusinessToBusiness(item.businesses));
  }

  async getUserBusinessRelationships(userId: string): Promise<{
    ownedBusinesses: Business[];
    memberBusinesses: Business[];
    allBusinesses: Business[];
  }> {
    const { data, error } = await supabase
      .from('business_members')
      .select(`
        business_id,
        role,
        businesses (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Get user business relationships error:', error);
      throw new Error(`Failed to get user business relationships: ${error.message}`);
    }

    const allBusinesses = data
      .filter(item => item.businesses)
      .map(item => this.mapSupabaseBusinessToBusiness(item.businesses));

    const ownedBusinesses = data
      .filter(item => item.businesses && item.role === 'OWNER')
      .map(item => this.mapSupabaseBusinessToBusiness(item.businesses));

    const memberBusinesses = data
      .filter(item => item.businesses && item.role !== 'OWNER')
      .map(item => this.mapSupabaseBusinessToBusiness(item.businesses));

    return {
      ownedBusinesses,
      memberBusinesses,
      allBusinesses
    };
  }

  async getBusinessById(id: string): Promise<Business | null> {
    console.log('🔍 SupabaseDB: Looking up business by ID:', id);

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ SupabaseDB: Business not found with ID:', id);
        return null;
      }
      console.error('❌ SupabaseDB: Get business by ID error:', error);
      throw new Error(`Failed to get business: ${error.message}`);
    }

    console.log('✅ SupabaseDB: Business found:', data.name, 'ID:', data.id);
    return this.mapSupabaseBusinessToBusiness(data);
  }

  async deleteBusiness(businessId: string, ownerId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting business:', businessId);

      // First verify the user is the owner
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .eq('is_active', true)
        .single();

      if (businessError || !business) {
        throw new Error('Business not found or already deleted');
      }

      if (business.owner_id !== ownerId) {
        throw new Error('Only the business owner can delete the business');
      }

      // Soft delete the business (set is_active to false)
      const { error: deleteError } = await supabase
        .from('businesses')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', businessId);

      if (deleteError) {
        console.error('❌ Delete business error:', deleteError);
        throw new Error(`Failed to delete business: ${deleteError.message}`);
      }

      // Deactivate all business members
      const { error: membersError } = await supabase
        .from('business_members')
        .update({ is_active: false })
        .eq('business_id', businessId);

      if (membersError) {
        console.error('❌ Deactivate members error:', membersError);
        // Don't throw here, business deletion is more important
      }

      console.log('✅ Business deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Delete business error:', error);
      throw error;
    }
  }

  // Clean up orphaned user records (for development)
  async cleanupOrphanedUser(email: string): Promise<boolean> {
    try {
      console.log('🧹 Cleaning up orphaned user:', email);

      // Delete from users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', email);

      if (error) {
        console.error('❌ Cleanup user error:', error);
        throw new Error(`Failed to cleanup user: ${error.message}`);
      }

      console.log('✅ User cleaned up successfully');
      return true;
    } catch (error) {
      console.error('❌ Cleanup user error:', error);
      throw error;
    }
  }

  // Business Member Management
  async addBusinessMember(memberData: Omit<BusinessMember, 'id' | 'joinedAt'>): Promise<BusinessMember> {
    const { data, error } = await supabase
      .from('business_members')
      .insert({
        user_id: memberData.userId,
        business_id: memberData.businessId,
        role: memberData.role,
        permissions: memberData.permissions,
        invited_by: memberData.invitedBy,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Add business member error:', error);
      throw new Error(`Failed to add business member: ${error.message}`);
    }

    return this.mapSupabaseBusinessMemberToBusinessMember(data);
  }

  async getUserBusinessMemberships(userId: string): Promise<BusinessMember[]> {
    const { data, error } = await supabase
      .from('business_members')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Get user business memberships error:', error);
      throw new Error(`Failed to get user memberships: ${error.message}`);
    }

    return data.map(item => this.mapSupabaseBusinessMemberToBusinessMember(item));
  }

  async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    const { data, error } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) {
      console.error('Get business members error:', error);
      throw new Error(`Failed to get business members: ${error.message}`);
    }

    return data.map(item => this.mapSupabaseBusinessMemberToBusinessMember(item));
  }

  // Transaction Management
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        business_id: transactionData.businessId,
        user_id: transactionData.userId,
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        date: transactionData.date.toISOString().split('T')[0], // Convert to date string
        receipt_uri: transactionData.receiptUri,
        metadata: transactionData.metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Create transaction error:', error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return this.mapSupabaseTransactionToTransaction(data);
  }

  async getBusinessTransactions(businessId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Get business transactions error:', error);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }

    return data.map(item => this.mapSupabaseTransactionToTransaction(item));
  }

  // Authentication helpers
  async signUp(email: string, password: string, userData: { firstName: string; lastName: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        }
      }
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Mapping functions to convert Supabase data to app types
  private mapSupabaseUserToUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      profileImage: data.profile_image,
      createdAt: new Date(data.created_at),
      lastLoginAt: new Date(data.last_login_at),
      isActive: data.is_active
    };
  }

  private mapSupabaseBusinessToBusiness(data: any): Business {
    return {
      id: data.id,
      name: data.name,
      type: data.type as BusinessType,
      description: data.description,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      timezone: data.timezone,
      currency: data.currency,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isActive: data.is_active,
      ownerId: data.owner_id
    };
  }

  private mapSupabaseBusinessMemberToBusinessMember(data: any): BusinessMember {
    return {
      id: data.id,
      userId: data.user_id,
      businessId: data.business_id,
      role: data.role as BusinessRole,
      permissions: data.permissions || [],
      joinedAt: new Date(data.joined_at),
      invitedBy: data.invited_by,
      isActive: data.is_active
    };
  }

  private mapSupabaseTransactionToTransaction(data: any): Transaction {
    return {
      id: data.id,
      businessId: data.business_id,
      userId: data.user_id,
      type: data.type as TransactionType,
      amount: parseFloat(data.amount),
      description: data.description,
      category: data.category,
      date: new Date(data.date),
      receiptUri: data.receipt_uri,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  // Additional methods needed by the app
  async setCurrentBusiness(business: Business): Promise<void> {
    // In a real app, you might store this in user preferences or session
    // For now, we'll just log it
    console.log('Setting current business:', business.name);
  }

  async getCurrentBusiness(): Promise<Business | null> {
    // This would typically come from user session or preferences
    return null;
  }

  async getUserPermissions(userId: string, businessId: string): Promise<any[]> {
    const memberships = await this.getUserBusinessMemberships(userId);
    const membership = memberships.find(m => m.businessId === businessId && m.isActive);
    return membership?.permissions || [];
  }

  async clearCurrentSession(): Promise<void> {
    // Clear any session data
    console.log('Clearing current session');
  }
}

export default new SupabaseDatabaseService();

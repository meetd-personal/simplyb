import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Business,
  BusinessMember,
  Transaction,
  DeliveryIntegration,
  SyncLog,
  BusinessType,
  BusinessRole,
  Permission,
  TransactionType,
  DeliveryPlatform,
  SyncStatus,
  DEFAULT_BUSINESS_SETTINGS,
  ROLE_PERMISSIONS
} from '../types/database';

// Storage keys
const STORAGE_KEYS = {
  USERS: '@simply_users',
  BUSINESSES: '@simply_businesses',
  BUSINESS_MEMBERS: '@simply_business_members',
  TRANSACTIONS: '@simply_transactions',
  DELIVERY_INTEGRATIONS: '@simply_delivery_integrations',
  SYNC_LOGS: '@simply_sync_logs',
  CURRENT_USER: '@simply_current_user',
  CURRENT_BUSINESS: '@simply_current_business'
};

class DatabaseService {
  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true
    };

    const users = await this.getUsers();
    users.push(user);
    await this.saveUsers(users);
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await this.getUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) return null;
    
    users[userIndex] = { ...users[userIndex], ...updates };
    await this.saveUsers(users);
    
    return users[userIndex];
  }

  // Business Management
  async createBusiness(businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'settings'> & { ownerId: string }): Promise<Business> {
    const business: Business = {
      ...businessData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      settings: {
        ...DEFAULT_BUSINESS_SETTINGS[businessData.type],
        revenueCategories: DEFAULT_BUSINESS_SETTINGS[businessData.type]?.revenueCategories || [],
        notifications: DEFAULT_BUSINESS_SETTINGS[businessData.type]?.notifications || {
          emailNotifications: true,
          pushNotifications: true,
          syncFailureAlerts: true,
          dailySummary: false,
          weeklyReport: false,
          monthlyReport: false
        },
        integrations: DEFAULT_BUSINESS_SETTINGS[businessData.type]?.integrations || { deliveryPlatforms: {} }
      }
    };

    // Save business
    const businesses = await this.getBusinesses();
    businesses.push(business);
    await this.saveBusinesses(businesses);

    // Create owner membership
    await this.addBusinessMember({
      userId: businessData.ownerId,
      businessId: business.id,
      role: BusinessRole.OWNER,
      permissions: ROLE_PERMISSIONS[BusinessRole.OWNER]
    });

    return business;
  }

  async getBusinessById(id: string): Promise<Business | null> {
    const businesses = await this.getBusinesses();
    return businesses.find(business => business.id === id) || null;
  }

  async getUserBusinesses(userId: string): Promise<Business[]> {
    const memberships = await this.getUserBusinessMemberships(userId);
    const businesses = await this.getBusinesses();

    const userBusinessIds = memberships.map(m => m.businessId);
    return businesses.filter(business => userBusinessIds.includes(business.id) && business.isActive);
  }

  async getUserBusinessRelationships(userId: string): Promise<{
    ownedBusinesses: Business[];
    memberBusinesses: Business[];
    allBusinesses: Business[];
  }> {
    const memberships = await this.getUserBusinessMemberships(userId);
    const businesses = await this.getBusinesses();

    const allBusinesses = businesses.filter(business =>
      memberships.some(m => m.businessId === business.id) && business.isActive
    );

    const ownedBusinesses = businesses.filter(business =>
      memberships.some(m => m.businessId === business.id && m.role === BusinessRole.OWNER) && business.isActive
    );

    const memberBusinesses = businesses.filter(business =>
      memberships.some(m => m.businessId === business.id && m.role !== BusinessRole.OWNER) && business.isActive
    );

    return {
      ownedBusinesses,
      memberBusinesses,
      allBusinesses
    };
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business | null> {
    const businesses = await this.getBusinesses();
    const businessIndex = businesses.findIndex(business => business.id === id);

    if (businessIndex === -1) return null;

    businesses[businessIndex] = {
      ...businesses[businessIndex],
      ...updates,
      updatedAt: new Date()
    };
    await this.saveBusinesses(businesses);

    return businesses[businessIndex];
  }

  async deleteBusiness(businessId: string, ownerId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting business:', businessId);

      const businesses = await this.getBusinesses();
      const business = businesses.find(b => b.id === businessId && b.isActive);

      if (!business) {
        throw new Error('Business not found or already deleted');
      }

      if (business.ownerId !== ownerId) {
        throw new Error('Only the business owner can delete the business');
      }

      // Soft delete the business (set isActive to false)
      const updatedBusinesses = businesses.map(b =>
        b.id === businessId
          ? { ...b, isActive: false, updatedAt: new Date() }
          : b
      );
      await this.saveBusinesses(updatedBusinesses);

      // Deactivate all business members
      const members = await this.getBusinessMembers();
      const updatedMembers = members.map(m =>
        m.businessId === businessId
          ? { ...m, isActive: false }
          : m
      );
      await this.saveBusinessMembers(updatedMembers);

      console.log('✅ Business deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Delete business error:', error);
      throw error;
    }
  }

  // Business Member Management
  async addBusinessMember(memberData: Omit<BusinessMember, 'id' | 'joinedAt' | 'isActive' | 'inviteAcceptedAt'>): Promise<BusinessMember> {
    const member: BusinessMember = {
      ...memberData,
      id: this.generateId(),
      joinedAt: new Date(),
      isActive: true,
      inviteAcceptedAt: new Date()
    };

    const members = await this.getBusinessMembers();
    members.push(member);
    await this.saveBusinessMembers(members);
    
    return member;
  }

  async getUserBusinessMemberships(userId: string): Promise<BusinessMember[]> {
    const members = await this.getBusinessMembers();
    return members.filter(member => member.userId === userId && member.isActive);
  }

  async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    const members = await this.getBusinessMembers();
    return members.filter(member => member.businessId === businessId && member.isActive);
  }

  async getUserPermissions(userId: string, businessId: string): Promise<Permission[]> {
    const members = await this.getBusinessMembers();
    const membership = members.find(m => m.userId === userId && m.businessId === businessId && m.isActive);
    return membership?.permissions || [];
  }

  async hasPermission(userId: string, businessId: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, businessId);
    return permissions.includes(permission);
  }

  // Transaction Management
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transaction: Transaction = {
      ...transactionData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const transactions = await this.getTransactions();
    transactions.push(transaction);
    await this.saveTransactions(transactions);
    
    return transaction;
  }

  async getBusinessTransactions(businessId: string, filters?: {
    type?: TransactionType;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<Transaction[]> {
    const transactions = await this.getTransactions();
    let filtered = transactions.filter(t => t.businessId === businessId);

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      if (filters.category) {
        filtered = filtered.filter(t => t.category === filters.category);
      }
      if (filters.startDate) {
        filtered = filtered.filter(t => new Date(t.date) >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(t => new Date(t.date) <= filters.endDate!);
      }
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const transactions = await this.getTransactions();
    const transactionIndex = transactions.findIndex(t => t.id === id);
    
    if (transactionIndex === -1) return null;
    
    transactions[transactionIndex] = { 
      ...transactions[transactionIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    await this.saveTransactions(transactions);
    
    return transactions[transactionIndex];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const transactions = await this.getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) return false;
    
    await this.saveTransactions(filteredTransactions);
    return true;
  }

  // Current User/Business Management
  async setCurrentUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  async setCurrentBusiness(business: Business): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_BUSINESS, JSON.stringify(business));
  }

  async getCurrentBusiness(): Promise<Business | null> {
    try {
      const businessData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_BUSINESS);
      return businessData ? JSON.parse(businessData) : null;
    } catch (error) {
      return null;
    }
  }

  async clearCurrentSession(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_BUSINESS);
  }

  // Private helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async getUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveUsers(users: User[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  private async getBusinesses(): Promise<Business[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESSES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveBusinesses(businesses: Business[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(businesses));
  }

  private async getBusinessMembers(): Promise<BusinessMember[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveBusinessMembers(members: BusinessMember[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BUSINESS_MEMBERS, JSON.stringify(members));
  }

  private async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  // Delivery Integration Management
  async createDeliveryIntegration(integrationData: Omit<DeliveryIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeliveryIntegration> {
    const integration: DeliveryIntegration = {
      ...integrationData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const integrations = await this.getDeliveryIntegrations();
    integrations.push(integration);
    await this.saveDeliveryIntegrations(integrations);

    return integration;
  }

  async getBusinessDeliveryIntegrations(businessId: string): Promise<DeliveryIntegration[]> {
    const integrations = await this.getDeliveryIntegrations();
    return integrations.filter(i => i.businessId === businessId);
  }

  async updateDeliveryIntegration(id: string, updates: Partial<DeliveryIntegration>): Promise<DeliveryIntegration | null> {
    const integrations = await this.getDeliveryIntegrations();
    const integrationIndex = integrations.findIndex(i => i.id === id);

    if (integrationIndex === -1) return null;

    integrations[integrationIndex] = {
      ...integrations[integrationIndex],
      ...updates,
      updatedAt: new Date()
    };
    await this.saveDeliveryIntegrations(integrations);

    return integrations[integrationIndex];
  }

  private async getDeliveryIntegrations(): Promise<DeliveryIntegration[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DELIVERY_INTEGRATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  private async saveDeliveryIntegrations(integrations: DeliveryIntegration[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DELIVERY_INTEGRATIONS, JSON.stringify(integrations));
  }
}

export default new DatabaseService();

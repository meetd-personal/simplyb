import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/database';

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  businesses?: any[];
  error?: string;
  message?: string;
}

class MockAuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  // Mock users database
  private mockUsers: { [email: string]: { user: User; password: string } } = {
    'demo@simply.com': {
      password: 'password123',
      user: {
        id: 'mock-user-1',
        email: 'demo@simply.com',
        firstName: 'Demo',
        lastName: 'User',
        phone: null,
        profileImage: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true
      }
    },
    'owner@business.com': {
      password: 'password123',
      user: {
        id: 'mock-user-2',
        email: 'owner@business.com',
        firstName: 'Business',
        lastName: 'Owner',
        phone: null,
        profileImage: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true
      }
    }
  };

  // Mock businesses
  private mockBusinesses = [
    {
      id: 'mock-business-1',
      name: 'Demo Restaurant',
      type: 'RESTAURANT',
      description: 'A demo restaurant for testing',
      address: '123 Demo Street',
      phone: '555-0123',
      email: 'demo@restaurant.com',
      website: 'https://demo-restaurant.com',
      timezone: 'America/Toronto',
      currency: 'CAD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      ownerId: 'mock-user-1'
    }
  ];

  // Sign up with email and password
  async signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    businessName?: string;
  }): Promise<AuthResult> {
    try {
      console.log('🧪 MockAuthService: Signup attempt for', userData.email);

      // Check if email already exists
      if (this.mockUsers[userData.email]) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create new user
      const newUser: User = {
        id: `mock-user-${Date.now()}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: null,
        profileImage: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isActive: true
      };

      // Store in mock database
      this.mockUsers[userData.email] = {
        password: userData.password,
        user: newUser
      };

      // Create business if provided
      let businesses = [];
      if (userData.businessName) {
        const newBusiness = {
          id: `mock-business-${Date.now()}`,
          name: userData.businessName,
          type: 'RESTAURANT',
          description: `${userData.businessName} - Created during signup`,
          address: null,
          phone: null,
          email: userData.email,
          website: null,
          timezone: 'America/Toronto',
          currency: 'CAD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          ownerId: newUser.id
        };
        businesses = [newBusiness];
      }

      // Generate token
      const token = `mock_token_${newUser.id}_${Date.now()}`;

      // Store auth data
      this.currentUser = newUser;
      this.authToken = token;

      console.log('✅ MockAuthService: Signup successful for', userData.email);

      return {
        success: true,
        user: newUser,
        token,
        businesses,
        message: 'Account created successfully! (Using mock authentication)'
      };
    } catch (error) {
      console.error('❌ MockAuthService: Signup error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  // Sign in with email and password
  async login(credentials: { email: string; password: string }): Promise<AuthResult> {
    try {
      console.log('🧪 MockAuthService: Login attempt for', credentials.email);

      const cleanEmail = credentials.email.trim().toLowerCase();
      const mockUserData = this.mockUsers[cleanEmail];

      if (!mockUserData) {
        return { 
          success: false, 
          error: 'Invalid email or password. Try demo@simply.com with password123' 
        };
      }

      if (mockUserData.password !== credentials.password) {
        return { 
          success: false, 
          error: 'Invalid email or password. Try demo@simply.com with password123' 
        };
      }

      // Update last login
      mockUserData.user.lastLoginAt = new Date().toISOString();

      // Generate token
      const token = `mock_token_${mockUserData.user.id}_${Date.now()}`;

      // Store auth data
      this.currentUser = mockUserData.user;
      this.authToken = token;

      console.log('✅ MockAuthService: Login successful for', credentials.email);

      return {
        success: true,
        user: mockUserData.user,
        token,
        businesses: this.mockBusinesses,
        message: 'Login successful! (Using mock authentication)'
      };
    } catch (error) {
      console.error('❌ MockAuthService: Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    return !!this.mockUsers[email.trim().toLowerCase()];
  }

  // Sign out
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      this.currentUser = null;
      this.authToken = null;
      console.log('✅ MockAuthService: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ MockAuthService: Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.authToken;
  }

  // Initialize auth state
  async initializeAuth(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    businesses: any[];
    currentBusiness: any | null;
    needsBusinessSelection: boolean;
  }> {
    try {
      // For mock service, return empty state
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        businesses: [],
        currentBusiness: null,
        needsBusinessSelection: false,
      };
    } catch (error) {
      console.error('❌ MockAuthService: Initialize error:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        businesses: [],
        currentBusiness: null,
        needsBusinessSelection: false,
      };
    }
  }
}

export default new MockAuthService();

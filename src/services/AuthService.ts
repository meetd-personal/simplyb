import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, SignupData, AuthState } from '../types';
import { User as DBUser, Business, BusinessType, BusinessRole } from '../types/database';
import DatabaseService from './DatabaseService';
import DemoDataService from './DemoDataService';

const AUTH_TOKEN_KEY = '@simply_auth_token';
const USER_DATA_KEY = '@simply_user_data';

// Mock user database - In a real app, this would be a backend API
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'owner@business.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
    isActive: true,
  },
  {
    id: '2',
    email: 'team@business.com',
    firstName: 'Jane',
    lastName: 'Smith',
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date(),
    isActive: true,
  },
];

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

  // Initialize auth state from storage
  async initializeAuth(): Promise<AuthState> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      
      if (token && userData) {
        const user = JSON.parse(userData);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.lastLoginAt = new Date(user.lastLoginAt);
        
        this.authToken = token;
        this.currentUser = user;
        
        // Get user's businesses if authenticated
        const businessRelationships = user.id ? await DatabaseService.getUserBusinessRelationships(user.id) : null;
        const businesses = businessRelationships ? businessRelationships.allBusinesses : [];
        const currentBusiness = await DatabaseService.getCurrentBusiness();

        return {
          isAuthenticated: true,
          user,
          token,
          businesses,
          currentBusiness,
          needsBusinessSelection: false,
        };
      }

      return {
        isAuthenticated: false,
        user: null,
        token: null,
        businesses: [],
        currentBusiness: null,
        needsBusinessSelection: false,
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
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

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; token?: string; businesses?: Business[]; error?: string }> {
    try {
      // Check database first
      const dbUser = await DatabaseService.getUserByEmail(credentials.email);

      if (dbUser) {
        // For demo purposes, accept any password for existing users
        // In production, you'd verify the hashed password
        if (credentials.password.length < 6) {
          return { success: false, error: 'Invalid password' };
        }

        const token = this.generateToken();

        // Convert DB user to app user format
        const user: User = {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          createdAt: dbUser.createdAt,
          lastLoginAt: new Date(),
          isActive: dbUser.isActive
        };

        // Get user's businesses
        const businessRelationships = await DatabaseService.getUserBusinessRelationships(dbUser.id);
        const businesses = businessRelationships.allBusinesses;

        // Store auth data
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        await DatabaseService.setCurrentUser(dbUser);

        this.currentUser = user;
        this.authToken = token;

        return { success: true, user, token, businesses };
      }

      // Fallback to mock users for demo
      const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

      if (!mockUser) {
        return { success: false, error: 'User not found' };
      }

      // In a real app, you'd verify the password hash
      // For demo purposes, any password works
      if (credentials.password.length < 6) {
        return { success: false, error: 'Invalid password' };
      }

      // Update last login
      mockUser.lastLoginAt = new Date();

      // Generate mock token
      const token = `token_${mockUser.id}_${Date.now()}`;

      // Store auth data
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(mockUser));

      this.currentUser = mockUser;
      this.authToken = token;

      return { success: true, user: mockUser, token, businesses: [] };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  // Signup new user
  async signup(signupData: SignupData): Promise<{ success: boolean; user?: User; token?: string; business?: Business; error?: string }> {
    try {
      // Check if user already exists in database
      const existingUser = await DatabaseService.getUserByEmail(signupData.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Validate password
      if (signupData.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Create new user in database
      const dbUser = await DatabaseService.createUser({
        email: signupData.email.toLowerCase(),
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        isActive: true
      });

      // Create business for the user
      const business = await DatabaseService.createBusiness({
        name: signupData.businessName,
        type: BusinessType.FOOD_FRANCHISE, // Default to food franchise
        timezone: 'America/Toronto', // Default timezone
        currency: 'CAD', // Default currency
        isActive: true,
        ownerId: dbUser.id
      });

      // Convert to app user format
      const user: User = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        role: signupData.role,
        businessId: business.id,
        businessName: business.name,
        createdAt: dbUser.createdAt,
        lastLoginAt: new Date()
      };

      // Generate token
      const token = this.generateToken();

      // Store auth data
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
      await DatabaseService.setCurrentUser(dbUser);
      await DatabaseService.setCurrentBusiness(business);

      this.currentUser = user;
      this.authToken = token;

      return { success: true, user, token, business };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }





  // Logout
  async logout(): Promise<void> {
    try {
      // Clear local storage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);

      // Clear local state
      this.currentUser = null;
      this.authToken = null;

      console.log('Logout completed - local data cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get auth token
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  // Check if user is business owner
  isBusinessOwner(): boolean {
    return this.currentUser?.role === 'business_owner';
  }

  // Check if email already exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const dbUser = await DatabaseService.getUserByEmail(email);
      if (dbUser) {
        return true;
      }

      // Also check mock users
      const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      return mockUser !== undefined;
    } catch (error) {
      console.error('Email check error:', error);
      return false;
    }
  }

  // Check if user is team member
  isTeamMember(): boolean {
    return this.currentUser?.role === 'team_member';
  }

  // Check if user has permission for specific action
  hasPermission(action: 'view_statistics' | 'delete_transactions' | 'manage_team' | 'add_transactions'): boolean {
    if (!this.currentUser) return false;
    
    switch (action) {
      case 'add_transactions':
        return true; // Both roles can add transactions
      case 'view_statistics':
      case 'delete_transactions':
      case 'manage_team':
        return this.currentUser.role === 'business_owner';
      default:
        return false;
    }
  }

  // Get team members (for business owners)
  async getTeamMembers(): Promise<User[]> {
    if (!this.isBusinessOwner() || !this.currentUser) {
      return [];
    }
    
    return MOCK_USERS.filter(user => 
      user.businessId === this.currentUser!.businessId && 
      user.id !== this.currentUser!.id
    );
  }

  // Update user profile
  async updateProfile(updates: Partial<Pick<User, 'firstName' | 'lastName'>>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Not authenticated' };
      }
      
      // Update current user
      this.currentUser = { ...this.currentUser, ...updates };
      
      // Update in mock database
      const userIndex = MOCK_USERS.findIndex(u => u.id === this.currentUser!.id);
      if (userIndex !== -1) {
        MOCK_USERS[userIndex] = this.currentUser;
      }
      
      // Update stored data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(this.currentUser));
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
}

export default new AuthService();

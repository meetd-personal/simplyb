import { supabase } from '../config/supabase';
import SupabaseDatabaseService from './SupabaseDatabaseService';
import { User } from '../types/database';

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  businesses?: any[];
  error?: string;
  message?: string;
}

class SupabaseAuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;

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
      // Check if email already exists
      const emailExists = await this.checkEmailExists(userData.email);
      if (emailExists) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
          },
          // For development/testing, we can skip email confirmation
          emailRedirectTo: undefined,
          // This will help bypass email confirmation if it's enabled
          captchaToken: undefined
        }
      });

      if (authError) {
        console.error('❌ Supabase signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account' };
      }

      // Check if user needs email confirmation (only if email confirmation is enabled)
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        // If there's no session but user exists, it means email confirmation is required
        // But we'll continue with the signup process and let the user know they need to verify
        console.log('📧 Email confirmation required for:', userData.email);
        // Don't return error here - continue with user creation
      }

      // Create user profile in our users table
      const user = await SupabaseDatabaseService.createUser({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true
      });

      // Get user's businesses (will be empty for new users)
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;

      // If no session (email confirmation required), still return success but with a message
      if (!authData.session) {
        return {
          success: true,
          user,
          token: null, // No token until email is confirmed
          businesses,
          message: 'Account created successfully! Please check your email to verify your account before signing in.'
        };
      }

      return {
        success: true,
        user,
        token: authData.session.access_token,
        businesses
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Failed to create account' };
    }
  }

  // Sign in with email and password
  async login(credentials: { email: string; password: string }): Promise<AuthResult> {
    try {
      console.log('🔐 Attempting login with email:', credentials.email);

      // Ensure email and password are strings
      const cleanEmail = String(credentials.email).trim();
      const cleanPassword = String(credentials.password);

      console.log('🔐 Clean email:', cleanEmail);

      // Sign in with Supabase Auth
      console.log('🔐 Attempting Supabase auth with:', { email: cleanEmail, passwordLength: cleanPassword.length });
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      console.log('🔐 Supabase auth response:', {
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        userId: authData?.user?.id,
        userEmail: authData?.user?.email,
        errorMessage: authError?.message,
        errorCode: authError?.status
      });

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        console.error('❌ Full error details:', JSON.stringify(authError, null, 2));

        // Provide better error messages for common issues
        if (authError.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please check your email and click the confirmation link before signing in. Check your spam folder if you don\'t see the email.'
          };
        }

        if (authError.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password. Please check your credentials and try again.'
          };
        }

        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Get user profile from our users table
      const user = await SupabaseDatabaseService.getUserByEmail(cleanEmail);
      if (!user) {
        return { success: false, error: 'User profile not found' };
      }

      // Get user's businesses (both owned and team memberships)
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;

      this.currentUser = user;
      this.authToken = authData.session?.access_token || null;

      return {
        success: true,
        user,
        token: authData.session?.access_token,
        businesses
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }











  // Sign out
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = null;
      this.authToken = null;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get auth token
  getToken(): string | null {
    return this.authToken;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  // Check if email already exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if email exists:', email);

      const existingUser = await SupabaseDatabaseService.getUserByEmail(email);
      const exists = existingUser !== null;

      console.log('📧 Email exists:', exists);
      return exists;
    } catch (error) {
      console.error('❌ Email check error:', error);
      // Return false on error to not block signup
      return false;
    }
  }

  // Initialize auth state (check for existing session)
  async initializeAuth(): Promise<AuthResult> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { success: false, error: 'No active session' };
      }

      // Get user profile
      const user = await SupabaseDatabaseService.getUserByEmail(session.user.email!);
      if (!user) {
        return { success: false, error: 'User profile not found' };
      }

      // Get user's businesses
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;

      this.currentUser = user;
      this.authToken = session.access_token;

      return { 
        success: true, 
        user, 
        token: session.access_token,
        businesses
      };
    } catch (error) {
      console.error('Initialize auth error:', error);
      return { success: false, error: 'Failed to initialize authentication' };
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default new SupabaseAuthService();

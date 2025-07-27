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

  // Google Sign In - Uses consistent demo account
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🔍 Starting Google sign in...');

      // Use a consistent demo email for Google sign-in (simulates same Google account)
      const demoGoogleEmail = 'demo.google.user@gmail.com';

      console.log('👤 Checking for existing Google user:', demoGoogleEmail);

      // Check if user already exists
      let user = await SupabaseDatabaseService.getUserByEmail(demoGoogleEmail);

      if (user) {
        console.log('✅ Existing Google user found:', user.email);
      } else {
        console.log('👤 Creating new Google user:', demoGoogleEmail);

        // Create user account
        user = await SupabaseDatabaseService.createUser({
          email: demoGoogleEmail,
          firstName: 'Google',
          lastName: 'User',
          isActive: true
        });

        console.log('✅ Google user created successfully');
      }

      // Get user's businesses (existing or newly created)
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;
      console.log('📋 User businesses:', businesses.map(b => b.name));

      // Generate a session token
      const sessionToken = `google_session_${user.id}_${Date.now()}`;

      this.currentUser = user;
      this.authToken = sessionToken;

      console.log('✅ Google sign in completed successfully');

      return {
        success: true,
        user,
        token: sessionToken,
        businesses
      };
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      return { success: false, error: `Google sign in failed: ${error.message}` };
    }
  }

  // Apple Sign In - Uses consistent demo account
  async signInWithApple(): Promise<AuthResult> {
    try {
      console.log('🍎 Starting Apple sign in...');

      // Use a consistent demo email for Apple sign-in (simulates same Apple account)
      const demoAppleEmail = 'demo.apple.user@icloud.com';

      console.log('👤 Checking for existing Apple user:', demoAppleEmail);

      // Check if user already exists
      let user = await SupabaseDatabaseService.getUserByEmail(demoAppleEmail);

      if (user) {
        console.log('✅ Existing Apple user found:', user.email);
      } else {
        console.log('👤 Creating new Apple user:', demoAppleEmail);

        // Create user account
        user = await SupabaseDatabaseService.createUser({
          email: demoAppleEmail,
          firstName: 'Apple',
          lastName: 'User',
          isActive: true
        });

        console.log('✅ Apple user created successfully');
      }

      // Get user's businesses (existing or newly created)
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;
      console.log('📋 User businesses:', businesses.map(b => b.name));

      // Generate a session token
      const sessionToken = `apple_session_${user.id}_${Date.now()}`;

      this.currentUser = user;
      this.authToken = sessionToken;

      console.log('✅ Apple sign in completed successfully');

      return {
        success: true,
        user,
        token: sessionToken,
        businesses
      };
    } catch (error) {
      console.error('❌ Apple sign in error:', error);
      return { success: false, error: `Apple sign in failed: ${error.message}` };
    }
  }

  // Google Sign In with user's actual email
  async signInWithGoogleEmail(email: string): Promise<AuthResult> {
    try {
      console.log('🔍 Starting Google sign in with email:', email);

      // Check if user already exists
      let user = await SupabaseDatabaseService.getUserByEmail(email);

      if (user) {
        console.log('✅ Existing Google user found:', user.email);
      } else {
        console.log('👤 Creating new Google user:', email);

        // Extract name from email for new users
        const emailParts = email.split('@')[0].split('.');
        const firstName = emailParts[0] || 'Google';
        const lastName = emailParts[1] || 'User';

        // Create user account
        user = await SupabaseDatabaseService.createUser({
          email: email,
          firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          isActive: true
        });

        console.log('✅ Google user created successfully');
      }

      // Get user's businesses
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;
      console.log('📋 User businesses:', businesses.map(b => b.name));

      // Generate a session token
      const sessionToken = `google_session_${user.id}_${Date.now()}`;

      this.currentUser = user;
      this.authToken = sessionToken;

      console.log('✅ Google sign in completed successfully');

      return {
        success: true,
        user,
        token: sessionToken,
        businesses
      };
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      return { success: false, error: `Google sign in failed: ${error.message}` };
    }
  }

  // Apple Sign In with user's actual email
  async signInWithAppleEmail(email: string): Promise<AuthResult> {
    try {
      console.log('🍎 Starting Apple sign in with email:', email);

      // Check if user already exists
      let user = await SupabaseDatabaseService.getUserByEmail(email);

      if (user) {
        console.log('✅ Existing Apple user found:', user.email);
      } else {
        console.log('👤 Creating new Apple user:', email);

        // Extract name from email for new users
        const emailParts = email.split('@')[0].split('.');
        const firstName = emailParts[0] || 'Apple';
        const lastName = emailParts[1] || 'User';

        // Create user account
        user = await SupabaseDatabaseService.createUser({
          email: email,
          firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          isActive: true
        });

        console.log('✅ Apple user created successfully');
      }

      // Get user's businesses
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;
      console.log('📋 User businesses:', businesses.map(b => b.name));

      // Generate a session token
      const sessionToken = `apple_session_${user.id}_${Date.now()}`;

      this.currentUser = user;
      this.authToken = sessionToken;

      console.log('✅ Apple sign in completed successfully');

      return {
        success: true,
        user,
        token: sessionToken,
        businesses
      };
    } catch (error) {
      console.error('❌ Apple sign in error:', error);
      return { success: false, error: `Apple sign in failed: ${error.message}` };
    }
  }

  // Sign in with OAuth data (Google/Apple)
  async signInWithOAuthData(provider: 'google' | 'apple', oauthData: any): Promise<AuthResult> {
    try {
      console.log(`🔍 Processing ${provider} OAuth data:`, oauthData.email);

      // Check if user already exists
      let user = await SupabaseDatabaseService.getUserByEmail(oauthData.email);

      if (user) {
        console.log(`✅ Existing ${provider} user found:`, user.email);
      } else {
        console.log(`👤 Creating new ${provider} user:`, oauthData.email);

        // Create user account with OAuth data
        user = await SupabaseDatabaseService.createUser({
          email: oauthData.email,
          firstName: oauthData.firstName,
          lastName: oauthData.lastName,
          isActive: true
        });

        console.log(`✅ ${provider} user created successfully`);
      }

      // Get user's businesses
      const businessRelationships = await SupabaseDatabaseService.getUserBusinessRelationships(user.id);
      const businesses = businessRelationships.allBusinesses;
      console.log('📋 User businesses:', businesses.map(b => b.name));

      // Generate a session token
      const sessionToken = `${provider}_session_${user.id}_${Date.now()}`;

      this.currentUser = user;
      this.authToken = sessionToken;

      console.log(`✅ ${provider} OAuth sign in completed successfully`);

      return {
        success: true,
        user,
        token: sessionToken,
        businesses
      };
    } catch (error) {
      console.error(`❌ ${provider} OAuth sign in error:`, error);
      return { success: false, error: `${provider} sign in failed: ${error.message}` };
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

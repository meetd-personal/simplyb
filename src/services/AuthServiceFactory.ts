// Auth Service Factory - Switch between Mock and Real Authentication
import MockAuthService from './AuthService';
import SupabaseAuthService from './SupabaseAuthService';

// Configuration - should match DatabaseServiceFactory
const USE_REAL_DATABASE = true; // Using Supabase

// Export the appropriate service based on configuration
const AuthService = USE_REAL_DATABASE ? SupabaseAuthService : MockAuthService;

export default AuthService;

// Debug info
if (__DEV__) {
  console.log(`🔐 Auth Service: ${USE_REAL_DATABASE ? 'Supabase (Real)' : 'Mock'}`);
  if (!USE_REAL_DATABASE) {
    console.log('📝 Using mock auth - switch USE_REAL_DATABASE to true when Supabase is ready');
  }
}

// Auth Service Factory - Switch between Mock and Real Authentication
import MockAuthService from './MockAuthService';
import SupabaseAuthService from './SupabaseAuthService';

// Check if Supabase is properly configured
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Use Supabase if properly configured, otherwise use mock
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'https://your-project.supabase.co' &&
  SUPABASE_ANON_KEY !== 'your-anon-key-here');

// Allow manual override to mock for testing
const FORCE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK_AUTH === 'true';

const USE_REAL_DATABASE = USE_SUPABASE && !FORCE_MOCK;

// Export the appropriate service based on configuration
const AuthService = USE_REAL_DATABASE ? SupabaseAuthService : MockAuthService;

export default AuthService;

// Debug info
if (__DEV__) {
  console.log(`🔐 Auth Service: ${USE_REAL_DATABASE ? 'Supabase (Real)' : 'Mock'}`);
  console.log(`📍 Supabase URL: ${SUPABASE_URL || 'NOT SET'}`);
  console.log(`🔑 Supabase Key: ${SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);

  if (!USE_REAL_DATABASE) {
    console.log('🧪 Using MockAuthService');
    console.log('📧 Demo credentials: demo@simply.com / password123');
    console.log('💡 To use Supabase: Set up new project and update .env file');
  }
}

// Database Service Factory - Switch between Mock and Real Database
import MockDatabaseService from './DatabaseService';
import SupabaseDatabaseService from './SupabaseDatabaseService';

// Configuration - use real Supabase database
const USE_REAL_DATABASE = true; // Using Supabase

// Export the appropriate service based on configuration
const DatabaseService = USE_REAL_DATABASE ? SupabaseDatabaseService : MockDatabaseService;

export default DatabaseService;

// Debug info
if (__DEV__) {
  console.log(`🗄️ Database Service: ${USE_REAL_DATABASE ? 'Supabase (Real)' : 'Mock'}`);
  if (!USE_REAL_DATABASE) {
    console.log('📝 Using mock data - switch USE_REAL_DATABASE to true when Supabase is ready');
  }
}

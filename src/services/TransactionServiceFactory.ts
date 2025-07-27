// Transaction Service Factory - Switch between Mock and Real Database
import MockTransactionService from './TransactionService';
import SupabaseTransactionService from './SupabaseTransactionService';

// Configuration - should match DatabaseServiceFactory
const USE_REAL_DATABASE = true; // Using Supabase

// Export the appropriate service based on configuration
const TransactionService = USE_REAL_DATABASE ? SupabaseTransactionService : MockTransactionService;

export default TransactionService;

// Debug info
if (__DEV__) {
  console.log(`💰 Transaction Service: ${USE_REAL_DATABASE ? 'Supabase (Real)' : 'Mock'}`);
  if (!USE_REAL_DATABASE) {
    console.log('📝 Using mock transactions - switch USE_REAL_DATABASE to true when Supabase is ready');
  }
}

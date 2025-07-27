import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client with better error handling
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // For React Native, we don't need email confirmation redirects
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'simply-mobile-app',
    },
  },
});

// Debug info
if (__DEV__) {
  console.log('🔗 Supabase client initialized');
  console.log('📍 URL:', SUPABASE_URL);
  console.log('🔑 Key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

// Database type definitions for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          profile_image: string | null;
          created_at: string;
          last_login_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          profile_image?: string | null;
          created_at?: string;
          last_login_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          profile_image?: string | null;
          created_at?: string;
          last_login_at?: string;
          is_active?: boolean;
        };
      };
      businesses: {
        Row: {
          id: string;
          name: string;
          type: 'FOOD_FRANCHISE' | 'RESTAURANT' | 'RETAIL' | 'SERVICE' | 'OTHER';
          description: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          timezone: string;
          currency: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
          owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'FOOD_FRANCHISE' | 'RESTAURANT' | 'RETAIL' | 'SERVICE' | 'OTHER';
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          owner_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'FOOD_FRANCHISE' | 'RESTAURANT' | 'RETAIL' | 'SERVICE' | 'OTHER';
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          timezone?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
          owner_id?: string;
        };
      };
      business_members: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          role: 'OWNER' | 'MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT';
          permissions: any;
          joined_at: string;
          invited_by: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          role: 'OWNER' | 'MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT';
          permissions?: any;
          joined_at?: string;
          invited_by?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          role?: 'OWNER' | 'MANAGER' | 'EMPLOYEE' | 'ACCOUNTANT';
          permissions?: any;
          joined_at?: string;
          invited_by?: string | null;
          is_active?: boolean;
        };
      };
      transactions: {
        Row: {
          id: string;
          business_id: string;
          user_id: string | null;
          type: 'REVENUE' | 'EXPENSE';
          amount: number;
          description: string | null;
          category: string;
          date: string;
          receipt_uri: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id?: string | null;
          type: 'REVENUE' | 'EXPENSE';
          amount: number;
          description?: string | null;
          category: string;
          date: string;
          receipt_uri?: string | null;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string | null;
          type?: 'REVENUE' | 'EXPENSE';
          amount?: number;
          description?: string | null;
          category?: string;
          date?: string;
          receipt_uri?: string | null;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

import { supabase } from '../config/supabase';
import { Transaction, Revenue, Expense, Category, FilterOptions } from '../types';

class SupabaseTransactionService {
  // Default categories for restaurant/delivery business
  private defaultCategories: Category[] = [
    // Revenue categories - delivery platforms and direct sales
    { id: '1', name: 'Instore', type: 'revenue', color: '#4CAF50', icon: 'storefront' },
    { id: '2', name: 'Call Center', type: 'revenue', color: '#2196F3', icon: 'call' },
    { id: '3', name: 'Uber', type: 'revenue', color: '#000000', icon: 'car' },
    { id: '4', name: 'Skip The Dishes', type: 'revenue', color: '#FF6B35', icon: 'bicycle' },

    // Expense categories
    { id: '5', name: 'Food Costs', type: 'expense', color: '#F44336', icon: 'restaurant' },
    { id: '6', name: 'Operating Expenses', type: 'expense', color: '#9C27B0', icon: 'business' },
  ];

  async initializeCategories(): Promise<void> {
    // Categories are now hardcoded - no database initialization needed
    console.log('🏷️ Using hardcoded categories for restaurant business');
  }

  async getTransactions(businessId?: string): Promise<Transaction[]> {
    try {
      if (!businessId) {
        console.warn('⚠️ No business ID provided for getTransactions');
        return [];
      }

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessId)
        .order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error getting transactions:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to get transactions: ${error.message}`);
      }

      if (!data) {
        console.log('ℹ️ No transactions found for business:', businessId);
        return [];
      }

      return data.map(this.mapSupabaseTransactionToTransaction);
    } catch (error) {
      console.error('❌ Network error in getTransactions:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to load transactions. Please check your connection.');
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, businessId: string): Promise<Transaction> {
    try {
      // Validation
      if (!businessId) {
        throw new Error('Business ID is required');
      }

      if (!transaction.type || !['revenue', 'expense'].includes(transaction.type)) {
        throw new Error('Invalid transaction type');
      }

      if (!transaction.amount || transaction.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      if (!transaction.category?.trim()) {
        throw new Error('Category is required');
      }

      console.log('💰 Adding transaction to Supabase:', transaction.type, transaction.amount);
      console.log('💰 Converting type to uppercase:', transaction.type.toUpperCase());

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          business_id: businessId,
          user_id: null, // Will be set by auth context if needed
          type: transaction.type.toUpperCase(), // Convert to uppercase for enum
          amount: transaction.amount,
          description: transaction.description || null, // Optional field
          category: transaction.category.trim(),
          date: transaction.date.toISOString().split('T')[0], // Date only, not datetime
          receipt_uri: transaction.receiptUrl || null,
          metadata: transaction.notes ? { notes: transaction.notes } : null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding transaction:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));

        // Provide user-friendly error messages
        if (error.code === '23505') {
          throw new Error('Duplicate transaction detected');
        } else if (error.code === '23503') {
          throw new Error('Invalid business or user reference');
        } else {
          throw new Error(`Failed to add transaction: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Transaction was not created properly');
      }

      console.log('✅ Transaction added successfully:', data.id);
      return this.mapSupabaseTransactionToTransaction(data);
    } catch (error) {
      console.error('❌ Error in addTransaction:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add transaction. Please try again.');
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      console.log('📝 Updating transaction in Supabase:', id);

      const updateData: any = {};

      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.date !== undefined) updateData.date = updates.date.toISOString().split('T')[0];
      if (updates.receiptUrl !== undefined) updateData.receipt_uri = updates.receiptUrl;
      if (updates.notes !== undefined) updateData.metadata = { notes: updates.notes };

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        throw new Error(`Failed to update transaction: ${error.message}`);
      }

      console.log('✅ Transaction updated successfully');
      return this.mapSupabaseTransactionToTransaction(data);
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting transaction from Supabase:', id);

      // Hard delete since there's no is_active column
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        throw new Error(`Failed to delete transaction: ${error.message}`);
      }

      console.log('✅ Transaction deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  async getFilteredTransactions(filters: FilterOptions, businessId?: string): Promise<Transaction[]> {
    try {
      console.log('🔍 Getting filtered transactions from Supabase');

      let query = supabase
        .from('transactions')
        .select('*');

      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      if (filters.dateRange) {
        query = query
          .gte('date', filters.dateRange.startDate.toISOString().split('T')[0])
          .lte('date', filters.dateRange.endDate.toISOString().split('T')[0]);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }

      if (filters.minAmount !== undefined) {
        query = query.gte('amount', filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query = query.lte('amount', filters.maxAmount);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error getting filtered transactions:', error);
        throw new Error(`Failed to get filtered transactions: ${error.message}`);
      }

      return (data || []).map(this.mapSupabaseTransactionToTransaction);
    } catch (error) {
      console.error('Error getting filtered transactions:', error);
      return [];
    }
  }

  async getCategories(): Promise<Category[]> {
    // Return hardcoded categories - no database lookup needed
    console.log('🏷️ Returning hardcoded restaurant categories');
    return this.defaultCategories;
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    // Categories are fixed for restaurant business - no custom categories allowed
    throw new Error('Custom categories are not supported. Please use the predefined categories: Instore, Call Center, Uber, Skip The Dishes, Food Costs, or Operating Expenses.');
  }

  // Helper method to map Supabase transaction to app transaction
  private mapSupabaseTransactionToTransaction(data: any): Transaction {
    return {
      id: data.id,
      businessId: data.business_id,
      userId: data.user_id,
      type: data.type.toLowerCase(), // Convert from uppercase enum to lowercase for app
      amount: parseFloat(data.amount),
      description: data.description || undefined, // Optional field
      category: data.category,
      date: new Date(data.date),
      receiptUri: data.receipt_uri,
      metadata: data.metadata || {},
      // Map metadata.notes to notes for backward compatibility
      notes: data.metadata?.notes,
      paymentMethod: undefined, // Not in current schema
      receiptUrl: data.receipt_uri, // Map receiptUri to receiptUrl for compatibility
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}

export default new SupabaseTransactionService();

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Revenue, Expense, Category, FilterOptions } from '../types';

const TRANSACTIONS_KEY = '@simply_transactions';
const CATEGORIES_KEY = '@simply_categories';

class TransactionService {
  // Default categories
  private defaultCategories: Category[] = [
    // Revenue categories
    { id: '1', name: 'Sales', type: 'revenue', color: '#4CAF50', icon: 'cash' },
    { id: '2', name: 'Services', type: 'revenue', color: '#2196F3', icon: 'construct' },
    { id: '3', name: 'Consulting', type: 'revenue', color: '#FF9800', icon: 'people' },
    { id: '4', name: 'Other Income', type: 'revenue', color: '#9C27B0', icon: 'add-circle' },
    
    // Expense categories
    { id: '5', name: 'Office Supplies', type: 'expense', color: '#F44336', icon: 'briefcase' },
    { id: '6', name: 'Marketing', type: 'expense', color: '#E91E63', icon: 'megaphone' },
    { id: '7', name: 'Travel', type: 'expense', color: '#795548', icon: 'airplane' },
    { id: '8', name: 'Utilities', type: 'expense', color: '#607D8B', icon: 'flash' },
    { id: '9', name: 'Equipment', type: 'expense', color: '#FF5722', icon: 'hardware-chip' },
    { id: '10', name: 'Other Expenses', type: 'expense', color: '#9E9E9E', icon: 'remove-circle' },
  ];

  async initializeCategories(): Promise<void> {
    try {
      const existingCategories = await AsyncStorage.getItem(CATEGORIES_KEY);
      if (!existingCategories) {
        await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(this.defaultCategories));
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const transactions = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (transactions) {
        return JSON.parse(transactions).map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const transactions = await this.getTransactions();
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      transactions.push(newTransaction);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index === -1) return null;
      
      transactions[index] = {
        ...transactions[index],
        ...updates,
        updatedAt: new Date(),
      };
      
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      return transactions[index];
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  async getFilteredTransactions(filters: FilterOptions): Promise<Transaction[]> {
    try {
      let transactions = await this.getTransactions();
      
      if (filters.dateRange) {
        transactions = transactions.filter(t => 
          t.date >= filters.dateRange!.startDate && 
          t.date <= filters.dateRange!.endDate
        );
      }
      
      if (filters.categories && filters.categories.length > 0) {
        transactions = transactions.filter(t => 
          filters.categories!.includes(t.category)
        );
      }
      
      if (filters.minAmount !== undefined) {
        transactions = transactions.filter(t => t.amount >= filters.minAmount!);
      }
      
      if (filters.maxAmount !== undefined) {
        transactions = transactions.filter(t => t.amount <= filters.maxAmount!);
      }
      
      return transactions;
    } catch (error) {
      console.error('Error filtering transactions:', error);
      return [];
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const categories = await AsyncStorage.getItem(CATEGORIES_KEY);
      return categories ? JSON.parse(categories) : this.defaultCategories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return this.defaultCategories;
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      const categories = await this.getCategories();
      const newCategory: Category = {
        ...category,
        id: Date.now().toString(),
      };
      
      categories.push(newCategory);
      await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }
}

export default new TransactionService();

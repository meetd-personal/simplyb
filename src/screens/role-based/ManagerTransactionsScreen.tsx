import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { Transaction } from '../../types';
import { RootStackParamList } from '../../types';
import TransactionService from '../../services/TransactionServiceFactory';
import RoleBasedPermissionService from '../../services/RoleBasedPermissionService';

type ManagerTransactionsNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: ManagerTransactionsNavigationProp;
}

export default function ManagerTransactionsScreen({ navigation }: Props) {
  const { state } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'revenue' | 'expense'>('all');

  const loadTransactions = async () => {
    try {
      const businessId = state.currentBusiness?.id;
      const allTransactions = await TransactionService.getTransactions(businessId);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('❌ Manager Transactions: Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.type === filter);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const FilterButton = ({ 
    type, 
    label, 
    count 
  }: {
    type: 'all' | 'revenue' | 'expense';
    label: string;
    count: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === type && styles.filterButtonActive
      ]}
      onPress={() => setFilter(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === type && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    >
      <View style={styles.transactionLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: item.type === 'revenue' ? '#4CAF5020' : '#F4433620' }
        ]}>
          <Ionicons 
            name={item.type === 'revenue' ? 'trending-up' : 'trending-down'} 
            size={20} 
            color={item.type === 'revenue' ? '#4CAF50' : '#F44336'} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          <Text style={styles.transactionType}>
            {item.type === 'revenue' ? 'Revenue' : 'Expense'}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionNote}>
          {/* Managers can see that transaction exists but not the amount */}
          Amount Hidden
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ 
    title, 
    icon, 
    color, 
    onPress 
  }: {
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const filteredTransactions = getFilteredTransactions();
  const revenueCount = transactions.filter(t => t.type === 'revenue').length;
  const expenseCount = transactions.filter(t => t.type === 'expense').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction Management</Text>
        <Text style={styles.subtitle}>Add and view business transactions</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Add Revenue"
            icon="add-circle"
            color="#4CAF50"
            onPress={() => navigation.navigate('AddTransaction', { type: 'revenue' })}
          />
          <QuickAction
            title="Add Expense"
            icon="remove-circle"
            color="#F44336"
            onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
          />
        </View>
      </View>

      {/* Manager Notice */}
      <View style={styles.noticeContainer}>
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.noticeText}>
            As a manager, you can add transactions and view activity, but financial amounts are restricted.
          </Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton type="all" label="All" count={transactions.length} />
        <FilterButton type="revenue" label="Revenue" count={revenueCount} />
        <FilterButton type="expense" label="Expenses" count={expenseCount} />
      </View>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No transactions found</Text>
          <Text style={styles.emptyStateSubtext}>
            {filter === 'all' 
              ? 'Start by adding your first transaction'
              : `No ${filter} transactions recorded yet`
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  quickActionsContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  quickAction: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  noticeContainer: {
    padding: 20,
    paddingTop: 0,
  },
  noticeCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 10,
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionType: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionNote: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
});

// Data will be refreshed automatically when business switches due to navigation key change

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Transaction, RootStackParamList } from '../types';
import TransactionService from '../services/TransactionService';

type RevenueScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
  navigation: RevenueScreenNavigationProp;
}

export default function RevenueScreen({ navigation }: Props) {
  const [revenues, setRevenues] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRevenues = async () => {
    try {
      const transactions = await TransactionService.getTransactions();
      const revenueTransactions = transactions
        .filter(t => t.type === 'revenue')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRevenues(revenueTransactions);
    } catch (error) {
      console.error('Error loading revenues:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRevenues();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRevenues();
    }, [])
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getTotalRevenue = () => {
    return revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  };

  const renderRevenueItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.revenueItem}
      onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
    >
      <View style={styles.revenueLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="trending-up" size={20} color="#4CAF50" />
        </View>
        <View style={styles.revenueDetails}>
          <Text style={styles.revenueDescription}>{item.description}</Text>
          <Text style={styles.revenueCategory}>{item.category}</Text>
          <Text style={styles.revenueDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
      <Text style={styles.revenueAmount}>
        {formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Revenue</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(getTotalRevenue())}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTransaction', { type: 'revenue' })}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {revenues.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No revenue recorded yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Start tracking your business income
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('AddTransaction', { type: 'revenue' })}
          >
            <Text style={styles.emptyStateButtonText}>Add First Revenue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={revenues}
          renderItem={renderRevenueItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    backgroundColor: '#4CAF50',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  revenueItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  revenueLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueDetails: {
    marginLeft: 12,
    flex: 1,
  },
  revenueDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  revenueCategory: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
  },
  revenueDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  revenueAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

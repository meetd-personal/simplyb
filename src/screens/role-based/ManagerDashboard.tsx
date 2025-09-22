import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { Transaction } from '../../types';
import { RootStackParamList } from '../../types';
import TransactionService from '../../services/TransactionServiceFactory';
import RoleBasedPermissionService from '../../services/RoleBasedPermissionService';
import HRServiceFactory from '../../services/HRServiceFactory';

type ManagerDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
  navigation: ManagerDashboardNavigationProp;
}

export default function ManagerDashboard({ navigation }: Props) {
  const { state: authState } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    transactionCount: 0,
    recentTransactionCount: 0,
    todayTransactionCount: 0,
  });
  const [pendingTimeOffCount, setPendingTimeOffCount] = useState(0);

  const loadData = async () => {
    try {
      const businessId = authState.currentBusiness?.id;
      const [allTransactions, timeOffRequests] = await Promise.all([
        TransactionService.getTransactions(businessId),
        HRServiceFactory.getTimeOffRequests(businessId || '')
      ]);

      setTransactions(allTransactions);

      // Count pending time off requests
      const pendingRequests = timeOffRequests.filter(req => req.status === 'pending');
      setPendingTimeOffCount(pendingRequests.length);

      // Managers can see transaction counts but not financial totals
      const today = new Date();
      const todayTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === today.toDateString();
      });

      const recentTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return transactionDate >= weekAgo;
      });

      setStats({
        transactionCount: allTransactions.length,
        recentTransactionCount: recentTransactions.length,
        todayTransactionCount: todayTransactions.length,
      });
    } catch (error) {
      console.error('❌ Manager Dashboard: Error loading data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getRecentTransactions = () => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8); // Managers can see more recent transactions
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle 
  }: {
    title: string;
    value: string;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const QuickAction = ({
    title,
    icon,
    color,
    onPress,
    badge
  }: {
    title: string;
    icon: string;
    color: string;
    onPress: () => void;
    badge?: number;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
        {badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge.toString()}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>
            Hello, {authState.user?.firstName}!
          </Text>
          <Text style={styles.subtitleText}>
            {authState.currentBusiness?.name} • Manager
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Activity Overview - No financial totals for managers */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Transactions"
          value={stats.transactionCount.toString()}
          icon="receipt"
          color="#2196F3"
          subtitle="All time"
        />
        
        <StatCard
          title="This Week"
          value={stats.recentTransactionCount.toString()}
          icon="calendar"
          color="#4CAF50"
          subtitle="Last 7 days"
        />
        
        <StatCard
          title="Today"
          value={stats.todayTransactionCount.toString()}
          icon="today"
          color="#FF9800"
          subtitle="Today's activity"
        />
      </View>

      {/* Quick Actions - Manager specific */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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
          <QuickAction
            title="View Schedules"
            icon="calendar"
            color="#2196F3"
            onPress={() => navigation.navigate('ScheduleManagement')}
          />
          <QuickAction
            title="Manage Payroll"
            icon="card"
            color="#9C27B0"
            onPress={() => navigation.navigate('PayrollManagement')}
          />
          <QuickAction
            title="Time Off Requests"
            icon="airplane"
            color="#FF9800"
            badge={pendingTimeOffCount}
            onPress={() => navigation.navigate('TimeOffApproval')}
          />
        </View>
      </View>

      {/* Recent Transactions - Managers can see transactions but not amounts */}
      <View style={styles.recentTransactions}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert('Info', 'You can view transaction details but not financial totals');
          }}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {getRecentTransactions().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No recent activity</Text>
            <Text style={styles.emptyStateSubtext}>
              Transaction activity will appear here
            </Text>
          </View>
        ) : (
          getRecentTransactions().map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => navigation.navigate('TransactionDetail', { transactionId: transaction.id })}
            >
              <View style={styles.transactionLeft}>
                <Ionicons
                  name={transaction.type === 'revenue' ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={transaction.type === 'revenue' ? '#4CAF50' : '#F44336'}
                />
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.category}
                  </Text>
                  <Text style={styles.transactionCategory}>
                    {new Date(transaction.date).toLocaleDateString()} • {transaction.type}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Manager Notes */}
      <View style={styles.notesContainer}>
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Manager Access</Text>
            <Text style={styles.noteText}>
              You can add transactions and view activity, but financial totals are restricted to business owners.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  quickAction: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentTransactions: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
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
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  transactionRight: {
    padding: 5,
  },
  notesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  noteCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteContent: {
    marginLeft: 15,
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

// Data will be refreshed automatically when business switches due to navigation key change

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Transaction, CategoryStat } from '../types';
import TransactionService from '../services/TransactionServiceFactory';
import { WebCompatibleLineChart, WebCompatiblePieChart } from '../components/WebCompatibleCharts';
import { useAuth } from '../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function StatisticsScreen() {
  const { state } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
  });

  const loadData = async () => {
    try {
      const businessId = state.currentBusiness?.id;
      const allTransactions = await TransactionService.getTransactions(businessId);
      setTransactions(allTransactions);
      
      const revenue = allTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netProfit = revenue - expenses;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      
      setStats({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit,
        profitMargin,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
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

  // Data will be refreshed automatically when business switches due to navigation key change

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMonthlyData = () => {
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyExpenses = new Array(12).fill(0);
    
    transactions.forEach(transaction => {
      const month = new Date(transaction.date).getMonth();
      if (transaction.type === 'revenue') {
        monthlyRevenue[month] += transaction.amount;
      } else {
        monthlyExpenses[month] += transaction.amount;
      }
    });
    
    return { monthlyRevenue, monthlyExpenses };
  };

  const getCategoryData = (type: 'revenue' | 'expense') => {
    const categoryTotals: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === type)
      .forEach(transaction => {
        categoryTotals[transaction.category] = 
          (categoryTotals[transaction.category] || 0) + transaction.amount;
      });
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        amount,
        color: getRandomColor(),
        legendFontColor: '#333',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  };

  const getRandomColor = () => {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const { monthlyRevenue, monthlyExpenses } = getMonthlyData();
  const revenueCategories = getCategoryData('revenue');
  const expenseCategories = getCategoryData('expense');

  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        data: monthlyRevenue,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: monthlyExpenses,
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Revenue', 'Expenses'],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Business Statistics</Text>
        <Text style={styles.subtitle}>Insights into your financial performance</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {formatCurrency(stats.totalRevenue)}
          </Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#F44336' }]}>
          <Text style={styles.statLabel}>Total Expenses</Text>
          <Text style={[styles.statValue, { color: '#F44336' }]}>
            {formatCurrency(stats.totalExpenses)}
          </Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: stats.netProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statLabel}>Net Profit</Text>
          <Text style={[styles.statValue, { color: stats.netProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
            {formatCurrency(stats.netProfit)}
          </Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
          <Text style={styles.statLabel}>Profit Margin</Text>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>
            {stats.profitMargin.toFixed(1)}%
          </Text>
        </View>
      </View>

      {transactions.length > 0 && (
        <>
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Monthly Trends</Text>
            <WebCompatibleLineChart
              data={lineData}
              width={screenWidth - 32}
              height={220}
            />
          </View>

          {revenueCategories.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Revenue by Category</Text>
              <WebCompatiblePieChart
                data={revenueCategories}
                width={screenWidth - 32}
                height={220}
                title="Revenue by Category"
              />
            </View>
          )}

          {expenseCategories.length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Expenses by Category</Text>
              <WebCompatiblePieChart
                data={expenseCategories}
                width={screenWidth - 32}
                height={220}
                title="Expenses by Category"
              />
            </View>
          )}
        </>
      )}

      {transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No data to display</Text>
          <Text style={styles.emptyStateSubtext}>
            Add some transactions to see your business statistics
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartSection: {
    padding: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
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
});

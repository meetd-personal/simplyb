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
import { RootStackParamList } from '../../types';

type EmployeeDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
  navigation: EmployeeDashboardNavigationProp;
}

interface EmployeeStats {
  hoursThisWeek: number;
  hoursThisPayPeriod: number;
  expectedPay: number;
  upcomingShifts: number;
  pendingTimeOffRequests: number;
  hourlyRate: number;
}

export default function EmployeeDashboard({ navigation }: Props) {
  const { state: authState } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<EmployeeStats>({
    hoursThisWeek: 0,
    hoursThisPayPeriod: 0,
    expectedPay: 0,
    upcomingShifts: 0,
    pendingTimeOffRequests: 0,
    hourlyRate: 15.00, // Default minimum wage
  });

  const loadData = async () => {
    try {
      // In a real app, this would fetch from HR/payroll service
      // For now, we'll use mock data
      const mockStats: EmployeeStats = {
        hoursThisWeek: 32.5,
        hoursThisPayPeriod: 67.5,
        expectedPay: 1012.50,
        upcomingShifts: 4,
        pendingTimeOffRequests: 1,
        hourlyRate: 15.00,
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('❌ Employee Dashboard: Error loading data:', error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  const UpcomingShift = ({ 
    date, 
    time, 
    duration 
  }: {
    date: string;
    time: string;
    duration: string;
  }) => (
    <View style={styles.shiftItem}>
      <View style={styles.shiftLeft}>
        <Ionicons name="time" size={20} color="#2196F3" />
        <View style={styles.shiftDetails}>
          <Text style={styles.shiftDate}>{date}</Text>
          <Text style={styles.shiftTime}>{time}</Text>
        </View>
      </View>
      <Text style={styles.shiftDuration}>{duration}</Text>
    </View>
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
            Hi, {authState.user?.firstName}!
          </Text>
          <Text style={styles.subtitleText}>
            {authState.currentBusiness?.name} • Team Member
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Work & Pay Overview */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Hours This Week"
          value={stats.hoursThisWeek.toString()}
          icon="time"
          color="#4CAF50"
          subtitle="Current week"
        />
        
        <StatCard
          title="Pay Period Hours"
          value={stats.hoursThisPayPeriod.toString()}
          icon="calendar"
          color="#2196F3"
          subtitle="Current pay period"
        />
        
        <StatCard
          title="Expected Pay"
          value={formatCurrency(stats.expectedPay)}
          icon="card"
          color="#FF9800"
          subtitle={`@ ${formatCurrency(stats.hourlyRate)}/hour`}
        />
      </View>

      {/* Quick Actions - Employee specific */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="My Schedule"
            icon="calendar"
            color="#2196F3"
            onPress={() => {
              Alert.alert('Coming Soon', 'Schedule view will be available soon');
            }}
          />
          <QuickAction
            title="Request Time Off"
            icon="airplane"
            color="#4CAF50"
            onPress={() => {
              Alert.alert('Coming Soon', 'Time off requests will be available soon');
            }}
            badge={stats.pendingTimeOffRequests}
          />
          <QuickAction
            title="Clock In/Out"
            icon="stopwatch"
            color="#FF9800"
            onPress={() => {
              Alert.alert('Coming Soon', 'Time tracking will be available soon');
            }}
          />
          <QuickAction
            title="My Profile"
            icon="person"
            color="#9C27B0"
            onPress={() => {
              Alert.alert('Coming Soon', 'Profile management will be available soon');
            }}
          />
        </View>
      </View>

      {/* Upcoming Shifts */}
      <View style={styles.upcomingShifts}>
        <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
        
        <UpcomingShift
          date="Today"
          time="2:00 PM - 10:00 PM"
          duration="8 hrs"
        />
        <UpcomingShift
          date="Tomorrow"
          time="10:00 AM - 6:00 PM"
          duration="8 hrs"
        />
        <UpcomingShift
          date="Friday"
          time="4:00 PM - 11:00 PM"
          duration="7 hrs"
        />
        <UpcomingShift
          date="Saturday"
          time="11:00 AM - 7:00 PM"
          duration="8 hrs"
        />
      </View>

      {/* Employee Information */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Employee Access</Text>
            <Text style={styles.infoText}>
              You have access to your schedule, time tracking, pay information, and time-off requests. 
              Financial data is not accessible to team members.
            </Text>
          </View>
        </View>
      </View>

      {/* Pay Period Summary */}
      <View style={styles.payPeriodContainer}>
        <Text style={styles.sectionTitle}>Current Pay Period</Text>
        <View style={styles.payPeriodCard}>
          <View style={styles.payPeriodHeader}>
            <Text style={styles.payPeriodTitle}>March 1 - March 15, 2024</Text>
            <Text style={styles.payPeriodStatus}>In Progress</Text>
          </View>
          
          <View style={styles.payPeriodStats}>
            <View style={styles.payPeriodStat}>
              <Text style={styles.payPeriodStatLabel}>Regular Hours</Text>
              <Text style={styles.payPeriodStatValue}>{stats.hoursThisPayPeriod}</Text>
            </View>
            <View style={styles.payPeriodStat}>
              <Text style={styles.payPeriodStatLabel}>Overtime Hours</Text>
              <Text style={styles.payPeriodStatValue}>2.5</Text>
            </View>
            <View style={styles.payPeriodStat}>
              <Text style={styles.payPeriodStatLabel}>Expected Pay</Text>
              <Text style={styles.payPeriodStatValue}>{formatCurrency(stats.expectedPay)}</Text>
            </View>
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
    position: 'relative',
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
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  upcomingShifts: {
    padding: 20,
    paddingTop: 0,
  },
  shiftItem: {
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
  shiftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shiftDetails: {
    marginLeft: 12,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  shiftTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shiftDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  infoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  infoCard: {
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
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  payPeriodContainer: {
    padding: 20,
    paddingTop: 0,
  },
  payPeriodCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payPeriodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  payPeriodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  payPeriodStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  payPeriodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payPeriodStat: {
    alignItems: 'center',
  },
  payPeriodStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  payPeriodStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

// Data will be refreshed automatically when business switches due to navigation key change

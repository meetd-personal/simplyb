import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MyPayrollScreen() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const PayPeriod = ({ 
    period, 
    regularHours, 
    overtimeHours, 
    grossPay, 
    netPay,
    status = 'completed'
  }: {
    period: string;
    regularHours: number;
    overtimeHours: number;
    grossPay: number;
    netPay: number;
    status?: 'completed' | 'current' | 'upcoming';
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed': return '#4CAF50';
        case 'current': return '#2196F3';
        default: return '#FF9800';
      }
    };

    return (
      <TouchableOpacity style={styles.payPeriodItem}>
        <View style={styles.payPeriodHeader}>
          <Text style={styles.payPeriodTitle}>{period}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.payPeriodStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Regular Hours:</Text>
            <Text style={styles.statValue}>{regularHours}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Overtime Hours:</Text>
            <Text style={styles.statValue}>{overtimeHours}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Gross Pay:</Text>
            <Text style={styles.statValue}>{formatCurrency(grossPay)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Net Pay:</Text>
            <Text style={[styles.statValue, styles.netPay]}>{formatCurrency(netPay)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color 
  }: {
    title: string;
    value: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Payroll</Text>
        <Text style={styles.subtitle}>View your pay and hours</Text>
      </View>

      {/* Current Pay Period Summary */}
      <View style={styles.currentPeriodContainer}>
        <Text style={styles.sectionTitle}>Current Pay Period</Text>
        <View style={styles.currentPeriodCard}>
          <View style={styles.periodHeader}>
            <Text style={styles.periodTitle}>March 1 - March 15, 2024</Text>
            <Text style={styles.periodDaysLeft}>5 days remaining</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Hours Worked"
              value="67.5"
              icon="time"
              color="#4CAF50"
            />
            <StatCard
              title="Expected Pay"
              value={formatCurrency(1012.50)}
              icon="card"
              color="#2196F3"
            />
          </View>
        </View>
      </View>

      {/* Pay Information */}
      <View style={styles.payInfoContainer}>
        <Text style={styles.sectionTitle}>Pay Information</Text>
        <View style={styles.payInfoCard}>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Hourly Rate:</Text>
            <Text style={styles.payInfoValue}>{formatCurrency(15.00)}</Text>
          </View>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Overtime Rate:</Text>
            <Text style={styles.payInfoValue}>{formatCurrency(22.50)}</Text>
          </View>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Pay Frequency:</Text>
            <Text style={styles.payInfoValue}>Bi-weekly</Text>
          </View>
          <View style={styles.payInfoRow}>
            <Text style={styles.payInfoLabel}>Next Pay Date:</Text>
            <Text style={styles.payInfoValue}>March 20, 2024</Text>
          </View>
        </View>
      </View>

      {/* Pay History */}
      <View style={styles.payHistoryContainer}>
        <Text style={styles.sectionTitle}>Pay History</Text>
        
        <PayPeriod
          period="March 1 - March 15, 2024"
          regularHours={67.5}
          overtimeHours={2.5}
          grossPay={1050.00}
          netPay={812.50}
          status="current"
        />
        
        <PayPeriod
          period="February 15 - February 29, 2024"
          regularHours={80.0}
          overtimeHours={5.0}
          grossPay={1275.00}
          netPay={987.50}
          status="completed"
        />
        
        <PayPeriod
          period="February 1 - February 14, 2024"
          regularHours={72.0}
          overtimeHours={0.0}
          grossPay={1080.00}
          netPay={835.20}
          status="completed"
        />
        
        <PayPeriod
          period="January 15 - January 31, 2024"
          regularHours={76.0}
          overtimeHours={3.0}
          grossPay={1207.50}
          netPay={934.00}
          status="completed"
        />
      </View>

      {/* Help Section */}
      <View style={styles.helpContainer}>
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={24} color="#2196F3" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Questions about your pay?</Text>
            <Text style={styles.helpText}>
              Contact your manager or HR department for any questions about your payroll, 
              hours, or pay calculations.
            </Text>
            <TouchableOpacity 
              style={styles.helpButton}
              onPress={() => Alert.alert('Contact Info', 'Contact your manager for payroll questions')}
            >
              <Text style={styles.helpButtonText}>Contact Manager</Text>
            </TouchableOpacity>
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
  currentPeriodContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  currentPeriodCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  periodDaysLeft: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  payInfoContainer: {
    padding: 20,
    paddingTop: 0,
  },
  payInfoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  payInfoLabel: {
    fontSize: 16,
    color: '#666',
  },
  payInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  payHistoryContainer: {
    padding: 20,
    paddingTop: 0,
  },
  payPeriodItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
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
    marginBottom: 15,
  },
  payPeriodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  payPeriodStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  netPay: {
    color: '#4CAF50',
    fontSize: 16,
  },
  helpContainer: {
    padding: 20,
    paddingTop: 0,
  },
  helpCard: {
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
  helpContent: {
    marginLeft: 15,
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  helpButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

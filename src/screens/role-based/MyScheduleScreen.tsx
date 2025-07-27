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

export default function MyScheduleScreen() {
  const UpcomingShift = ({ 
    date, 
    time, 
    duration,
    status = 'scheduled'
  }: {
    date: string;
    time: string;
    duration: string;
    status?: 'scheduled' | 'completed' | 'missed';
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed': return '#4CAF50';
        case 'missed': return '#F44336';
        default: return '#2196F3';
      }
    };

    return (
      <View style={styles.shiftItem}>
        <View style={styles.shiftLeft}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <View style={styles.shiftDetails}>
            <Text style={styles.shiftDate}>{date}</Text>
            <Text style={styles.shiftTime}>{time}</Text>
          </View>
        </View>
        <View style={styles.shiftRight}>
          <Text style={styles.shiftDuration}>{duration}</Text>
          <Text style={[styles.shiftStatus, { color: getStatusColor() }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>
    );
  };

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>View your work schedule and shifts</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Clock In/Out"
            icon="stopwatch"
            color="#4CAF50"
            onPress={() => Alert.alert('Coming Soon', 'Time tracking will be available soon')}
          />
          <QuickAction
            title="Request Time Off"
            icon="airplane"
            color="#FF9800"
            onPress={() => Alert.alert('Coming Soon', 'Time off requests will be available soon')}
          />
        </View>
      </View>

      <View style={styles.weekSummary}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Scheduled Hours</Text>
            <Text style={styles.summaryValue}>32.5</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Worked Hours</Text>
            <Text style={styles.summaryValue}>28.0</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>4.5</Text>
          </View>
        </View>
      </View>

      <View style={styles.upcomingShifts}>
        <Text style={styles.sectionTitle}>Upcoming Shifts</Text>
        
        <UpcomingShift
          date="Today"
          time="2:00 PM - 10:00 PM"
          duration="8 hrs"
          status="scheduled"
        />
        <UpcomingShift
          date="Tomorrow"
          time="10:00 AM - 6:00 PM"
          duration="8 hrs"
          status="scheduled"
        />
        <UpcomingShift
          date="Friday"
          time="4:00 PM - 11:00 PM"
          duration="7 hrs"
          status="scheduled"
        />
        <UpcomingShift
          date="Saturday"
          time="11:00 AM - 7:00 PM"
          duration="8 hrs"
          status="scheduled"
        />
      </View>

      <View style={styles.recentShifts}>
        <Text style={styles.sectionTitle}>Recent Shifts</Text>
        
        <UpcomingShift
          date="Yesterday"
          time="2:00 PM - 10:00 PM"
          duration="8 hrs"
          status="completed"
        />
        <UpcomingShift
          date="Monday"
          time="10:00 AM - 6:00 PM"
          duration="8 hrs"
          status="completed"
        />
        <UpcomingShift
          date="Sunday"
          time="12:00 PM - 8:00 PM"
          duration="8 hrs"
          status="missed"
        />
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
  weekSummary: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  upcomingShifts: {
    padding: 20,
  },
  recentShifts: {
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
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  shiftDetails: {
    flex: 1,
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
  shiftRight: {
    alignItems: 'flex-end',
  },
  shiftDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shiftStatus: {
    fontSize: 12,
    marginTop: 2,
  },
});

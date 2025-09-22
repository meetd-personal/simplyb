import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import HRServiceFactory from '../../services/HRServiceFactory';
import { Schedule, WorkSession } from '../../services/HRService';

export default function MyScheduleScreen() {
  const { state } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClocingIn] = useState(false);

  useEffect(() => {
    loadData();
    // Check for active session on load
    checkActiveSession();
  }, [state.currentBusiness?.id, state.currentBusinessMember?.id]);

  const loadData = async () => {
    if (!state.currentBusiness?.id || !state.currentBusinessMember?.id) return;

    try {
      setLoading(true);
      const [schedulesData, sessionsData] = await Promise.all([
        HRServiceFactory.getEmployeeSchedules(state.currentBusiness.id, state.currentBusinessMember.id),
        HRServiceFactory.getWorkSessions(state.currentBusiness.id, state.currentBusinessMember.id)
      ]);

      setSchedules(schedulesData);
      setWorkSessions(sessionsData);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = () => {
    const activeSession = workSessions.find(session =>
      !session.clockOutTime &&
      session.clockInTime.toDateString() === new Date().toDateString()
    );
    setCurrentSession(activeSession || null);
  };

  const handleClockIn = async () => {
    if (!state.currentBusiness?.id || !state.currentBusinessMember?.id) return;

    try {
      setClocingIn(true);
      const session = await HRServiceFactory.clockIn(
        state.currentBusiness.id,
        state.currentBusinessMember.id
      );

      setCurrentSession(session);
      loadData(); // Refresh data
      Alert.alert('Success', 'Clocked in successfully!');
    } catch (error) {
      console.error('Error clocking in:', error);
      Alert.alert('Error', 'Failed to clock in. Please try again.');
    } finally {
      setClocingIn(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentSession) return;

    try {
      setClocingIn(true);
      await HRServiceFactory.clockOut(currentSession.id);

      setCurrentSession(null);
      loadData(); // Refresh data
      Alert.alert('Success', 'Clocked out successfully!');
    } catch (error) {
      console.error('Error clocking out:', error);
      Alert.alert('Error', 'Failed to clock out. Please try again.');
    } finally {
      setClocingIn(false);
    }
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    return `${hours} hrs`;
  };

  const calculateWeeklyHours = () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekSessions = workSessions.filter(session =>
      session.clockInTime >= weekStart && session.clockOutTime
    );

    const workedHours = weekSessions.reduce((total, session) => total + session.totalHours, 0);

    const weekSchedules = schedules.filter(schedule =>
      schedule.date >= weekStart
    );

    const scheduledHours = weekSchedules.reduce((total, schedule) => {
      const start = new Date(`2000-01-01T${schedule.startTime}`);
      const end = new Date(`2000-01-01T${schedule.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);

    return { scheduledHours, workedHours, remaining: Math.max(0, scheduledHours - workedHours) };
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  const weeklyHours = calculateWeeklyHours();
  const today = new Date();
  const upcomingSchedules = schedules.filter(schedule => schedule.date >= today);
  const pastSchedules = schedules.filter(schedule => schedule.date < today).slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Schedule</Text>
        <Text style={styles.subtitle}>View your work schedule and shifts</Text>
      </View>

      {/* Clock In/Out Status */}
      {currentSession && (
        <View style={styles.activeSessionContainer}>
          <View style={styles.activeSessionCard}>
            <View style={styles.activeSessionHeader}>
              <View style={styles.activeIndicator} />
              <Text style={styles.activeSessionTitle}>Currently Clocked In</Text>
            </View>
            <Text style={styles.activeSessionTime}>
              Started at {currentSession.clockInTime.toLocaleTimeString()}
            </Text>
            <Text style={styles.activeSessionDuration}>
              Duration: {Math.floor((new Date().getTime() - currentSession.clockInTime.getTime()) / (1000 * 60))} minutes
            </Text>
          </View>
        </View>
      )}

      <View style={styles.quickActionsContainer}>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[
              styles.clockAction,
              currentSession ? styles.clockOutAction : styles.clockInAction
            ]}
            onPress={currentSession ? handleClockOut : handleClockIn}
            disabled={clockingIn}
          >
            {clockingIn ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons
                  name={currentSession ? "stop-circle" : "play-circle"}
                  size={32}
                  color="white"
                />
                <Text style={styles.clockActionText}>
                  {currentSession ? "Clock Out" : "Clock In"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <QuickAction
            title="Request Time Off"
            icon="airplane"
            color="#FF9800"
            onPress={() => Alert.alert('Navigation', 'Navigate to Time Off Request screen')}
          />
        </View>
      </View>

      <View style={styles.weekSummary}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Scheduled Hours</Text>
            <Text style={styles.summaryValue}>{weeklyHours.scheduledHours.toFixed(1)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Worked Hours</Text>
            <Text style={styles.summaryValue}>{weeklyHours.workedHours.toFixed(1)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>{weeklyHours.remaining.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.upcomingShifts}>
        <Text style={styles.sectionTitle}>Upcoming Shifts</Text>

        {upcomingSchedules.length > 0 ? (
          upcomingSchedules.map(schedule => (
            <UpcomingShift
              key={schedule.id}
              date={schedule.date.toDateString() === today.toDateString() ? 'Today' :
                    schedule.date.toDateString() === new Date(today.getTime() + 86400000).toDateString() ? 'Tomorrow' :
                    schedule.date.toLocaleDateString()}
              time={`${schedule.startTime} - ${schedule.endTime}`}
              duration={formatDuration(schedule.startTime, schedule.endTime)}
              status={schedule.status === 'completed' ? 'completed' : 'scheduled'}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No upcoming shifts</Text>
            <Text style={styles.emptyStateSubtext}>
              Your upcoming shifts will appear here
            </Text>
          </View>
        )}
      </View>

      <View style={styles.recentShifts}>
        <Text style={styles.sectionTitle}>Recent Shifts</Text>

        {pastSchedules.length > 0 ? (
          pastSchedules.map(schedule => {
            const session = workSessions.find(s =>
              s.scheduleId === schedule.id ||
              s.clockInTime.toDateString() === schedule.date.toDateString()
            );

            return (
              <UpcomingShift
                key={schedule.id}
                date={schedule.date.toLocaleDateString()}
                time={`${schedule.startTime} - ${schedule.endTime}`}
                duration={session ? `${session.totalHours.toFixed(1)} hrs` : formatDuration(schedule.startTime, schedule.endTime)}
                status={session ? 'completed' : 'missed'}
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No recent shifts</Text>
            <Text style={styles.emptyStateSubtext}>
              Your completed shifts will appear here
            </Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  activeSessionContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  activeSessionCard: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  activeSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  activeSessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  activeSessionTime: {
    fontSize: 14,
    color: '#388e3c',
    marginBottom: 2,
  },
  activeSessionDuration: {
    fontSize: 14,
    color: '#388e3c',
  },
  clockAction: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  clockInAction: {
    backgroundColor: '#4CAF50',
  },
  clockOutAction: {
    backgroundColor: '#f44336',
  },
  clockActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
});

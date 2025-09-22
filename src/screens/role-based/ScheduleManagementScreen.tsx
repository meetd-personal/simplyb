import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import HRServiceFactory from '../../services/HRServiceFactory';
import { Schedule, Employee } from '../../services/HRService';
import NotificationService from '../../services/NotificationService';

export default function ScheduleManagementScreen() {
  const { state } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    employeeId: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 30,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [state.currentBusiness?.id]);

  const loadData = async () => {
    if (!state.currentBusiness?.id) return;

    try {
      setLoading(true);
      const [schedulesData, employeesData] = await Promise.all([
        HRServiceFactory.getSchedules(state.currentBusiness.id, getWeekStart(), getWeekEnd()),
        HRServiceFactory.getEmployees(state.currentBusiness.id)
      ]);

      setSchedules(schedulesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = () => {
    const start = new Date(selectedWeek);
    start.setDate(start.getDate() - start.getDay());
    return start;
  };

  const getWeekEnd = () => {
    const end = new Date(selectedWeek);
    end.setDate(end.getDate() - end.getDay() + 6);
    return end;
  };

  const handleCreateSchedule = async () => {
    if (!state.currentBusiness?.id || !state.user?.id) return;

    try {
      await HRServiceFactory.createSchedule({
        businessId: state.currentBusiness.id,
        employeeId: newSchedule.employeeId,
        date: newSchedule.date,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        breakDuration: newSchedule.breakDuration,
        notes: newSchedule.notes,
        status: 'scheduled',
        createdBy: state.user.id,
      });

      // Send notification to employee
      const employee = employees.find(emp => emp.id === newSchedule.employeeId);
      if (employee) {
        await NotificationService.notifyScheduleUpdate(
          `${employee.firstName} ${employee.lastName}`,
          newSchedule.date.toLocaleDateString(),
          state.currentBusiness.id
        );
      }

      setShowCreateModal(false);
      loadData();
      Alert.alert('Success', 'Schedule created successfully');
    } catch (error) {
      console.error('Error creating schedule:', error);
      Alert.alert('Error', 'Failed to create schedule');
    }
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
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule Management</Text>
        <Text style={styles.subtitle}>Manage employee schedules and shifts</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Create Schedule"
            icon="calendar"
            color="#4CAF50"
            onPress={() => setShowCreateModal(true)}
          />
          <QuickAction
            title="View All Schedules"
            icon="list"
            color="#2196F3"
            onPress={() => loadData()}
          />
          <QuickAction
            title="Time Off Requests"
            icon="airplane"
            color="#FF9800"
            onPress={() => Alert.alert('Coming Soon', 'Time off management will be available soon')}
          />
          <QuickAction
            title="Shift Templates"
            icon="copy"
            color="#9C27B0"
            onPress={() => Alert.alert('Coming Soon', 'Shift templates will be available soon')}
          />
        </View>
      </View>

      {/* Current Week Schedules */}
      <View style={styles.schedulesContainer}>
        <Text style={styles.sectionTitle}>This Week's Schedules</Text>
        {schedules.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No schedules for this week</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>Create First Schedule</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedules.map(schedule => (
            <View key={schedule.id} style={styles.scheduleItem}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleDate}>
                  {schedule.date.toLocaleDateString()}
                </Text>
                <Text style={styles.scheduleTime}>
                  {schedule.startTime} - {schedule.endTime}
                </Text>
              </View>
              <Text style={styles.scheduleEmployee}>
                {employees.find(emp => emp.id === schedule.employeeId)?.firstName} {employees.find(emp => emp.id === schedule.employeeId)?.lastName}
              </Text>
              {schedule.notes && (
                <Text style={styles.scheduleNotes}>{schedule.notes}</Text>
              )}
            </View>
          ))
        )}
      </View>

      {/* Create Schedule Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Schedule</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Employee</Text>
              <View style={styles.pickerContainer}>
                {employees.map(employee => (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.employeeOption,
                      newSchedule.employeeId === employee.id && styles.selectedEmployee
                    ]}
                    onPress={() => setNewSchedule(prev => ({ ...prev, employeeId: employee.id }))}
                  >
                    <Text style={styles.employeeOptionText}>
                      {employee.firstName} {employee.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={newSchedule.startTime}
                onChangeText={(text) => setNewSchedule(prev => ({ ...prev, startTime: text }))}
                placeholder="09:00"
              />

              <Text style={styles.inputLabel}>End Time</Text>
              <TextInput
                style={styles.input}
                value={newSchedule.endTime}
                onChangeText={(text) => setNewSchedule(prev => ({ ...prev, endTime: text }))}
                placeholder="17:00"
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newSchedule.notes}
                onChangeText={(text) => setNewSchedule(prev => ({ ...prev, notes: text }))}
                placeholder="Additional notes..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createScheduleButton}
                onPress={handleCreateSchedule}
                disabled={!newSchedule.employeeId}
              >
                <Text style={styles.createScheduleButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  comingSoonContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
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
  schedulesContainer: {
    padding: 20,
  },
  scheduleItem: {
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
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  scheduleDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleTime: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  scheduleEmployee: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  scheduleNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  employeeOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedEmployee: {
    backgroundColor: '#e3f2fd',
  },
  employeeOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  createScheduleButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  createScheduleButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

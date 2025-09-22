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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import HRServiceFactory from '../../services/HRServiceFactory';
import { PayrollPeriod, PayrollEntry, Employee } from '../../services/HRService';

export default function PayrollManagementScreen() {
  const { state } = useAuth();
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHourlyRateModal, setShowHourlyRateModal] = useState(false);
  const [showPayPeriodModal, setShowPayPeriodModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newHourlyRate, setNewHourlyRate] = useState('');
  const [newOvertimeRate, setNewOvertimeRate] = useState('');

  useEffect(() => {
    loadData();
  }, [state.currentBusiness?.id]);

  const loadData = async () => {
    if (!state.currentBusiness?.id) return;

    try {
      setLoading(true);
      const [periodsData, entriesData, employeesData] = await Promise.all([
        HRServiceFactory.getPayrollPeriods(state.currentBusiness.id),
        HRServiceFactory.getPayrollEntries(state.currentBusiness.id),
        HRServiceFactory.getEmployees(state.currentBusiness.id)
      ]);

      setPayrollPeriods(periodsData);
      setPayrollEntries(entriesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading payroll data:', error);
      Alert.alert('Error', 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleUpdateHourlyRate = async () => {
    if (!selectedEmployee || !newHourlyRate) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return;
    }

    try {
      await HRServiceFactory.updateEmployeeHourlyRate(
        selectedEmployee.id,
        parseFloat(newHourlyRate),
        newOvertimeRate ? parseFloat(newOvertimeRate) : undefined
      );

      setShowHourlyRateModal(false);
      setSelectedEmployee(null);
      setNewHourlyRate('');
      setNewOvertimeRate('');
      loadData();
      Alert.alert('Success', 'Hourly rate updated successfully');
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      Alert.alert('Error', 'Failed to update hourly rate');
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
        <Text style={styles.loadingText}>Loading payroll data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payroll Management</Text>
        <Text style={styles.subtitle}>Manage employee pay and hours</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            title="Set Hourly Pay"
            icon="card"
            color="#4CAF50"
            onPress={() => setShowHourlyRateModal(true)}
          />
          <QuickAction
            title="View Hours"
            icon="time"
            color="#2196F3"
            onPress={() => {
              // Navigate to hours tracking view
              const totalHours = payrollEntries.reduce((sum, entry) => sum + entry.regularHours + entry.overtimeHours, 0);
              Alert.alert('Total Hours', `Total hours across all employees: ${totalHours.toFixed(1)} hours`);
            }}
          />
          <QuickAction
            title="Pay Periods"
            icon="calendar"
            color="#FF9800"
            onPress={() => setShowPayPeriodModal(true)}
          />
          <QuickAction
            title="Reports"
            icon="document-text"
            color="#9C27B0"
            onPress={() => {
              const totalPayroll = payrollEntries.reduce((sum, entry) => sum + entry.grossPay, 0);
              Alert.alert('Payroll Summary', `Total payroll: ${formatCurrency(totalPayroll)}`);
            }}
          />
        </View>
      </View>

      {/* Current Pay Period */}
      <View style={styles.currentPeriodContainer}>
        <Text style={styles.sectionTitle}>Current Pay Period</Text>
        {payrollPeriods.length > 0 ? (
          <View style={styles.currentPeriodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodTitle}>
                {payrollPeriods[0].startDate.toLocaleDateString()} - {payrollPeriods[0].endDate.toLocaleDateString()}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payrollPeriods[0].status) }]}>
                <Text style={styles.statusText}>
                  {payrollPeriods[0].status.charAt(0).toUpperCase() + payrollPeriods[0].status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Employees</Text>
                <Text style={styles.statValue}>{employees.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Hours</Text>
                <Text style={styles.statValue}>
                  {payrollEntries.reduce((sum, entry) => sum + entry.regularHours + entry.overtimeHours, 0).toFixed(1)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Payroll</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(payrollEntries.reduce((sum, entry) => sum + entry.grossPay, 0))}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No pay periods found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowPayPeriodModal(true)}
            >
              <Text style={styles.createButtonText}>Create Pay Period</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Employee Payroll Entries */}
      <View style={styles.entriesContainer}>
        <Text style={styles.sectionTitle}>Employee Payroll</Text>
        {payrollEntries.length > 0 ? (
          payrollEntries.map(entry => {
            const employee = employees.find(emp => emp.id === entry.employeeId);
            return (
              <View key={entry.id} style={styles.entryItem}>
                <View style={styles.entryHeader}>
                  <Text style={styles.employeeName}>
                    {employee?.firstName} {employee?.lastName}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entry.status) }]}>
                    <Text style={styles.statusText}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Regular Hours:</Text>
                    <Text style={styles.statValue}>{entry.regularHours}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Overtime Hours:</Text>
                    <Text style={styles.statValue}>{entry.overtimeHours}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Gross Pay:</Text>
                    <Text style={styles.statValue}>{formatCurrency(entry.grossPay)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Net Pay:</Text>
                    <Text style={[styles.statValue, styles.netPay]}>{formatCurrency(entry.netPay)}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No payroll entries found</Text>
            <Text style={styles.emptyStateSubtext}>
              Payroll entries will appear here once employees log hours
            </Text>
          </View>
        )}
      </View>

      {/* Hourly Rate Modal */}
      <Modal
        visible={showHourlyRateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHourlyRateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Hourly Rate</Text>
              <TouchableOpacity onPress={() => setShowHourlyRateModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Employee</Text>
              <View style={styles.employeeList}>
                {employees.map(employee => (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.employeeOption,
                      selectedEmployee?.id === employee.id && styles.selectedEmployee
                    ]}
                    onPress={() => setSelectedEmployee(employee)}
                  >
                    <Text style={styles.employeeOptionText}>
                      {employee.firstName} {employee.lastName}
                    </Text>
                    <Text style={styles.currentRate}>
                      Current: {formatCurrency(employee.hourlyRate || 0)}/hr
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedEmployee && (
                <>
                  <Text style={styles.inputLabel}>New Hourly Rate</Text>
                  <TextInput
                    style={styles.input}
                    value={newHourlyRate}
                    onChangeText={setNewHourlyRate}
                    placeholder="15.00"
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.inputLabel}>Overtime Rate (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newOvertimeRate}
                    onChangeText={setNewOvertimeRate}
                    placeholder="22.50"
                    keyboardType="decimal-pad"
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowHourlyRateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateHourlyRate}
                disabled={!selectedEmployee || !newHourlyRate}
              >
                <Text style={styles.saveButtonText}>Update Rate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pay Period Modal */}
      <Modal
        visible={showPayPeriodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay Periods</Text>
              <TouchableOpacity onPress={() => setShowPayPeriodModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {payrollPeriods.map(period => (
                <View key={period.id} style={styles.periodItem}>
                  <View style={styles.periodItemHeader}>
                    <Text style={styles.periodItemTitle}>
                      {period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(period.status) }]}>
                      <Text style={styles.statusText}>
                        {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {payrollPeriods.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No pay periods created yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Pay periods will be created automatically based on your business settings
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': case 'approved': case 'paid': return '#4CAF50';
      case 'current': case 'draft': return '#2196F3';
      default: return '#FF9800';
    }
  }
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
  currentPeriodContainer: {
    padding: 20,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 15,
  },
  createButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  entriesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  entryItem: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  entryStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPay: {
    color: '#4CAF50',
    fontSize: 16,
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
  employeeList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  employeeOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedEmployee: {
    backgroundColor: '#e3f2fd',
  },
  employeeOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  currentRate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
  saveButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  periodItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  periodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

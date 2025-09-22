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
import { TimeOffRequest, Employee } from '../../services/HRService';

export default function TimeOffApprovalScreen() {
  const { state } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [state.currentBusiness?.id]);

  const loadData = async () => {
    if (!state.currentBusiness?.id) return;
    
    try {
      setLoading(true);
      const [requestsData, employeesData] = await Promise.all([
        HRServiceFactory.getTimeOffRequests(state.currentBusiness.id),
        HRServiceFactory.getEmployees(state.currentBusiness.id)
      ]);
      
      setRequests(requestsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading time off requests:', error);
      Alert.alert('Error', 'Failed to load time off requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!state.user?.id) return;
    
    try {
      setProcessing(requestId);
      await HRServiceFactory.approveTimeOffRequest(requestId, state.user.id);
      loadData();
      Alert.alert('Success', 'Time off request approved');
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (requestId: string) => {
    if (!state.user?.id) return;
    
    try {
      setProcessing(requestId);
      await HRServiceFactory.denyTimeOffRequest(requestId, state.user.id);
      loadData();
      Alert.alert('Success', 'Time off request denied');
    } catch (error) {
      console.error('Error denying request:', error);
      Alert.alert('Error', 'Failed to deny request');
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApproval = async () => {
    if (!state.user?.id || selectedRequests.length === 0) return;
    
    try {
      setProcessing('bulk');
      await Promise.all(
        selectedRequests.map(requestId => 
          HRServiceFactory.approveTimeOffRequest(requestId, state.user!.id)
        )
      );
      
      setSelectedRequests([]);
      setShowBulkModal(false);
      loadData();
      Alert.alert('Success', `${selectedRequests.length} requests approved`);
    } catch (error) {
      console.error('Error bulk approving requests:', error);
      Alert.alert('Error', 'Failed to approve some requests');
    } finally {
      setProcessing(null);
    }
  };

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'denied': return '#f44336';
      default: return '#FF9800';
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading time off requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Off Approvals</Text>
        <Text style={styles.subtitle}>Review and approve employee time off requests</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingRequests.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests.filter(r => r.status === 'approved').length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests.filter(r => r.status === 'denied').length}</Text>
          <Text style={styles.statLabel}>Denied</Text>
        </View>
      </View>

      {/* Bulk Actions */}
      {pendingRequests.length > 0 && (
        <View style={styles.bulkActionsContainer}>
          <TouchableOpacity
            style={styles.bulkActionButton}
            onPress={() => setShowBulkModal(true)}
          >
            <Ionicons name="checkmark-done" size={20} color="#4CAF50" />
            <Text style={styles.bulkActionText}>Bulk Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pending Requests */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Pending Requests ({pendingRequests.length})</Text>
        
        {pendingRequests.length > 0 ? (
          pendingRequests.map(request => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.employeeName}>{getEmployeeName(request.employeeId)}</Text>
                  <Text style={styles.requestType}>
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    selectedRequests.includes(request.id) && styles.selectedButton
                  ]}
                  onPress={() => toggleRequestSelection(request.id)}
                >
                  <Ionicons 
                    name={selectedRequests.includes(request.id) ? "checkmark" : "add"} 
                    size={16} 
                    color={selectedRequests.includes(request.id) ? "white" : "#666"} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.requestDetails}>
                <Text style={styles.requestDates}>
                  {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
                </Text>
                <Text style={styles.requestReason}>{request.reason}</Text>
                <Text style={styles.requestSubmitted}>
                  Submitted {request.createdAt.toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.denyButton]}
                  onPress={() => handleDeny(request.id)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="close" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Deny</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(request.id)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No pending requests</Text>
            <Text style={styles.emptyStateSubtext}>
              All time off requests have been processed
            </Text>
          </View>
        )}
      </View>

      {/* Processed Requests */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Recent Decisions ({processedRequests.length})</Text>
        
        {processedRequests.slice(0, 10).map(request => (
          <View key={request.id} style={styles.processedRequestCard}>
            <View style={styles.processedRequestHeader}>
              <Text style={styles.employeeName}>{getEmployeeName(request.employeeId)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                <Text style={styles.statusText}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.requestDates}>
              {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
            </Text>
            <Text style={styles.requestType}>
              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} • {request.reason}
            </Text>
            
            {request.approvedAt && (
              <Text style={styles.processedDate}>
                {request.status === 'approved' ? 'Approved' : 'Denied'} on {request.approvedAt.toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Bulk Approval Modal */}
      <Modal
        visible={showBulkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBulkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bulk Approve Requests</Text>
              <TouchableOpacity onPress={() => setShowBulkModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Are you sure you want to approve {selectedRequests.length} selected time off requests?
              </Text>
              
              <View style={styles.selectedRequestsList}>
                {selectedRequests.map(requestId => {
                  const request = requests.find(r => r.id === requestId);
                  return request ? (
                    <Text key={requestId} style={styles.selectedRequestItem}>
                      • {getEmployeeName(request.employeeId)} - {request.type}
                    </Text>
                  ) : null;
                })}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBulkModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleBulkApproval}
                disabled={processing === 'bulk'}
              >
                {processing === 'bulk' ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Approve All</Text>
                )}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bulkActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  bulkActionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  requestType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  selectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  requestDetails: {
    marginBottom: 20,
  },
  requestDates: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requestReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  requestSubmitted: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  denyButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processedRequestCard: {
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
  processedRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  processedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 8,
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
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  selectedRequestsList: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  selectedRequestItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  confirmButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TimeOffRequestScreen() {
  const [selectedType, setSelectedType] = useState<'vacation' | 'sick' | 'personal' | null>(null);
  const [reason, setReason] = useState('');

  const TimeOffRequest = ({ 
    date, 
    type, 
    status,
    reason
  }: {
    date: string;
    type: string;
    status: 'pending' | 'approved' | 'denied';
    reason: string;
  }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'approved': return '#4CAF50';
        case 'denied': return '#F44336';
        default: return '#FF9800';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'approved': return 'checkmark-circle';
        case 'denied': return 'close-circle';
        default: return 'time';
      }
    };

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestLeft}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={24} 
            color={getStatusColor()} 
          />
          <View style={styles.requestDetails}>
            <Text style={styles.requestDate}>{date}</Text>
            <Text style={styles.requestType}>{type}</Text>
            <Text style={styles.requestReason}>{reason}</Text>
          </View>
        </View>
        <View style={styles.requestRight}>
          <Text style={[styles.requestStatus, { color: getStatusColor() }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>
    );
  };

  const TypeButton = ({ 
    type, 
    label, 
    icon 
  }: {
    type: 'vacation' | 'sick' | 'personal';
    label: string;
    icon: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        selectedType === type && styles.typeButtonActive
      ]}
      onPress={() => setSelectedType(type)}
    >
      <Ionicons 
        name={icon as any} 
        size={24} 
        color={selectedType === type ? 'white' : '#666'} 
      />
      <Text style={[
        styles.typeButtonText,
        selectedType === type && styles.typeButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleSubmitRequest = () => {
    if (!selectedType || !reason.trim()) {
      Alert.alert('Error', 'Please select a type and provide a reason for your request');
      return;
    }

    Alert.alert(
      'Request Submitted',
      'Your time off request has been submitted and is pending approval.',
      [
        {
          text: 'OK',
          onPress: () => {
            setSelectedType(null);
            setReason('');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Off Requests</Text>
        <Text style={styles.subtitle}>Request time off and view status</Text>
      </View>

      {/* New Request Form */}
      <View style={styles.newRequestContainer}>
        <Text style={styles.sectionTitle}>New Request</Text>
        
        <View style={styles.typeSelection}>
          <Text style={styles.label}>Type of Request</Text>
          <View style={styles.typeButtons}>
            <TypeButton type="vacation" label="Vacation" icon="sunny" />
            <TypeButton type="sick" label="Sick Leave" icon="medical" />
            <TypeButton type="personal" label="Personal" icon="person" />
          </View>
        </View>

        <View style={styles.reasonContainer}>
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={styles.reasonInput}
            value={reason}
            onChangeText={setReason}
            placeholder="Please provide a reason for your request..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedType || !reason.trim()) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitRequest}
          disabled={!selectedType || !reason.trim()}
        >
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>
      </View>

      {/* Request History */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Request History</Text>
        
        <TimeOffRequest
          date="March 15-17, 2024"
          type="Vacation"
          status="pending"
          reason="Family vacation"
        />
        
        <TimeOffRequest
          date="March 8, 2024"
          type="Sick Leave"
          status="approved"
          reason="Doctor appointment"
        />
        
        <TimeOffRequest
          date="February 28, 2024"
          type="Personal"
          status="approved"
          reason="Personal matters"
        />
        
        <TimeOffRequest
          date="February 14, 2024"
          type="Vacation"
          status="denied"
          reason="Valentine's Day celebration"
        />
      </View>

      {/* Guidelines */}
      <View style={styles.guidelinesContainer}>
        <Text style={styles.sectionTitle}>Guidelines</Text>
        <View style={styles.guidelineCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <View style={styles.guidelineContent}>
            <Text style={styles.guidelineTitle}>Time Off Policy</Text>
            <Text style={styles.guidelineText}>
              • Submit requests at least 2 weeks in advance{'\n'}
              • Vacation requests require manager approval{'\n'}
              • Sick leave can be requested same day{'\n'}
              • Personal time off requires 1 week notice
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
  newRequestContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  typeSelection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  reasonContainer: {
    marginBottom: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    padding: 20,
    paddingTop: 0,
  },
  requestItem: {
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
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestDetails: {
    marginLeft: 12,
    flex: 1,
  },
  requestDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  requestType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestReason: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  requestRight: {
    alignItems: 'flex-end',
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  guidelinesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  guidelineCard: {
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
  guidelineContent: {
    marginLeft: 15,
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

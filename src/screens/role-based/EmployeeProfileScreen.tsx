import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function EmployeeProfileScreen() {
  const { state } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [scheduleNotifications, setScheduleNotifications] = useState(true);
  const [payrollNotifications, setPayrollNotifications] = useState(true);

  const [profileData, setProfileData] = useState({
    firstName: state.user?.firstName || '',
    lastName: state.user?.lastName || '',
    email: state.user?.email || '',
    phone: '(555) 123-4567',
    address: '123 Main St, City, State 12345',
    emergencyContact: 'Jane Doe - (555) 987-6543',
  });

  const handleSave = () => {
    Alert.alert(
      'Profile Updated',
      'Your profile information has been updated successfully.',
      [{ text: 'OK', onPress: () => setIsEditing(false) }]
    );
  };

  const ProfileField = ({ 
    label, 
    value, 
    onChangeText, 
    editable = true,
    keyboardType = 'default' as any
  }: {
    label: string;
    value: string;
    onChangeText?: (text: string) => void;
    editable?: boolean;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
        thumbColor={value ? 'white' : '#f4f3f4'}
      />
    </View>
  );

  const ActionButton = ({ 
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
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={[styles.actionButtonText, { color }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage your personal information</Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <Ionicons 
            name={isEditing ? 'checkmark' : 'pencil'} 
            size={20} 
            color={isEditing ? '#4CAF50' : '#007AFF'} 
          />
          <Text style={[
            styles.editButtonText, 
            { color: isEditing ? '#4CAF50' : '#007AFF' }
          ]}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.sectionCard}>
          <ProfileField
            label="First Name"
            value={profileData.firstName}
            onChangeText={(text) => setProfileData({...profileData, firstName: text})}
          />
          <ProfileField
            label="Last Name"
            value={profileData.lastName}
            onChangeText={(text) => setProfileData({...profileData, lastName: text})}
          />
          <ProfileField
            label="Email"
            value={profileData.email}
            onChangeText={(text) => setProfileData({...profileData, email: text})}
            keyboardType="email-address"
            editable={false}
          />
          <ProfileField
            label="Phone"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({...profileData, phone: text})}
            keyboardType="phone-pad"
          />
          <ProfileField
            label="Address"
            value={profileData.address}
            onChangeText={(text) => setProfileData({...profileData, address: text})}
          />
          <ProfileField
            label="Emergency Contact"
            value={profileData.emergencyContact}
            onChangeText={(text) => setProfileData({...profileData, emergencyContact: text})}
          />
        </View>
      </View>

      {/* Work Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Information</Text>
        <View style={styles.sectionCard}>
          <ProfileField
            label="Business"
            value={state.currentBusiness?.name || 'N/A'}
            editable={false}
          />
          <ProfileField
            label="Role"
            value="Team Member"
            editable={false}
          />
          <ProfileField
            label="Employee ID"
            value="EMP-001"
            editable={false}
          />
          <ProfileField
            label="Start Date"
            value="January 15, 2024"
            editable={false}
          />
        </View>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <View style={styles.sectionCard}>
          <SettingRow
            title="Push Notifications"
            subtitle="Receive app notifications"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <SettingRow
            title="Schedule Updates"
            subtitle="Notify about schedule changes"
            value={scheduleNotifications}
            onValueChange={setScheduleNotifications}
          />
          <SettingRow
            title="Payroll Notifications"
            subtitle="Notify about pay and hours"
            value={payrollNotifications}
            onValueChange={setPayrollNotifications}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.sectionCard}>
          <ActionButton
            title="Change Password"
            icon="lock-closed"
            color="#2196F3"
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon')}
          />
          <ActionButton
            title="Download Pay Stubs"
            icon="download"
            color="#4CAF50"
            onPress={() => Alert.alert('Coming Soon', 'Pay stub download will be available soon')}
          />
          <ActionButton
            title="View Work History"
            icon="time"
            color="#FF9800"
            onPress={() => Alert.alert('Coming Soon', 'Work history will be available soon')}
          />
          <ActionButton
            title="Contact HR"
            icon="mail"
            color="#9C27B0"
            onPress={() => Alert.alert('Contact HR', 'Please contact your manager or HR department')}
          />
        </View>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.sectionCard}>
          <ProfileField
            label="App Version"
            value="1.0.0"
            editable={false}
          />
          <ProfileField
            label="Last Updated"
            value="March 10, 2024"
            editable={false}
          />
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  fieldInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
    flex: 1,
  },
});

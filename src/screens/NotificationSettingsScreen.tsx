import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import NotificationService, { NotificationPreferences } from '../services/NotificationService';

export default function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    timeOffRequests: true,
    scheduleUpdates: true,
    payrollNotifications: true,
    clockReminders: true,
    generalNotifications: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const currentPreferences = NotificationService.getPreferences();
    setPreferences(currentPreferences);
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await NotificationService.updatePreferences({ [key]: value });
  };

  const updateQuietHours = async (key: keyof NotificationPreferences['quietHours'], value: any) => {
    const newQuietHours = { ...preferences.quietHours, [key]: value };
    const newPreferences = { ...preferences, quietHours: newQuietHours };
    setPreferences(newPreferences);
    await NotificationService.updatePreferences({ quietHours: newQuietHours });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleTimeChange = (event: any, selectedTime: Date | undefined, isStartTime: boolean) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }

    if (selectedTime) {
      const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      updateQuietHours(isStartTime ? 'startTime' : 'endTime', timeString);
    }
  };

  const testNotification = async () => {
    await NotificationService.sendLocalNotification({
      type: 'general',
      title: 'Test Notification',
      body: 'This is a test notification to verify your settings are working correctly.',
    });
    Alert.alert('Test Sent', 'A test notification has been sent. Check your notification panel.');
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    icon 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  const TimePickerRow = ({ 
    title, 
    time, 
    onPress 
  }: {
    title: string;
    time: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.timePickerRow} onPress={onPress}>
      <Text style={styles.timePickerTitle}>{title}</Text>
      <View style={styles.timePickerValue}>
        <Text style={styles.timePickerTime}>{formatTime(time)}</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>Manage your notification preferences</Text>
      </View>

      {/* Test Notification */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.testButton} onPress={testNotification}>
          <Ionicons name="notifications-outline" size={20} color="#007AFF" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        
        <SettingRow
          title="Time Off Requests"
          subtitle="Get notified about new time off requests and approvals"
          value={preferences.timeOffRequests}
          onValueChange={(value) => updatePreference('timeOffRequests', value)}
          icon="airplane"
        />
        
        <SettingRow
          title="Schedule Updates"
          subtitle="Get notified when your schedule changes"
          value={preferences.scheduleUpdates}
          onValueChange={(value) => updatePreference('scheduleUpdates', value)}
          icon="calendar"
        />
        
        <SettingRow
          title="Payroll Notifications"
          subtitle="Get notified when payroll is ready"
          value={preferences.payrollNotifications}
          onValueChange={(value) => updatePreference('payrollNotifications', value)}
          icon="card"
        />
        
        <SettingRow
          title="Clock Reminders"
          subtitle="Get reminded to clock in and out"
          value={preferences.clockReminders}
          onValueChange={(value) => updatePreference('clockReminders', value)}
          icon="time"
        />
        
        <SettingRow
          title="General Notifications"
          subtitle="Get general app notifications and updates"
          value={preferences.generalNotifications}
          onValueChange={(value) => updatePreference('generalNotifications', value)}
          icon="notifications"
        />
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <Text style={styles.sectionDescription}>
          Disable notifications during specific hours
        </Text>
        
        <SettingRow
          title="Enable Quiet Hours"
          subtitle="Mute notifications during quiet hours"
          value={preferences.quietHours.enabled}
          onValueChange={(value) => updateQuietHours('enabled', value)}
          icon="moon"
        />
        
        {preferences.quietHours.enabled && (
          <View style={styles.quietHoursContainer}>
            <TimePickerRow
              title="Start Time"
              time={preferences.quietHours.startTime}
              onPress={() => setShowStartTimePicker(true)}
            />
            
            <TimePickerRow
              title="End Time"
              time={preferences.quietHours.endTime}
              onPress={() => setShowEndTimePicker(true)}
            />
          </View>
        )}
      </View>

      {/* Permission Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Notification Permissions</Text>
            <Text style={styles.infoDescription}>
              If you're not receiving notifications, check your device settings to ensure 
              notifications are enabled for this app.
            </Text>
          </View>
        </View>
      </View>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${preferences.quietHours.startTime}:00`)}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event, time) => handleTimeChange(event, time, true)}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${preferences.quietHours.endTime}:00`)}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event, time) => handleTimeChange(event, time, false)}
        />
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
  section: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  quietHoursContainer: {
    paddingTop: 10,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timePickerTitle: {
    fontSize: 16,
    color: '#333',
  },
  timePickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePickerTime: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 8,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    borderRadius: 8,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

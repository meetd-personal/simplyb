import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationData {
  type: 'time_off_request' | 'schedule_update' | 'payroll_ready' | 'clock_reminder' | 'general';
  title: string;
  body: string;
  data?: any;
  businessId?: string;
  userId?: string;
}

export interface NotificationPreferences {
  timeOffRequests: boolean;
  scheduleUpdates: boolean;
  payrollNotifications: boolean;
  clockReminders: boolean;
  generalNotifications: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
}

class NotificationService {
  private expoPushToken: string | null = null;
  private preferences: NotificationPreferences = {
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
  };

  async initialize(): Promise<void> {
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Load preferences
    await this.loadPreferences();

    // Register for push notifications
    await this.registerForPushNotifications();
  }

  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with actual project ID
      });
      
      this.expoPushToken = token.data;
      console.log('Push token:', token.data);
      
      // Store token for server-side notifications
      await AsyncStorage.setItem('expoPushToken', token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    // Check if notification type is enabled
    if (!this.isNotificationTypeEnabled(notification.type)) {
      return;
    }

    // Check quiet hours
    if (this.isQuietHours()) {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    if (!this.isNotificationTypeEnabled(notification.type)) {
      return null;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: true,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // HR-specific notification methods
  async notifyTimeOffRequest(
    managerName: string,
    employeeName: string,
    requestType: string,
    businessId: string
  ): Promise<void> {
    await this.sendLocalNotification({
      type: 'time_off_request',
      title: 'New Time Off Request',
      body: `${employeeName} has requested ${requestType} time off`,
      data: {
        type: 'time_off_request',
        businessId,
        employeeName,
        requestType,
      },
      businessId,
    });
  }

  async notifyScheduleUpdate(
    employeeName: string,
    scheduleDate: string,
    businessId: string
  ): Promise<void> {
    await this.sendLocalNotification({
      type: 'schedule_update',
      title: 'Schedule Updated',
      body: `Your schedule for ${scheduleDate} has been updated`,
      data: {
        type: 'schedule_update',
        businessId,
        scheduleDate,
      },
      businessId,
    });
  }

  async notifyPayrollReady(
    employeeName: string,
    payPeriod: string,
    businessId: string
  ): Promise<void> {
    await this.sendLocalNotification({
      type: 'payroll_ready',
      title: 'Payroll Ready',
      body: `Your payroll for ${payPeriod} is ready for review`,
      data: {
        type: 'payroll_ready',
        businessId,
        payPeriod,
      },
      businessId,
    });
  }

  async scheduleClockReminder(
    reminderTime: Date,
    message: string,
    businessId: string
  ): Promise<string | null> {
    return await this.scheduleNotification(
      {
        type: 'clock_reminder',
        title: 'Clock In Reminder',
        body: message,
        data: {
          type: 'clock_reminder',
          businessId,
        },
        businessId,
      },
      {
        date: reminderTime,
      }
    );
  }

  // Preference management
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }

  async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notificationPreferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Helper methods
  private isNotificationTypeEnabled(type: NotificationData['type']): boolean {
    switch (type) {
      case 'time_off_request':
        return this.preferences.timeOffRequests;
      case 'schedule_update':
        return this.preferences.scheduleUpdates;
      case 'payroll_ready':
        return this.preferences.payrollNotifications;
      case 'clock_reminder':
        return this.preferences.clockReminders;
      case 'general':
        return this.preferences.generalNotifications;
      default:
        return true;
    }
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = this.preferences.quietHours;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  // Get push token for server-side notifications
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Badge management
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }
}

export default new NotificationService();

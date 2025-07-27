import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import DangerZone from '../components/DangerZone';
import ComingSoonModal from '../components/ComingSoonModal';
import DatabaseService from '../services/DatabaseServiceFactory';
import RoleTestingComponent from '../components/RoleTestingComponent';
import RoleBasedPermissionService from '../services/RoleBasedPermissionService';
import { Permission } from '../types/permissions';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: Props) {
  const { state: authState, refreshBusinesses } = useAuth();
  const [showDeveloperSection, setShowDeveloperSection] = useState(__DEV__);
  const [showRoleTesting, setShowRoleTesting] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState<{
    visible: boolean;
    title: string;
    description: string;
    icon: string;
    estimatedRelease?: string;
  }>({
    visible: false,
    title: '',
    description: '',
    icon: '',
    estimatedRelease: 'Q2 2025'
  });

  // Check if user is business owner from current business role
  const isOwner = authState.currentUserRole === 'OWNER';

  // Helper function to show coming soon modal
  const showComingSoon = (title: string, description: string, icon: string, estimatedRelease?: string) => {
    setComingSoonModal({
      visible: true,
      title,
      description,
      icon,
      estimatedRelease: estimatedRelease || 'Q2 2025'
    });
  };

  const hideComingSoon = () => {
    setComingSoonModal(prev => ({ ...prev, visible: false }));
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will be available in a future update. You will be able to export your data as CSV or PDF.',
      [{ text: 'OK' }]
    );
  };

  const handleBackupData = () => {
    Alert.alert(
      'Backup Data',
      'This feature will be available in a future update. You will be able to backup your data to cloud storage.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Simply',
      'Simply v1.0.0\n\nA simplified business tracker app for small businesses to track revenue, expenses, and financial statistics.\n\nBuilt with React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  const handleIntegrations = () => {
    navigation.navigate('Integrations');
  };

  const handleManageTeam = () => {
    navigation.navigate('ManageTeam');
  };

  const handleBusinessManagement = () => {
    Alert.alert(
      'Business Management',
      'Switch between businesses or create new ones.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Business',
          onPress: () => {
            // Navigate to business selection with current user's businesses
            if (authState.user) {
              navigation.navigate('BusinessSelection', {
                businesses: authState.businesses.map(business => ({
                  ...business,
                  createdAt: business.createdAt instanceof Date ? business.createdAt.toISOString() : business.createdAt,
                  updatedAt: business.updatedAt instanceof Date ? business.updatedAt.toISOString() : business.updatedAt,
                })),
                userId: authState.user.id,
                source: 'settings' // Indicate this came from settings
              });
            }
          }
        },
        {
          text: 'Create New',
          onPress: () => {
            if (authState.user) {
              navigation.navigate('CreateBusiness', {
                userId: authState.user.id
              });
            }
          }
        }
      ]
    );
  };

  const handleBusinessDeleted = async () => {
    try {
      // Refresh businesses to get updated list
      await refreshBusinesses();

      // Force logout and let the auth flow handle routing
      // This ensures the user goes through proper authentication flow
      // which will route them to BusinessOnboarding or BusinessSelection based on their businesses
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error handling business deletion:', error);
      // Fallback to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleCleanupOrphanedUser = () => {
    Alert.prompt(
      'Cleanup Orphaned User',
      'Enter the email address of the user to cleanup:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cleanup',
          style: 'destructive',
          onPress: async (email) => {
            if (!email || !email.trim()) {
              Alert.alert('Error', 'Please enter a valid email address');
              return;
            }

            try {
              // Type assertion to access the cleanup method
              const dbService = DatabaseService as any;
              if (dbService.cleanupOrphanedUser) {
                await dbService.cleanupOrphanedUser(email.trim());
                Alert.alert('Success', `User ${email.trim()} has been cleaned up successfully`);
              } else {
                Alert.alert('Error', 'Cleanup method not available');
              }
            } catch (error) {
              console.error('Cleanup error:', error);
              Alert.alert('Error', `Failed to cleanup user: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }
      ],
      'plain-text',
      'qwertyword.meet@gmail.com' // Default value for convenience
    );
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#007AFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingsTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          {authState.currentBusiness?.name} • {authState.currentUserRole === 'OWNER' ? 'Owner' : 'Team Member'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="person-circle-outline"
            title="User Profile"
            subtitle="Manage your personal information"
            onPress={() => navigation.navigate('UserProfile')}
          />
        </View>
      </View>

      {/* Role-Specific Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {RoleBasedPermissionService.getRoleDisplayName(authState.currentUserRole || 'EMPLOYEE')} Features
        </Text>
        <View style={styles.sectionContent}>
          {/* Owner-specific features */}
          {RoleBasedPermissionService.hasPermission(authState.currentUserRole, Permission.VIEW_FINANCIAL_OVERVIEW) && (
            <SettingsItem
              icon="analytics-outline"
              title="Financial Reports"
              subtitle="View comprehensive business analytics"
              onPress={() => navigation.navigate('Statistics')}
              showArrow
            />
          )}

          {/* Manager-specific features */}
          {RoleBasedPermissionService.hasPermission(authState.currentUserRole, Permission.CREATE_SCHEDULES) && (
            <SettingsItem
              icon="calendar-outline"
              title="Schedule Management"
              subtitle="Create and manage employee schedules"
              onPress={() => showComingSoon(
                'Schedule Management',
                'Create, edit, and manage employee work schedules with ease. Set shifts, track hours, and ensure optimal coverage for your business.',
                'calendar-outline',
                'Q2 2025'
              )}
              showArrow
            />
          )}

          {RoleBasedPermissionService.hasPermission(authState.currentUserRole, Permission.VIEW_ALL_PAYROLL) && (
            <SettingsItem
              icon="card-outline"
              title="Payroll Management"
              subtitle="Manage employee pay and hours"
              onPress={() => showComingSoon(
                'Payroll Management',
                'Streamline payroll processing with automated calculations, tax deductions, and direct deposit integration. Make payroll simple and accurate.',
                'card-outline',
                'Q3 2025'
              )}
              showArrow
            />
          )}

          {/* Employee-specific features */}
          {RoleBasedPermissionService.hasPermission(authState.currentUserRole, Permission.VIEW_OWN_SCHEDULE) && (
            <SettingsItem
              icon="time-outline"
              title="My Schedule"
              subtitle="View your work schedule and shifts"
              onPress={() => showComingSoon(
                'My Schedule',
                'View your personal work schedule, upcoming shifts, and time-off requests. Stay organized and never miss a shift.',
                'time-outline',
                'Q2 2025'
              )}
              showArrow
            />
          )}

          {RoleBasedPermissionService.hasPermission(authState.currentUserRole, Permission.REQUEST_TIME_OFF) && (
            <SettingsItem
              icon="airplane-outline"
              title="Time Off Requests"
              subtitle="Request and track time off"
              onPress={() => showComingSoon(
                'Time Off Requests',
                'Submit time-off requests, track approval status, and manage your vacation days. Keep your work-life balance in check.',
                'airplane-outline',
                'Q2 2025'
              )}
              showArrow
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Management</Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="business-outline"
            title="Switch Business"
            subtitle="Manage multiple businesses"
            onPress={handleBusinessManagement}
            showArrow
          />
          {isOwner && (
            <SettingsItem
              icon="people-outline"
              title="Manage Team"
              subtitle="Invite and manage team members"
              onPress={handleManageTeam}
              showArrow
            />
          )}
          {isOwner && (
            <SettingsItem
              icon="link-outline"
              title="Delivery Integrations"
              subtitle="Connect Uber Eats, Skip, DoorDash"
              onPress={handleIntegrations}
              showArrow
            />
          )}
        </View>
      </View>

      {isOwner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="download-outline"
              title="Export Data"
              subtitle="Download your transactions as CSV"
              onPress={handleExportData}
            />
            <SettingsItem
              icon="cloud-upload-outline"
              title="Backup Data"
              subtitle="Save your data to cloud storage"
              onPress={handleBackupData}
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="information-circle-outline"
            title="About Simply"
            subtitle="Version and app information"
            onPress={handleAbout}
          />
          <SettingsItem
            icon="star-outline"
            title="Rate App"
            subtitle="Help us improve by rating the app"
            onPress={() => Alert.alert('Rate App', 'This would open the app store rating page.')}
          />
          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help using Simply"
            onPress={() => Alert.alert('Help', 'Contact support at support@simply.app')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.sectionContent}>
          <SettingsItem
            icon="document-text-outline"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => Alert.alert('Privacy Policy', 'This would open the privacy policy.')}
          />
          <SettingsItem
            icon="document-outline"
            title="Terms of Service"
            subtitle="App usage terms and conditions"
            onPress={() => Alert.alert('Terms of Service', 'This would open the terms of service.')}
          />
        </View>
      </View>

      {/* Developer Section - Only show in development */}
      {showDeveloperSection && (
        <View style={styles.developerSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code" size={20} color="#FF9500" />
            <Text style={styles.sectionTitle}>Developer Tools</Text>
          </View>

          <TouchableOpacity style={styles.developerButton} onPress={handleCleanupOrphanedUser}>
            <Ionicons name="trash-bin" size={20} color="#FF9500" />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Cleanup Orphaned User</Text>
              <Text style={styles.settingSubtitle}>Remove user records that exist in database but not in auth</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      )}

      {/* Role Testing Section - Only show in development */}
      {showDeveloperSection && (
        <View style={styles.roleTestingSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <Text style={styles.sectionTitle}>Role Testing</Text>
          </View>

          <TouchableOpacity
            style={styles.roleTestingButton}
            onPress={() => setShowRoleTesting(!showRoleTesting)}
          >
            <Ionicons name="analytics" size={20} color="#007AFF" />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>
                {showRoleTesting ? 'Hide' : 'Show'} Role Testing Dashboard
              </Text>
              <Text style={styles.settingSubtitle}>
                Test role-based permissions and access control
              </Text>
            </View>
            <Ionicons
              name={showRoleTesting ? "chevron-up" : "chevron-down"}
              size={20}
              color="#007AFF"
            />
          </TouchableOpacity>

          {showRoleTesting && (
            <View style={styles.roleTestingContainer}>
              <RoleTestingComponent />
            </View>
          )}
        </View>
      )}

      {/* Danger Zone - Only show for business owners */}
      {authState.currentUserRole === 'OWNER' && authState.currentBusiness && (
        <DangerZone onBusinessDeleted={handleBusinessDeleted} />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Simply Business Tracker</Text>
        <Text style={styles.footerSubtext}>Version 1.0.0</Text>
      </View>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={comingSoonModal.visible}
        onClose={hideComingSoon}
        title={comingSoonModal.title}
        description={comingSoonModal.description}
        icon={comingSoonModal.icon}
        estimatedRelease={comingSoonModal.estimatedRelease}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  footerSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  developerSection: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE4B3',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  developerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  roleTestingSection: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#BBDEFB',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  roleTestingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  roleTestingContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
});

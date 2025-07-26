import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';

type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

interface Props {
  navigation: UserProfileScreenNavigationProp;
}

export default function UserProfileScreen({ navigation }: Props) {
  const { state: authState, logout, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(authState.user?.firstName || '');
  const [lastName, setLastName] = useState(authState.user?.lastName || '');
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (result.success && authState.user) {
        const updatedUser = {
          ...authState.user,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        };
        updateUser(updatedUser);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(authState.user?.firstName || '');
    setLastName(authState.user?.lastName || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const ProfileItem = ({ 
    icon, 
    label, 
    value, 
    editable = false,
    onChangeText,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    editable?: boolean;
    onChangeText?: (text: string) => void;
  }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#007AFF" />
        </View>
        <Text style={styles.profileLabel}>{label}</Text>
      </View>
      {editable && isEditing ? (
        <TextInput
          style={styles.profileInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={label}
          editable={!loading}
        />
      ) : (
        <Text style={styles.profileValue}>{value}</Text>
      )}
    </View>
  );

  const getRoleDisplayName = (role: string | null) => {
    if (!role) return 'Team Member';
    switch (role) {
      case 'OWNER':
        return 'Business Owner';
      case 'MANAGER':
        return 'Manager';
      case 'EMPLOYEE':
        return 'Employee';
      case 'ACCOUNTANT':
        return 'Accountant';
      default:
        return 'Team Member';
    }
  };

  const getRoleColor = (role: string | null) => {
    if (!role) return '#FF9800';
    switch (role) {
      case 'OWNER':
        return '#4CAF50';
      case 'MANAGER':
        return '#2196F3';
      case 'EMPLOYEE':
        return '#FF9800';
      case 'ACCOUNTANT':
        return '#9C27B0';
      default:
        return '#FF9800';
    }
  };

  if (!authState.user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#007AFF" />
        </View>
        <Text style={styles.userName}>
          {authState.user.firstName} {authState.user.lastName}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(authState.currentUserRole) }]}>
          <Text style={styles.roleText}>
            {getRoleDisplayName(authState.currentUserRole)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color="#007AFF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionContent}>
          <ProfileItem
            icon="person-outline"
            label="First Name"
            value={firstName}
            editable={true}
            onChangeText={setFirstName}
          />
          <ProfileItem
            icon="person-outline"
            label="Last Name"
            value={lastName}
            editable={true}
            onChangeText={setLastName}
          />
          <ProfileItem
            icon="mail-outline"
            label="Email"
            value={authState.user.email}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Businesses</Text>
          {authState.currentUserRole === 'OWNER' && authState.businesses.length > 1 && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => navigation.navigate('BusinessSelection', {
                businesses: authState.businesses.map(business => ({
                  ...business,
                  createdAt: business.createdAt instanceof Date ? business.createdAt.toISOString() : business.createdAt,
                  updatedAt: business.updatedAt instanceof Date ? business.updatedAt.toISOString() : business.updatedAt,
                })),
                userId: authState.user.id
              })}
            >
              <Ionicons name="swap-horizontal" size={16} color="#007AFF" />
              <Text style={styles.switchButtonText}>Switch</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.sectionContent}>
          {authState.businesses.map((business, index) => (
            <View key={business.id} style={styles.businessItem}>
              <View style={styles.businessIcon}>
                <Ionicons
                  name={business.id === authState.currentBusiness?.id ? "business" : "business-outline"}
                  size={20}
                  color={business.id === authState.currentBusiness?.id ? "#007AFF" : "#666"}
                />
              </View>
              <View style={styles.businessInfo}>
                <Text style={[
                  styles.businessName,
                  business.id === authState.currentBusiness?.id && styles.currentBusiness
                ]}>
                  {business.name}
                </Text>
                <Text style={styles.businessType}>
                  {business.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {business.id === authState.currentBusiness?.id && ' • Current'}
                </Text>
              </View>
              {business.id === authState.currentBusiness?.id && (
                <View style={styles.currentBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                </View>
              )}
            </View>
          ))}
          {authState.businesses.length === 0 && (
            <View style={styles.emptyBusinesses}>
              <Text style={styles.emptyText}>No businesses found</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
            <View style={styles.actionItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#ffebee' }]}>
                <Ionicons name="log-out-outline" size={20} color="#F44336" />
              </View>
              <Text style={[styles.actionLabel, { color: '#F44336' }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Simply Business Tracker</Text>
        <Text style={styles.footerSubtext}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 32,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
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
  profileLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  profileValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  profileInput: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  currentBusiness: {
    fontWeight: '600',
    color: '#007AFF',
  },
  businessType: {
    fontSize: 14,
    color: '#666',
  },
  currentBadge: {
    marginLeft: 8,
  },
  emptyBusinesses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

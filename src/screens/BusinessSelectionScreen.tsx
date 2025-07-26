import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { Business, BusinessRole } from '../types/database';
import { AuthStackParamList } from '../types';
import DatabaseService from '../services/DatabaseServiceFactory';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'BusinessSelection'>;
  route: {
    params: {
      businesses: Business[];
      userId: string;
      newBusiness?: Business;
    };
  };
};

export default function BusinessSelectionScreen({ navigation, route }: Props) {
  const { selectBusiness, state } = useAuth();
  const [ownedBusinesses, setOwnedBusinesses] = useState<Business[]>([]);
  const [memberBusinesses, setMemberBusinesses] = useState<Business[]>([]);
  const [userRoles, setUserRoles] = useState<{ [businessId: string]: BusinessRole }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBusinessRelationships();
  }, []);

  const loadBusinessRelationships = async () => {
    try {
      setLoading(true);
      
      if (!state.user) {
        throw new Error('No user found');
      }

      const relationships = await DatabaseService.getUserBusinessRelationships(state.user.id);
      
      setOwnedBusinesses(relationships.ownedBusinesses);
      setMemberBusinesses(relationships.memberBusinesses);
      
      // Load user roles for all businesses
      const memberships = await DatabaseService.getUserBusinessMemberships(state.user.id);
      const rolesMap: { [businessId: string]: BusinessRole } = {};
      memberships.forEach(membership => {
        rolesMap[membership.businessId] = membership.role;
      });
      setUserRoles(rolesMap);
      
    } catch (error) {
      console.error('Load business relationships error:', error);
      Alert.alert('Error', 'Failed to load your businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBusinessRelationships();
    setRefreshing(false);
  };

  const handleSelectBusiness = async (business: Business) => {
    try {
      await selectBusiness(business);
      // Navigation will be handled by AppNavigator based on auth state
    } catch (error) {
      console.error('Select business error:', error);
      Alert.alert('Error', 'Failed to select business. Please try again.');
    }
  };

  const handleCreateBusiness = () => {
    if (state.user) {
      navigation.navigate('CreateBusiness', { userId: state.user.id });
    }
  };

  const getRoleDisplayName = (role: BusinessRole) => {
    switch (role) {
      case BusinessRole.OWNER:
        return 'Owner';
      case BusinessRole.MANAGER:
        return 'Manager';
      case BusinessRole.EMPLOYEE:
        return 'Employee';
      case BusinessRole.ACCOUNTANT:
        return 'Accountant';
      default:
        return 'Team Member';
    }
  };

  const getRoleIcon = (role: BusinessRole) => {
    switch (role) {
      case BusinessRole.OWNER:
        return 'star';
      case BusinessRole.MANAGER:
        return 'people';
      case BusinessRole.EMPLOYEE:
        return 'person';
      case BusinessRole.ACCOUNTANT:
        return 'calculator';
      default:
        return 'person-circle';
    }
  };

  const renderBusinessCard = (business: Business, isOwned: boolean) => {
    const role = userRoles[business.id];
    
    return (
      <TouchableOpacity
        key={business.id}
        style={[styles.businessCard, isOwned && styles.ownedBusinessCard]}
        onPress={() => handleSelectBusiness(business)}
      >
        <View style={styles.businessHeader}>
          <View style={styles.businessIcon}>
            <Ionicons name="business" size={24} color={isOwned ? "#007AFF" : "#28A745"} />
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.name}</Text>
            <Text style={styles.businessType}>{business.type.replace('_', ' ')}</Text>
          </View>
          <View style={styles.roleContainer}>
            <Ionicons name={getRoleIcon(role)} size={16} color={isOwned ? "#007AFF" : "#28A745"} />
            <Text style={[styles.roleText, { color: isOwned ? "#007AFF" : "#28A745" }]}>
              {getRoleDisplayName(role)}
            </Text>
          </View>
        </View>
        
        {business.description && (
          <Text style={styles.businessDescription}>{business.description}</Text>
        )}
        
        <View style={styles.businessFooter}>
          <View style={styles.businessDetail}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.businessDetailText}>{business.address || 'No address'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your businesses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalBusinesses = ownedBusinesses.length + memberBusinesses.length;

  if (totalBusinesses === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="business" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Businesses Found</Text>
          <Text style={styles.emptyText}>
            You don't have any businesses yet. Create one or wait for an invitation.
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateBusiness}>
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.createButtonText}>Create Business</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Business</Text>
          <Text style={styles.subtitle}>Choose which business to access</Text>
        </View>

        {ownedBusinesses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>My Businesses</Text>
              <Text style={styles.sectionCount}>({ownedBusinesses.length})</Text>
            </View>
            {ownedBusinesses.map(business => renderBusinessCard(business, true))}
          </View>
        )}

        {memberBusinesses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#28A745" />
              <Text style={styles.sectionTitle}>Employment</Text>
              <Text style={styles.sectionCount}>({memberBusinesses.length})</Text>
            </View>
            {memberBusinesses.map(business => renderBusinessCard(business, false))}
          </View>
        )}

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.createBusinessButton} onPress={handleCreateBusiness}>
            <Ionicons name="add-circle" size={20} color="#007AFF" />
            <Text style={styles.createBusinessButtonText}>Create New Business</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  businessCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#28A745',
  },
  ownedBusinessCard: {
    borderLeftColor: '#007AFF',
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  businessType: {
    fontSize: 14,
    color: '#666',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  businessDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  businessFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessDetailText: {
    fontSize: 12,
    color: '#666',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  createBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  createBusinessButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

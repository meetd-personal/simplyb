import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { MainTabParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<MainTabParamList, 'Revenue'>;
};

export default function ManagerRevenueScreen({ navigation }: Props) {
  const { state } = useAuth();

  const handleAddRevenue = () => {
    navigation.navigate('AddTransaction', { type: 'revenue' });
  };

  const ActionCard = ({ 
    icon, 
    title, 
    description, 
    onPress, 
    color = '#007AFF' 
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={32} color={color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <View style={styles.actionArrow}>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Revenue Management</Text>
        <Text style={styles.subtitle}>
          Add and manage revenue for {state.currentBusiness?.name}
        </Text>
      </View>

      <View style={styles.roleNotice}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <View style={styles.roleNoticeContent}>
          <Text style={styles.roleNoticeTitle}>Manager Access</Text>
          <Text style={styles.roleNoticeText}>
            As a manager, you can add and edit revenue entries but cannot view total revenue amounts.
          </Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Available Actions</Text>
        
        <ActionCard
          icon="add-circle"
          title="Add Revenue"
          description="Record new revenue entry"
          onPress={handleAddRevenue}
          color="#28a745"
        />

        <ActionCard
          icon="document-text"
          title="Recent Entries"
          description="View and edit your recent revenue entries"
          onPress={() => Alert.alert('Coming Soon', 'Recent entries view will be available soon')}
          color="#007AFF"
        />

        <ActionCard
          icon="calendar"
          title="Today's Entries"
          description="View revenue entries added today"
          onPress={() => Alert.alert('Coming Soon', 'Today\'s entries view will be available soon')}
          color="#ffc107"
        />
      </View>

      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="document" size={24} color="#007AFF" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>Entries Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#28a745" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
        <Text style={styles.statsNote}>
          Revenue totals are only visible to business owners
        </Text>
      </View>

      <View style={styles.helpSection}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={24} color="#666" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Revenue Categories</Text>
            <Text style={styles.helpText}>
              Make sure to select the correct revenue category when adding entries. 
              This helps with accurate business reporting.
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  roleNotice: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  roleNoticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  roleNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleNoticeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    marginLeft: 8,
  },
  quickStats: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statsNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  helpSection: {
    padding: 16,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

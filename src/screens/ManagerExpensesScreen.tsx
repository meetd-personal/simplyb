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
  navigation: StackNavigationProp<MainTabParamList, 'Expenses'>;
};

export default function ManagerExpensesScreen({ navigation }: Props) {
  const { state } = useAuth();

  const handleAddExpense = () => {
    navigation.navigate('AddTransaction', { type: 'expense' });
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
        <Text style={styles.title}>Expense Management</Text>
        <Text style={styles.subtitle}>
          Add and manage expenses for {state.currentBusiness?.name}
        </Text>
      </View>

      <View style={styles.roleNotice}>
        <Ionicons name="information-circle" size={24} color="#dc3545" />
        <View style={styles.roleNoticeContent}>
          <Text style={styles.roleNoticeTitle}>Manager Access</Text>
          <Text style={styles.roleNoticeText}>
            As a manager, you can add and edit expense entries but cannot view total expense amounts.
          </Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Available Actions</Text>
        
        <ActionCard
          icon="add-circle"
          title="Add Expense"
          description="Record new business expense"
          onPress={handleAddExpense}
          color="#dc3545"
        />

        <ActionCard
          icon="document-text"
          title="Recent Entries"
          description="View and edit your recent expense entries"
          onPress={() => Alert.alert('Coming Soon', 'Recent entries view will be available soon')}
          color="#007AFF"
        />

        <ActionCard
          icon="calendar"
          title="Today's Entries"
          description="View expense entries added today"
          onPress={() => Alert.alert('Coming Soon', 'Today\'s entries view will be available soon')}
          color="#ffc107"
        />

        <ActionCard
          icon="receipt"
          title="Upload Receipts"
          description="Attach receipts to expense entries"
          onPress={() => Alert.alert('Coming Soon', 'Receipt upload will be available soon')}
          color="#28a745"
        />
      </View>

      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="document" size={24} color="#dc3545" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>Entries Today</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#ffc107" />
            <Text style={styles.statValue}>-</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
        <Text style={styles.statsNote}>
          Expense totals are only visible to business owners
        </Text>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Common Categories</Text>
        <View style={styles.categoriesGrid}>
          {[
            { name: 'Food Supplies', icon: 'restaurant', color: '#28a745' },
            { name: 'Utilities', icon: 'flash', color: '#ffc107' },
            { name: 'Rent', icon: 'home', color: '#007AFF' },
            { name: 'Staff Wages', icon: 'people', color: '#6f42c1' },
            { name: 'Marketing', icon: 'megaphone', color: '#fd7e14' },
            { name: 'Equipment', icon: 'construct', color: '#20c997' },
          ].map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryCard}
              onPress={() => {
                Alert.alert(
                  'Quick Add',
                  `Add expense for ${category.name}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add', onPress: handleAddExpense }
                  ]
                );
              }}
            >
              <Ionicons name={category.icon as any} size={24} color={category.color} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.helpSection}>
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={24} color="#666" />
          <View style={styles.helpContent}>
            <Text style={styles.helpTitle}>Expense Guidelines</Text>
            <Text style={styles.helpText}>
              Always keep receipts for business expenses. Categorize expenses accurately 
              and include detailed descriptions for better tracking.
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
    backgroundColor: '#f8d7da',
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
  categoriesSection: {
    padding: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
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

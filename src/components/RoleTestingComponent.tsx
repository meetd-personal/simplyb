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

import { useAuth } from '../contexts/AuthContext';
import RoleBasedPermissionService from '../services/RoleBasedPermissionService';
import { BusinessRole } from '../types/database';
import { Permission } from '../types/permissions';

export default function RoleTestingComponent() {
  const { state } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const runPermissionTests = () => {
    const results: string[] = [];
    const currentRole = state.currentUserRole;

    if (!currentRole) {
      results.push('❌ No current role found');
      setTestResults(results);
      return;
    }

    results.push(`🔍 Testing permissions for role: ${currentRole}`);
    results.push('');

    // Test financial permissions
    results.push('💰 Financial Permissions:');
    const canViewTotals = RoleBasedPermissionService.canViewFinancialTotals(currentRole);
    const canViewNetProfit = RoleBasedPermissionService.canViewNetProfit(currentRole);
    const canAddTransactions = RoleBasedPermissionService.canAddTransactions(currentRole);
    const canManageTransactions = RoleBasedPermissionService.canManageTransactions(currentRole);

    results.push(`  View Financial Totals: ${canViewTotals ? '✅' : '❌'}`);
    results.push(`  View Net Profit: ${canViewNetProfit ? '✅' : '❌'}`);
    results.push(`  Add Transactions: ${canAddTransactions ? '✅' : '❌'}`);
    results.push(`  Manage Transactions: ${canManageTransactions ? '✅' : '❌'}`);
    results.push('');

    // Test HR permissions
    results.push('👥 HR Permissions:');
    const canManageSchedules = RoleBasedPermissionService.canManageSchedules(currentRole);
    const canViewAllPayroll = RoleBasedPermissionService.canViewAllPayroll(currentRole);
    const canApproveTimeOff = RoleBasedPermissionService.canApproveTimeOff(currentRole);
    const canManageTeam = RoleBasedPermissionService.canManageTeam(currentRole);

    results.push(`  Manage Schedules: ${canManageSchedules ? '✅' : '❌'}`);
    results.push(`  View All Payroll: ${canViewAllPayroll ? '✅' : '❌'}`);
    results.push(`  Approve Time Off: ${canApproveTimeOff ? '✅' : '❌'}`);
    results.push(`  Manage Team: ${canManageTeam ? '✅' : '❌'}`);
    results.push('');

    // Test settings permissions
    results.push('⚙️ Settings Permissions:');
    const canManageBusinessSettings = RoleBasedPermissionService.canManageBusinessSettings(currentRole);
    const canSwitchBusiness = RoleBasedPermissionService.canSwitchBusiness(currentRole);
    const canManageIntegrations = RoleBasedPermissionService.canManageIntegrations(currentRole);

    results.push(`  Manage Business Settings: ${canManageBusinessSettings ? '✅' : '❌'}`);
    results.push(`  Switch Business: ${canSwitchBusiness ? '✅' : '❌'}`);
    results.push(`  Manage Integrations: ${canManageIntegrations ? '✅' : '❌'}`);
    results.push('');

    // Test screen access
    results.push('📱 Screen Access:');
    const accessibleScreens = RoleBasedPermissionService.getAccessibleScreens(currentRole);
    accessibleScreens.forEach(screen => {
      results.push(`  ${screen.label || screen.route}: ✅`);
    });
    results.push('');

    // Test data filtering
    results.push('🔒 Data Filtering Test:');
    const mockData = {
      totalRevenue: 10000,
      totalExpenses: 7000,
      netProfit: 3000,
      profitMargin: 30,
      transactionCount: 150,
    };

    const filteredData = RoleBasedPermissionService.filterFinancialData(currentRole, mockData);
    results.push(`  Original data keys: ${Object.keys(mockData).join(', ')}`);
    results.push(`  Filtered data keys: ${Object.keys(filteredData || {}).join(', ')}`);

    setTestResults(results);
  };

  const testRoleHierarchy = () => {
    const results: string[] = [];
    const currentRole = state.currentUserRole;

    if (!currentRole) {
      results.push('❌ No current role found');
      setTestResults(results);
      return;
    }

    results.push('🏗️ Role Hierarchy Test:');
    results.push(`Current role: ${currentRole}`);
    results.push('');

    const roles = [BusinessRole.OWNER, BusinessRole.MANAGER, BusinessRole.EMPLOYEE];
    
    roles.forEach(testRole => {
      const isHigher = RoleBasedPermissionService.isHigherRole(currentRole, testRole);
      results.push(`  ${currentRole} > ${testRole}: ${isHigher ? '✅' : '❌'}`);
    });

    setTestResults(results);
  };

  const testSpecificPermission = (permission: Permission) => {
    const currentRole = state.currentUserRole;
    if (!currentRole) return;

    const hasPermission = RoleBasedPermissionService.hasPermission(currentRole, permission);
    Alert.alert(
      'Permission Test',
      `Role: ${currentRole}\nPermission: ${permission}\nResult: ${hasPermission ? 'GRANTED' : 'DENIED'}`,
      [{ text: 'OK' }]
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Role Testing Dashboard</Text>
        <Text style={styles.subtitle}>
          Current Role: {state.currentUserRole || 'None'}
        </Text>
        <Text style={styles.subtitle}>
          Business: {state.currentBusiness?.name || 'None'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.testButton} onPress={runPermissionTests}>
          <Ionicons name="shield-checkmark" size={20} color="white" />
          <Text style={styles.buttonText}>Test All Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testButton} onPress={testRoleHierarchy}>
          <Ionicons name="git-network" size={20} color="white" />
          <Text style={styles.buttonText}>Test Role Hierarchy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={clearResults}>
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.specificTestsContainer}>
        <Text style={styles.sectionTitle}>Test Specific Permissions:</Text>
        <View style={styles.permissionButtonsGrid}>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => testSpecificPermission(Permission.VIEW_NET_PROFIT)}
          >
            <Text style={styles.permissionButtonText}>Net Profit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => testSpecificPermission(Permission.MANAGE_TEAM)}
          >
            <Text style={styles.permissionButtonText}>Manage Team</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => testSpecificPermission(Permission.VIEW_OWN_SCHEDULE)}
          >
            <Text style={styles.permissionButtonText}>Own Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => testSpecificPermission(Permission.APPROVE_TIME_OFF)}
          >
            <Text style={styles.permissionButtonText}>Approve Time Off</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  specificTestsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  permissionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    minWidth: '45%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text, Alert } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import RoleBasedPermissionService from '../services/RoleBasedPermissionService';
import { UserRole, Permission } from '../types/permissions';
import { BusinessRole } from '../types/database';

// Import role-specific screens
import OwnerDashboard from '../screens/role-based/OwnerDashboard';
import ManagerDashboard from '../screens/role-based/ManagerDashboard';
import EmployeeDashboard from '../screens/role-based/EmployeeDashboard';

// Import existing screens
import RevenueScreen from '../screens/RevenueScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import manager-specific screens
import ManagerTransactionsScreen from '../screens/role-based/ManagerTransactionsScreen';
import ScheduleManagementScreen from '../screens/role-based/ScheduleManagementScreen';
import PayrollManagementScreen from '../screens/role-based/PayrollManagementScreen';

// Import employee-specific screens
import MyScheduleScreen from '../screens/role-based/MyScheduleScreen';
import TimeOffRequestScreen from '../screens/role-based/TimeOffRequestScreen';
import MyPayrollScreen from '../screens/role-based/MyPayrollScreen';
import EmployeeProfileScreen from '../screens/role-based/EmployeeProfileScreen';

const Tab = createBottomTabNavigator();

// Simple logout button component
function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
      <Ionicons name="log-out-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}

export default function RoleBasedTabNavigator() {
  const { state } = useAuth();
  const userRole = state.currentUserRole;

  if (!userRole) {
    return null; // Or a loading screen
  }

  // Get accessible screens for the user's role
  const accessibleScreens = RoleBasedPermissionService.getAccessibleScreens(userRole);

  const getTabBarIcon = (iconName: string) => {
    return ({ color, size }: { color: string; size: number }) => (
      <Ionicons name={iconName as any} size={size} color={color} />
    );
  };

  const renderTabsForRole = () => {
    switch (userRole) {
      case BusinessRole.OWNER:
        return (
          <>
            <Tab.Screen
              name="Dashboard"
              component={OwnerDashboard}
              options={{
                tabBarIcon: getTabBarIcon('speedometer'),
                title: 'Simply Dashboard',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Revenue"
              component={RevenueScreen}
              options={{
                tabBarIcon: getTabBarIcon('trending-up'),
                title: 'Revenue',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Expenses"
              component={ExpensesScreen}
              options={{
                tabBarIcon: getTabBarIcon('trending-down'),
                title: 'Expenses',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Statistics"
              component={StatisticsScreen}
              options={{
                tabBarIcon: getTabBarIcon('bar-chart'),
                title: 'Reports',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                tabBarIcon: getTabBarIcon('settings'),
                title: 'Settings',
                headerRight: () => <LogoutButton />,
              }}
            />
          </>
        );

      case BusinessRole.MANAGER:
        return (
          <>
            <Tab.Screen
              name="Dashboard"
              component={ManagerDashboard}
              options={{
                tabBarIcon: getTabBarIcon('speedometer'),
                title: 'Manager Dashboard',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Transactions"
              component={ManagerTransactionsScreen}
              options={{
                tabBarIcon: getTabBarIcon('receipt'),
                title: 'Transactions',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Schedule"
              component={ScheduleManagementScreen}
              options={{
                tabBarIcon: getTabBarIcon('calendar'),
                title: 'Schedules',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Payroll"
              component={PayrollManagementScreen}
              options={{
                tabBarIcon: getTabBarIcon('card'),
                title: 'Payroll',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                tabBarIcon: getTabBarIcon('settings'),
                title: 'Settings',
                headerRight: () => <LogoutButton />,
              }}
            />
          </>
        );

      case BusinessRole.EMPLOYEE:
      case BusinessRole.ACCOUNTANT:
        return (
          <>
            <Tab.Screen
              name="Dashboard"
              component={EmployeeDashboard}
              options={{
                tabBarIcon: getTabBarIcon('speedometer'),
                title: 'My Dashboard',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Schedule"
              component={MyScheduleScreen}
              options={{
                tabBarIcon: getTabBarIcon('calendar'),
                title: 'My Schedule',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="TimeOff"
              component={TimeOffRequestScreen}
              options={{
                tabBarIcon: getTabBarIcon('time'),
                title: 'Time Off',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Payroll"
              component={MyPayrollScreen}
              options={{
                tabBarIcon: getTabBarIcon('card'),
                title: 'My Pay',
                headerRight: () => <LogoutButton />,
              }}
            />
            <Tab.Screen
              name="Profile"
              component={EmployeeProfileScreen}
              options={{
                tabBarIcon: getTabBarIcon('person'),
                title: 'Profile',
                headerRight: () => <LogoutButton />,
              }}
            />
          </>
        );

      default:
        return (
          <Tab.Screen
            name="Dashboard"
            component={EmployeeDashboard}
            options={{
              tabBarIcon: getTabBarIcon('speedometer'),
              title: 'Dashboard',
            }}
          />
        );
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <LogoutButton />,
      }}
    >
      {renderTabsForRole()}
    </Tab.Navigator>
  );
}

// Helper component to conditionally render tabs based on permissions
export const ConditionalTab = ({ 
  permission, 
  userRole, 
  children 
}: {
  permission: Permission;
  userRole: BusinessRole | null;
  children: React.ReactNode;
}) => {
  const hasPermission = RoleBasedPermissionService.hasPermission(userRole, permission);
  
  if (!hasPermission) {
    return null;
  }
  
  return <>{children}</>;
};

// Permission-based screen wrapper
export const PermissionGuard = ({ 
  permission, 
  userRole, 
  children, 
  fallback 
}: {
  permission: Permission;
  userRole: BusinessRole | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  const hasPermission = RoleBasedPermissionService.hasPermission(userRole, permission);
  
  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};

// Role-based component renderer
export const RoleBasedComponent = ({ 
  userRole, 
  ownerComponent, 
  managerComponent, 
  employeeComponent 
}: {
  userRole: BusinessRole | null;
  ownerComponent?: React.ReactNode;
  managerComponent?: React.ReactNode;
  employeeComponent?: React.ReactNode;
}) => {
  switch (userRole) {
    case BusinessRole.OWNER:
      return ownerComponent ? <>{ownerComponent}</> : null;
    case BusinessRole.MANAGER:
      return managerComponent ? <>{managerComponent}</> : null;
    case BusinessRole.EMPLOYEE:
    case BusinessRole.ACCOUNTANT:
      return employeeComponent ? <>{employeeComponent}</> : null;
    default:
      return null;
  }
};

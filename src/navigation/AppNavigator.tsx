import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

import { RootStackParamList, MainTabParamList, AuthStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import TeamMemberSignupScreen from '../screens/TeamMemberSignupScreen';
import BusinessSelectionScreen from '../screens/BusinessSelectionScreen';
import CreateBusinessScreen from '../screens/CreateBusinessScreen';
import BusinessOnboardingScreen from '../screens/BusinessOnboardingScreen';
import WaitingForInvitationScreen from '../screens/WaitingForInvitationScreen';
import IntegrationsScreen from '../screens/IntegrationsScreen';
import ConnectPlatformScreen from '../screens/ConnectPlatformScreen';
import ManagerRevenueScreen from '../screens/ManagerRevenueScreen';
import ManagerExpensesScreen from '../screens/ManagerExpensesScreen';
import ManageTeamScreen from '../screens/ManageTeamScreen';

// Main App Screens
import DashboardScreen from '../screens/DashboardScreen';
import RevenueScreen from '../screens/RevenueScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Helper function to serialize business data for navigation
const serializeBusinessForNavigation = (business: any) => ({
  ...business,
  createdAt: business.createdAt instanceof Date ? business.createdAt.toISOString() : business.createdAt,
  updatedAt: business.updatedAt instanceof Date ? business.updatedAt.toISOString() : business.updatedAt,
});

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading Simply...</Text>
    </View>
  );
}



// Main Tabs Navigator with business selection requirement
function MainTabs() {
  const { state } = useAuth();

  // If no business is selected, only show Settings
  if (!state.currentBusiness || state.needsBusinessSelection) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => <LogoutButton />,
        })}
      >
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerRight: () => <LogoutButton />
          }}
        />
      </Tab.Navigator>
    );
  }

  // Show tabs based on user role and permissions
  const userRole = state.currentUserRole;
  const isOwner = userRole === 'OWNER';
  const isManager = userRole === 'MANAGER';
  const canViewStatistics = isOwner;

  // Determine which screens to use based on role
  const RevenueComponent = isOwner ? RevenueScreen : ManagerRevenueScreen;
  const ExpensesComponent = isOwner ? ExpensesScreen : ManagerExpensesScreen;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Revenue') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'trending-down' : 'trending-down-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <LogoutButton />,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Simply Dashboard',
          headerRight: () => <LogoutButton />
        }}
      />
      <Tab.Screen
        name="Revenue"
        component={RevenueComponent}
        options={{
          title: isOwner ? 'Revenue' : 'Add Revenue',
          headerRight: () => <LogoutButton />
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesComponent}
        options={{
          title: isOwner ? 'Expenses' : 'Add Expenses',
          headerRight: () => <LogoutButton />
        }}
      />
      {canViewStatistics && (
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{
            title: 'Statistics',
            headerRight: () => <LogoutButton />
          }}
        />
      )}
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerRight: () => <LogoutButton />
        }}
      />
    </Tab.Navigator>
  );
}

// Simple logout button component that works with Expo Go
function LogoutButton() {
  // Call useAuth at component level (following Rules of Hooks)
  const { logout } = useAuth();

  const handleLogout = () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: show message to user
      alert('Logout completed. Please close and reopen the app if needed.');
    }
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
      <Ionicons name="log-out-outline" size={24} color="white" />
    </TouchableOpacity>
  );
}

// Simple navigation without auth dependency to prevent infinite loops
function AppNavigatorContent() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >

      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          title: 'Add Transaction',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
        options={{
          title: 'Transaction Details',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: 'User Profile',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="ManageTeam"
        component={ManageTeamScreen}
        options={{
          title: 'Manage Team',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="Integrations"
        component={IntegrationsScreen}
        options={{
          title: 'Integrations',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="ConnectPlatform"
        component={ConnectPlatformScreen}
        options={{
          title: 'Connect Platform',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="BusinessSelection"
        component={BusinessSelectionScreen}
        options={{
          title: 'Select Business',
          headerRight: () => <LogoutButton />
        }}
      />
      <Stack.Screen
        name="CreateBusiness"
        component={CreateBusinessScreen}
        options={{
          title: 'Create Business',
          headerRight: () => <LogoutButton />
        }}
      />
    </Stack.Navigator>
  );
}

// Auth-aware wrapper that handles navigation based on auth state
function AuthAwareWrapper() {
  const { state } = useAuth();

  // Create a unique key based on auth state to force navigation reset
  const navigationKey = `nav-${state.isAuthenticated ? 'auth' : 'unauth'}-${state.needsBusinessSelection ? 'business' : 'main'}`;

  // Show loading screen during auth initialization
  if (state.isLoading) {
    return <LoadingScreen />;
  }

  // Handle business selection flow (user has businesses to choose from)
  if (state.needsBusinessSelection && state.businesses.length > 0 && state.user) {
    return (
      <NavigationContainer key={navigationKey}>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen
            name="BusinessSelection"
            component={BusinessSelectionScreen}
            initialParams={{
              businesses: state.businesses.map(serializeBusinessForNavigation),
              userId: state.user.id
            }}
          />
          <AuthStack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
          <AuthStack.Screen name="TeamMemberSignup" component={TeamMemberSignupScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  // Handle authenticated user with no businesses (needs onboarding)
  if (state.isAuthenticated && state.businesses.length === 0 && state.user) {
    return (
      <NavigationContainer key={navigationKey}>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="BusinessOnboarding" component={BusinessOnboardingScreen} />
          <AuthStack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
          <AuthStack.Screen name="WaitingForInvitation" component={WaitingForInvitationScreen} />
          <AuthStack.Screen name="TeamMemberSignup" component={TeamMemberSignupScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  // Show auth screens if not authenticated
  if (!state.isAuthenticated) {
    return (
      <NavigationContainer key={navigationKey}>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
          <AuthStack.Screen name="TeamMemberSignup" component={TeamMemberSignupScreen} />
          <AuthStack.Screen name="BusinessSelection" component={BusinessSelectionScreen} />
          <AuthStack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
          <AuthStack.Screen name="BusinessOnboarding" component={BusinessOnboardingScreen} />
          <AuthStack.Screen name="WaitingForInvitation" component={WaitingForInvitationScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  // Show main app if authenticated and has business
  return (
    <NavigationContainer key={navigationKey}>
      <AppNavigatorContent />
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return <AuthAwareWrapper />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Deep linking
import DeepLinkHandler, { linkingConfig } from './DeepLinkHandler';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';

import { RootStackParamList, MainTabParamList, AuthStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import TeamMemberSignupScreen from '../screens/TeamMemberSignupScreen';
// AcceptInvitationScreen removed - using InvitationAcceptanceScreen instead
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
import InvitationAcceptanceScreen from '../screens/InvitationAcceptanceScreen';

// Components
import LoadingScreen from '../components/LoadingScreen';

// Role-based navigation
import RoleBasedTabNavigator from './RoleBasedTabNavigator';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Helper function to serialize business data for navigation
const serializeBusinessForNavigation = (business: any) => ({
  ...business,
  createdAt: business.createdAt instanceof Date ? business.createdAt.toISOString() : business.createdAt,
  updatedAt: business.updatedAt instanceof Date ? business.updatedAt.toISOString() : business.updatedAt,
});

// LoadingScreen is now imported from components



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

  // Use the new role-based tab navigator
  return <RoleBasedTabNavigator />;
}

// Enhanced logout button component with confirmation dialog
function LogoutButton() {
  // Call useAuth at component level (following Rules of Hooks)
  const { logout, state } = useAuth();

  const handleLogout = () => {
    console.log('🔍 LogoutButton: Button clicked, current auth state:', {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.email,
      currentBusiness: state.currentBusiness?.name
    });

    // Use web-compatible confirmation dialog
    const confirmed = window.confirm('Are you sure you want to logout?');

    if (confirmed) {
      console.log('🔍 LogoutButton: User confirmed logout, starting logout process...');

      const performLogout = async () => {
        try {
          console.log('🔍 LogoutButton: Auth state before logout:', {
            isAuthenticated: state.isAuthenticated,
            user: state.user?.email
          });

          await logout();

          console.log('✅ LogoutButton: Logout function completed');
          console.log('🔍 LogoutButton: Auth state after logout:', {
            isAuthenticated: state.isAuthenticated,
            user: state.user?.email
          });

        } catch (error) {
          console.error('❌ LogoutButton: Logout error:', error);
          console.error('❌ LogoutButton: Error details:', JSON.stringify(error, null, 2));
          // Use web-compatible alert
          window.alert(`Logout failed: ${error.message || 'Unknown error'}. Please try again or restart the app.`);
        }
      };

      performLogout();
    } else {
      console.log('🔍 LogoutButton: User cancelled logout');
    }
  };

  // Add debug logging for component render
  console.log('🔍 LogoutButton: Component rendering, logout function available:', typeof logout);

  return (
    <TouchableOpacity
      onPress={() => {
        console.log('🔍 LogoutButton: TouchableOpacity onPress triggered!');
        handleLogout();
      }}
      style={{
        marginRight: 15,
        padding: 8, // Add padding to make it easier to click
        backgroundColor: 'rgba(255,255,255,0.1)', // Add background to see the clickable area
        borderRadius: 5
      }}
      activeOpacity={0.7}
    >
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
function AuthAwareWrapper({ linking }: { linking?: any }) {
  const { state } = useAuth();

  // Create a unique key based on auth state to force navigation reset
  // Use auth state navigationKey if available (for business switches), otherwise generate one
  const navigationKey = state.navigationKey || `nav-${state.isAuthenticated ? 'auth' : 'unauth'}-${state.needsBusinessSelection ? 'business' : 'main'}-${state.businesses.length}`;

  console.log('🔍 AppNavigator: Navigation key:', navigationKey);
  console.log('🔍 AppNavigator: State - isAuthenticated:', state.isAuthenticated, 'needsBusinessSelection:', state.needsBusinessSelection, 'businessCount:', state.businesses.length);
  console.log('🔍 AppNavigator: Linking prop available:', !!linking);

  // Show loading screen during auth initialization
  if (state.isLoading) {
    return <LoadingScreen />;
  }

  // Handle business selection flow (user has businesses to choose from)
  if (state.needsBusinessSelection && state.businesses.length > 0 && state.user) {
    return (
      <NavigationContainer key={navigationKey} linking={linking}>
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
      <NavigationContainer key={navigationKey} linking={linking}>
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
      <NavigationContainer key={navigationKey} linking={linking || linkingConfig}>
        <DeepLinkHandler>
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
          <AuthStack.Screen name="TeamMemberSignup" component={TeamMemberSignupScreen} />
          <AuthStack.Screen
            name="InvitationAcceptance"
            component={InvitationAcceptanceScreen}
            options={{ headerShown: true, title: 'Accept Invitation' }}
          />
          <AuthStack.Screen name="BusinessSelection" component={BusinessSelectionScreen} />
          <AuthStack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
          <AuthStack.Screen name="BusinessOnboarding" component={BusinessOnboardingScreen} />
          <AuthStack.Screen name="WaitingForInvitation" component={WaitingForInvitationScreen} />
        </AuthStack.Navigator>
        </DeepLinkHandler>
      </NavigationContainer>
    );
  }

  // Show main app if authenticated and has business
  return (
    <NavigationContainer key={navigationKey} linking={linking}>
      <AppNavigatorContent />
    </NavigationContainer>
  );
}

interface AppNavigatorProps {
  linking?: any;
}

export default function AppNavigator({ linking }: AppNavigatorProps = {}) {
  return <AuthAwareWrapper linking={linking} />;
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

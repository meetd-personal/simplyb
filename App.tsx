import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { NetworkUtils } from './src/utils/NetworkUtils';
import { CrashReporting } from './src/utils/CrashReporting';
import { Logger } from './src/utils/Logger';

// Configure deep linking
const linking = {
  prefixes: [
    'simply://',
    'https://join.simplyb.meetdigrajkar.ca',
    'https://apps.simplyb.meetdigrajkar.ca'
  ],
  config: {
    screens: {
      InvitationAcceptance: 'invite/:token',
      Login: 'login',
      Signup: 'signup',
    },
  },
};

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize logging system
        Logger.info('App starting up', { version: '1.0.0', platform: 'web' });

        // Initialize crash reporting
        CrashReporting.initialize();

        // Initialize network monitoring
        await NetworkUtils.initialize();

        Logger.info('App initialization completed successfully');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        // Don't throw - let the app continue with basic functionality
      }
    };

    initializeApp();

    // Deep link handling is now managed by DeepLinkHandler component
    // Removed duplicate handlers to prevent conflicts

    // Cleanup handled by DeepLinkHandler
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator linking={linking} />
          <StatusBar style="auto" />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

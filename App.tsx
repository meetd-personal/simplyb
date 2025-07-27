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
      AcceptInvitation: 'invite/:token',
      InvitationAcceptance: 'invite/:token',
      Login: 'login',
      Signup: 'signup',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Initialize logging system
    Logger.info('App starting up', { version: '1.0.0', platform: 'mobile' });

    // Initialize crash reporting
    CrashReporting.initialize();

    // Initialize network monitoring
    NetworkUtils.initialize();

    // Handle initial URL when app is opened from a link
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('📱 App opened with URL:', initialUrl);
      }
    };

    // Handle URL when app is already running
    const handleURL = (event: { url: string }) => {
      console.log('📱 Deep link received:', event.url);
    };

    handleInitialURL();

    const subscription = Linking.addEventListener('url', handleURL);

    return () => {
      subscription?.remove();
    };
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

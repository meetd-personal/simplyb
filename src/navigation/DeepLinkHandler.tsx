import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

export default function DeepLinkHandler({ children }: DeepLinkHandlerProps) {
  const navigation = useNavigation();

  useEffect(() => {
    // Handle deep links when app is already open
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      const parsed = Linking.parse(url);
      console.log('🔍 Parsed URL:', parsed);

      // Handle invitation links
      if (parsed.path?.startsWith('invite/')) {
        const token = parsed.path.replace('invite/', '');
        console.log('📧 Invitation token from deep link:', token);

        // Store token in sessionStorage and reload to trigger proper navigation
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending_invitation_token', token);
          // Redirect to the proper URL format
          window.location.href = `${window.location.origin}?invitation_token=${token}`;
        }
        return;
      }

      // Handle password reset links
      if (parsed.path?.startsWith('reset-password')) {
        console.log('🔐 Password reset link detected');
        navigation.navigate('PasswordReset');
        return;
      }

      // Handle other deep links here
      console.log('ℹ️ Unhandled deep link:', url);
    };

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle deep link if app was opened by one
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 App opened with deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [navigation]);

  return <>{children}</>;
}

// URL configuration for Expo Linking
export const linkingConfig = {
  prefixes: [
    'simply://',
    'http://localhost:8081', // Development
    'https://join.simplyb.meetdigrajkar.ca', // Invitation landing
    'https://apps.simplyb.meetdigrajkar.ca', // Web app
  ],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      PasswordReset: 'reset-password',
      InvitationAcceptance: 'invite/:token',
      
      // Main app screens
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Revenue: 'revenue',
          Expenses: 'expenses',
          Statistics: 'statistics',
          Settings: 'settings',
        },
      },
      
      // Other screens
      AddTransaction: 'add-transaction',
      TransactionDetail: 'transaction/:transactionId',
      UserProfile: 'profile',
      ManageTeam: 'team',
      Integrations: 'integrations',
    },
  },
};

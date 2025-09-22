import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import * as AppleAuthentication from 'expo-apple-authentication'; // Temporarily disabled

import { useAuth } from '../contexts/AuthContext';

interface Props {
  disabled?: boolean;
}

export default function SocialLoginButtons({ disabled = false }: Props) {
  const { state, signInWithGoogle, signInWithApple } = useAuth();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  // const [loading, setLoading] = useState(false); // Removed - using state.isLoading instead

  useEffect(() => {
    checkAppleAvailability();
  }, []);

  const checkAppleAvailability = async () => {
    try {
      // Temporarily disable Apple Sign-In for free developer account
      // Apple Sign-In requires a paid Apple Developer Program membership ($99/year)
      // Re-enable when you upgrade to a paid developer account
      const available = false; // await AppleAuthentication.isAvailableAsync();
      setIsAppleAvailable(available);
    } catch (error) {
      setIsAppleAvailable(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      Alert.alert('Error', 'Apple Sign-In failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google Sign-In error:', error);

      // Provide more specific error messages
      let errorMessage = 'Google Sign-In failed. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('internet')) {
          errorMessage = 'No internet connection. Please check your network and try again.';
        } else if (error.message.includes('cancelled')) {
          errorMessage = 'Sign-in was cancelled.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to Google. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert('Google Sign-In Error', errorMessage);
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        {/* Apple Sign-In Button - Only show on iOS and when available */}
        {Platform.OS === 'ios' && isAppleAvailable && (
          <TouchableOpacity
            style={[
              styles.socialButton,
              styles.appleButton,
              (disabled || state.isLoading) && styles.socialButtonDisabled
            ]}
            onPress={handleAppleSignIn}
            disabled={disabled || state.isLoading}
          >
            <Ionicons name="logo-apple" size={20} color="white" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        {/* Google Sign-In Button */}
        <TouchableOpacity
          style={[
            styles.socialButton,
            styles.googleButton,
            (disabled || state.isLoading) && styles.socialButtonDisabled
          ]}
          onPress={handleGoogleSignIn}
          disabled={disabled || state.isLoading}
        >
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      {state.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#F44336" />
          <Text style={styles.errorMessage}>{state.error}</Text>
        </View>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  appleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: 'white',
    borderColor: '#dadce0',
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorMessage: {
    color: '#F44336',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

import { Alert, Platform } from 'react-native';

// Conditional import for NetInfo (only on native platforms)
let NetInfo: any = null;
if (Platform.OS !== 'web') {
  try {
    NetInfo = require('@react-native-community/netinfo').default;
  } catch (error) {
    console.warn('NetInfo not available on this platform');
  }
}

export class NetworkUtils {
  private static isConnected: boolean = true;
  private static listeners: ((isConnected: boolean) => void)[] = [];

  static async initialize() {
    if (Platform.OS === 'web') {
      // On web, assume connection is available and use navigator.onLine
      this.isConnected = navigator.onLine;

      // Listen for online/offline events on web
      window.addEventListener('online', () => {
        const wasConnected = this.isConnected;
        this.isConnected = true;
        this.listeners.forEach(listener => listener(this.isConnected));

        if (!wasConnected) {
          console.log('🌐 Network connection restored');
        }
      });

      window.addEventListener('offline', () => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.listeners.forEach(listener => listener(this.isConnected));

        if (wasConnected) {
          console.log('📵 Network connection lost');
          Alert.alert(
            'No Internet Connection',
            'Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      });

      return;
    }

    if (!NetInfo) {
      console.warn('NetInfo not available, assuming connected');
      this.isConnected = true;
      return;
    }

    // Check initial connection state
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;

    // Listen for connection changes
    NetInfo.addEventListener((state: any) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isConnected));

      // Show user-friendly messages
      if (!wasConnected && this.isConnected) {
        console.log('🌐 Network connection restored');
      } else if (wasConnected && !this.isConnected) {
        console.log('📵 Network connection lost');
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    });
  }

  static isNetworkConnected(): boolean {
    return this.isConnected;
  }

  static addConnectionListener(listener: (isConnected: boolean) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static async checkConnection(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return navigator.onLine;
    }

    if (!NetInfo) {
      return true; // Assume connected if NetInfo not available
    }

    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  static async withNetworkCheck<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'This action requires an internet connection'
  ): Promise<T> {
    if (!this.isConnected) {
      throw new Error(errorMessage);
    }

    try {
      return await operation();
    } catch (error) {
      // Check if it's a network error
      if (this.isNetworkError(error)) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  }

  private static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const networkErrorKeywords = [
      'network',
      'connection',
      'timeout',
      'unreachable',
      'offline',
      'fetch',
      'cors'
    ];

    return networkErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  static handleApiError(error: any): string {
    if (!this.isConnected) {
      return 'No internet connection. Please check your network and try again.';
    }

    if (this.isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error?.message) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

// Hook for React components
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = React.useState(NetworkUtils.isNetworkConnected());

  React.useEffect(() => {
    const unsubscribe = NetworkUtils.addConnectionListener(setIsConnected);
    return unsubscribe;
  }, []);

  return isConnected;
}

// Import React for the hook
import React from 'react';

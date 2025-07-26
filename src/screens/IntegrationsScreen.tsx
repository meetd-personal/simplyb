import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { DeliveryPlatform, SyncStatus } from '../types/database';
import { RootStackParamList } from '../types';
import DeliveryIntegrationService from '../services/DeliveryIntegrationService';
import DatabaseService from '../services/DatabaseServiceFactory';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Integrations'>;
};

interface PlatformStatus {
  isConnected: boolean;
  lastSync?: Date;
  status: SyncStatus;
  recordsToday: number;
}

export default function IntegrationsScreen({ navigation }: Props) {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [platformStatus, setPlatformStatus] = useState<{
    [key in DeliveryPlatform]?: PlatformStatus;
  }>({});

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    try {
      if (!state.user?.businessId) return;
      
      const status = await DeliveryIntegrationService.getIntegrationStatus(state.user.businessId);
      setPlatformStatus(status);
    } catch (error) {
      console.error('Load integration status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPlatform = (platform: DeliveryPlatform) => {
    navigation.navigate('ConnectPlatform', { platform });
  };

  const handleSyncNow = async (platform: DeliveryPlatform) => {
    try {
      setSyncing(platform);
      
      if (!state.user?.businessId) return;
      
      const integrations = await DatabaseService.getBusinessDeliveryIntegrations(state.user.businessId);
      const integration = integrations.find(i => i.platform === platform);
      
      if (!integration) {
        Alert.alert('Error', 'Integration not found');
        return;
      }

      const result = await DeliveryIntegrationService.syncOrders(integration.id);
      
      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Successfully synced ${result.recordsAdded} new orders`
        );
        loadIntegrationStatus(); // Refresh status
      } else {
        Alert.alert('Sync Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('Error', 'Failed to sync orders');
    } finally {
      setSyncing(null);
    }
  };

  const getPlatformIcon = (platform: DeliveryPlatform) => {
    switch (platform) {
      case DeliveryPlatform.UBER_EATS:
        return 'car';
      case DeliveryPlatform.SKIP_THE_DISHES:
        return 'bicycle';
      case DeliveryPlatform.DOORDASH:
        return 'storefront';
      default:
        return 'restaurant';
    }
  };

  const getPlatformName = (platform: DeliveryPlatform) => {
    switch (platform) {
      case DeliveryPlatform.UBER_EATS:
        return 'Uber Eats';
      case DeliveryPlatform.SKIP_THE_DISHES:
        return 'Skip The Dishes';
      case DeliveryPlatform.DOORDASH:
        return 'DoorDash';
      default:
        return platform;
    }
  };

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return '#28a745';
      case SyncStatus.ERROR:
        return '#dc3545';
      case SyncStatus.IN_PROGRESS:
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.SUCCESS:
        return 'Connected';
      case SyncStatus.ERROR:
        return 'Error';
      case SyncStatus.IN_PROGRESS:
        return 'Syncing...';
      case SyncStatus.PENDING:
        return 'Pending';
      default:
        return 'Disconnected';
    }
  };

  const renderPlatformCard = (platform: DeliveryPlatform) => {
    const status = platformStatus[platform];
    const isConnected = status?.isConnected || false;
    const isSyncing = syncing === platform;

    return (
      <View key={platform} style={styles.platformCard}>
        <View style={styles.platformHeader}>
          <View style={styles.platformInfo}>
            <View style={styles.platformIcon}>
              <Ionicons
                name={getPlatformIcon(platform)}
                size={24}
                color="#007AFF"
              />
            </View>
            <View>
              <Text style={styles.platformName}>{getPlatformName(platform)}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(status?.status || SyncStatus.PENDING) }
                  ]}
                />
                <Text style={styles.statusText}>
                  {getStatusText(status?.status || SyncStatus.PENDING)}
                </Text>
              </View>
            </View>
          </View>
          
          {isConnected ? (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={() => handleSyncNow(platform)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Ionicons name="refresh" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => handleConnectPlatform(platform)}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>

        {isConnected && status && (
          <View style={styles.platformStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{status.recordsToday}</Text>
              <Text style={styles.statLabel}>Orders Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {status.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}
              </Text>
              <Text style={styles.statLabel}>Last Sync</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading integrations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Integrations</Text>
        <Text style={styles.subtitle}>
          Connect your delivery platforms to automatically sync orders
        </Text>
      </View>

      <View style={styles.platformsContainer}>
        {Object.values(DeliveryPlatform).map(platform => renderPlatformCard(platform))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Connect your delivery platform accounts to automatically sync order data in real-time. 
            This helps you track all revenue sources in one place.
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  platformsContainer: {
    padding: 16,
  },
  platformCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  syncButton: {
    padding: 8,
  },
  platformStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

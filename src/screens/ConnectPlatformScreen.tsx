import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { DeliveryPlatform, DeliveryCredentials } from '../types/database';
import { RootStackParamList } from '../types';
import DeliveryIntegrationService from '../services/DeliveryIntegrationService';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ConnectPlatform'>;
  route: {
    params: {
      platform: DeliveryPlatform;
    };
  };
};

export default function ConnectPlatformScreen({ navigation, route }: Props) {
  const { state } = useAuth();
  const { platform } = route.params;
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<DeliveryCredentials>({});

  const getPlatformName = () => {
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

  const getPlatformIcon = () => {
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

  const handleConnect = async () => {
    if (!state.user?.businessId) {
      Alert.alert('Error', 'No business selected');
      return;
    }

    try {
      setLoading(true);
      
      const result = await DeliveryIntegrationService.setupIntegration(
        state.user.businessId,
        platform,
        credentials
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `Successfully connected to ${getPlatformName()}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to connect platform');
      }
    } catch (error) {
      console.error('Connect platform error:', error);
      Alert.alert('Error', 'Failed to connect platform. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderUberEatsForm = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Client ID *</Text>
        <TextInput
          style={styles.input}
          value={credentials.uberClientId || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, uberClientId: value }))}
          placeholder="Enter Uber Eats Client ID"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Client Secret *</Text>
        <TextInput
          style={styles.input}
          value={credentials.uberClientSecret || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, uberClientSecret: value }))}
          placeholder="Enter Uber Eats Client Secret"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Restaurant ID *</Text>
        <TextInput
          style={styles.input}
          value={credentials.uberRestaurantId || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, uberRestaurantId: value }))}
          placeholder="Enter Restaurant ID"
          autoCapitalize="none"
        />
      </View>
    </>
  );

  const renderSkipForm = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>API Key *</Text>
        <TextInput
          style={styles.input}
          value={credentials.skipApiKey || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, skipApiKey: value }))}
          placeholder="Enter Skip The Dishes API Key"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Restaurant ID *</Text>
        <TextInput
          style={styles.input}
          value={credentials.skipRestaurantId || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, skipRestaurantId: value }))}
          placeholder="Enter Restaurant ID"
          autoCapitalize="none"
        />
      </View>
    </>
  );

  const renderDoorDashForm = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Developer ID *</Text>
        <TextInput
          style={styles.input}
          value={credentials.doorDashDeveloperId || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, doorDashDeveloperId: value }))}
          placeholder="Enter DoorDash Developer ID"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Key ID *</Text>
        <TextInput
          style={styles.input}
          value={credentials.doorDashKeyId || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, doorDashKeyId: value }))}
          placeholder="Enter Key ID"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Signing Secret *</Text>
        <TextInput
          style={styles.input}
          value={credentials.doorDashSigningSecret || ''}
          onChangeText={(value) => setCredentials(prev => ({ ...prev, doorDashSigningSecret: value }))}
          placeholder="Enter Signing Secret"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>
    </>
  );

  const renderForm = () => {
    switch (platform) {
      case DeliveryPlatform.UBER_EATS:
        return renderUberEatsForm();
      case DeliveryPlatform.SKIP_THE_DISHES:
        return renderSkipForm();
      case DeliveryPlatform.DOORDASH:
        return renderDoorDashForm();
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.platformInfo}>
          <View style={styles.platformIcon}>
            <Ionicons name={getPlatformIcon()} size={32} color="#007AFF" />
          </View>
          <Text style={styles.title}>Connect {getPlatformName()}</Text>
        </View>
      </View>

      <View style={styles.form}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Demo Mode</Text>
            <Text style={styles.infoText}>
              For demo purposes, enter any values. In production, you would enter your actual {getPlatformName()} API credentials.
            </Text>
          </View>
        </View>

        {renderForm()}

        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="link" size={20} color="white" />
              <Text style={styles.connectButtonText}>Connect Platform</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  backButton: {
    marginRight: 16,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

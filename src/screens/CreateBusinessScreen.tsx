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
import { Picker } from '@react-native-picker/picker';

import { BusinessType } from '../types/database';
import { AuthStackParamList } from '../types';
import DatabaseService from '../services/DatabaseServiceFactory';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'CreateBusiness'>;
  route: {
    params: {
      userId: string;
    };
  };
};

export default function CreateBusinessScreen({ navigation, route }: Props) {
  const { refreshBusinesses } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: BusinessType.FOOD_FRANCHISE,
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);

  const businessTypes = [
    { value: BusinessType.FOOD_FRANCHISE, label: 'Food Franchise' },
    { value: BusinessType.RESTAURANT, label: 'Restaurant' },
    { value: BusinessType.RETAIL, label: 'Retail Store' },
    { value: BusinessType.SERVICE, label: 'Service Business' },
    { value: BusinessType.OTHER, label: 'Other' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Business name is required');
      return false;
    }
    return true;
  };

  const handleCreateBusiness = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create business
      console.log('🏢 Creating business with data:', {
        name: formData.name.trim(),
        type: formData.type,
        ownerId: route.params.userId
      });

      const business = await DatabaseService.createBusiness({
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        timezone: 'America/Toronto', // Default timezone
        currency: 'CAD', // Default currency
        isActive: true,
        ownerId: route.params.userId
      });

      console.log('✅ Business created successfully:', business.name);

      Alert.alert(
        'Success',
        'Business created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh auth context to reload user's businesses and redirect appropriately
              refreshBusinesses();

              // Navigate to root to trigger auth flow refresh
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Create business error:', error);
      Alert.alert('Error', 'Failed to create business. Please try again.');
    } finally {
      setLoading(false);
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
        <Text style={styles.title}>Create New Business</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="Enter business name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Type *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {businessTypes.map((type) => (
                <Picker.Item
                  key={type.value}
                  label={type.label}
                  value={type.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Brief description of your business"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Business address"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
            placeholder="Business phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Business email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={(value) => handleInputChange('website', value)}
            placeholder="Business website"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateBusiness}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="business" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Business</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minHeight: 50,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

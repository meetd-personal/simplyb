import React, { useState, useEffect } from 'react';
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

import { AuthStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import TeamInvitationService, { TeamInvitation } from '../services/TeamInvitationService';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'TeamMemberSignup'>;
  route: {
    params?: {
      invitationToken?: string;
    };
  };
};

export default function TeamMemberSignupScreen({ navigation, route }: Props) {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  useEffect(() => {
    if (route.params?.invitationToken) {
      loadInvitation(route.params.invitationToken);
    }
  }, [route.params?.invitationToken]);

  const loadInvitation = async (token: string) => {
    try {
      setLoadingInvitation(true);
      const inv = await TeamInvitationService.getInvitationByToken(token);
      
      if (!inv) {
        Alert.alert('Invalid Invitation', 'This invitation link is not valid or has expired.');
        navigation.goBack();
        return;
      }

      if (inv.status !== 'pending') {
        Alert.alert('Invitation Expired', `This invitation is ${inv.status}.`);
        navigation.goBack();
        return;
      }

      setInvitation(inv);
      setFormData(prev => ({ ...prev, email: inv.inviteeEmail }));
    } catch (error) {
      console.error('Load invitation error:', error);
      Alert.alert('Error', 'Failed to load invitation details.');
    } finally {
      setLoadingInvitation(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (invitation && formData.email.toLowerCase() !== invitation.inviteeEmail) {
      Alert.alert('Error', 'Email must match the invitation email');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // If there's an invitation, accept it first
      if (invitation) {
        const acceptResult = await TeamInvitationService.acceptInvitation(
          invitation.token,
          formData.email
        );

        if (!acceptResult.success) {
          Alert.alert('Error', acceptResult.error || 'Failed to accept invitation');
          return;
        }
      }

      // Create account
      await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: invitation ? 'team_member' : 'business_owner',
        businessName: invitation ? invitation.businessName : 'My Business'
      });

      Alert.alert(
        'Success',
        invitation 
          ? `Welcome to ${invitation.businessName}! Your account has been created.`
          : 'Account created successfully!',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvitation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading invitation...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {invitation ? 'Join Team' : 'Create Account'}
        </Text>
      </View>

      {invitation && (
        <View style={styles.invitationCard}>
          <Ionicons name="mail" size={24} color="#007AFF" />
          <View style={styles.invitationContent}>
            <Text style={styles.invitationTitle}>You're Invited!</Text>
            <Text style={styles.invitationText}>
              {invitation.inviterName} has invited you to join {invitation.businessName} as a {invitation.role.replace('_', ' ')}.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            placeholder="Enter your first name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            placeholder="Enter your last name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, invitation && styles.inputDisabled]}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!invitation}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            placeholder="Enter your password"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            placeholder="Confirm your password"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.signupButtonText}>
                {invitation ? 'Join Team' : 'Create Account'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Sign In
          </Text>
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
  invitationCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  invitationContent: {
    flex: 1,
    marginLeft: 12,
  },
  invitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  invitationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

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
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../types';
import ImprovedTeamInvitationService, { TeamInvitation } from '../services/ImprovedTeamInvitationService';
import { useAuth } from '../contexts/AuthContext';

type InvitationAcceptanceNavigationProp = StackNavigationProp<RootStackParamList, 'InvitationAcceptance'>;
type InvitationAcceptanceRouteProp = RouteProp<RootStackParamList, 'InvitationAcceptance'>;

interface Props {
  navigation: InvitationAcceptanceNavigationProp;
  route: InvitationAcceptanceRouteProp;
}

export default function InvitationAcceptanceScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const { login } = useAuth();

  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const [signInData, setSignInData] = useState({
    password: '',
  });

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      // Simple approach: just assume user might exist and let them choose
      // In a real implementation, you might check with your backend
      console.log('🔍 Checking if user exists for email:', email);
      return true; // For now, always show both options
    } catch (error) {
      console.log('🔍 Could not determine if user exists, showing both options');
      return true;
    }
  };

  const loadInvitation = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading invitation with token:', token);
      
      const invitationData = await ImprovedTeamInvitationService.getInvitation(token);
      
      if (!invitationData) {
        Alert.alert(
          'Invalid Invitation',
          'This invitation link is invalid or has expired.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      if (invitationData.status !== 'pending') {
        Alert.alert(
          'Invitation Already Used',
          'This invitation has already been accepted or cancelled.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      if (new Date(invitationData.expiresAt) < new Date()) {
        Alert.alert(
          'Invitation Expired',
          'This invitation has expired. Please contact the business owner for a new invitation.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }

      setInvitation(invitationData);

      // Check if user already exists
      const exists = await checkUserExists(invitationData.inviteeEmail);
      setUserExists(exists);
      console.log('🔍 User exists check:', { email: invitationData.inviteeEmail, exists });

    } catch (error) {
      console.error('❌ Failed to load invitation:', error);
      Alert.alert(
        'Error',
        'Failed to load invitation details. Please try again.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!invitation) return;

    if (!signInData.password.trim()) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('🔐 Attempting to sign in existing user...');

      // First, try to login the user
      const loginResult = await login(invitation.inviteeEmail, signInData.password);

      if (!loginResult.success) {
        Alert.alert('Error', loginResult.error || 'Failed to sign in. Please check your password.');
        return;
      }

      console.log('✅ User signed in successfully, now accepting invitation...');

      // Now accept the invitation for the logged-in user
      const result = await ImprovedTeamInvitationService.acceptInvitationForExistingUser(token);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to accept invitation');
        return;
      }

      // Show success message
      Alert.alert(
        'Welcome!',
        `You've been successfully added to ${invitation.businessName} as a ${invitation.role}.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // The user is now logged in and part of the business
              // The auth context should handle navigation automatically
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Failed to sign in and accept invitation:', error);
      Alert.alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('✅ Accepting invitation...');

      const result = await ImprovedTeamInvitationService.acceptInvitation(token, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        password: formData.password,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to accept invitation');
        return;
      }

      // Show success message
      Alert.alert(
        'Welcome!',
        `Your account has been created successfully. You've been added to ${invitation.businessName} as a ${invitation.role}.`,
        [
          {
            text: 'Login Now',
            onPress: () => {
              // Navigate to login with pre-filled email
              navigation.navigate('Login', { 
                email: invitation.inviteeEmail,
                message: 'Account created! Please login with your new credentials.'
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Failed to accept invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading invitation...</Text>
      </View>
    );
  }

  if (!invitation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Invalid Invitation</Text>
        <Text style={styles.errorText}>This invitation link is not valid.</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="mail" size={64} color="#007AFF" />
        <Text style={styles.title}>You're Invited!</Text>
        <Text style={styles.subtitle}>
          {invitation.inviterName} has invited you to join
        </Text>
        <Text style={styles.businessName}>{invitation.businessName}</Text>
        <Text style={styles.role}>as a {invitation.role}</Text>
      </View>

      {/* Choice between Sign In and Create Account */}
      {userExists && !showSignIn && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>How would you like to proceed?</Text>
          <Text style={styles.choiceDescription}>
            You can sign in with your existing account or create a new one.
          </Text>

          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => setShowSignIn(true)}
          >
            <Ionicons name="log-in" size={20} color="#007AFF" />
            <Text style={styles.choiceButtonText}>Sign in with existing account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceButton, styles.secondaryChoiceButton]}
            onPress={() => setShowSignIn(false)}
          >
            <Ionicons name="person-add" size={20} color="#666" />
            <Text style={[styles.choiceButtonText, styles.secondaryChoiceButtonText]}>Create new account</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sign In Form */}
      {showSignIn && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formDescription}>
            Sign in with your existing account to accept the invitation.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={invitation.inviteeEmail}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={signInData.password}
              onChangeText={(text) => setSignInData({...signInData, password: text})}
              placeholder="Enter your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.acceptButton, submitting && styles.disabledButton]}
            onPress={handleSignIn}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.acceptButtonText}>Sign In & Accept Invitation</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowSignIn(false)}
          >
            <Text style={styles.backButtonText}>← Back to options</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Account Form */}
      {(!userExists || (userExists && !showSignIn)) && !showSignIn && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Create Your Account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(text) => setFormData({...formData, firstName: text})}
              placeholder="Enter your first name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(text) => setFormData({...formData, lastName: text})}
              placeholder="Enter your last name"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={invitation.inviteeEmail}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              placeholder="Create a password (min 6 characters)"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
              placeholder="Confirm your password"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.acceptButton, submitting && styles.disabledButton]}
            onPress={handleAcceptInvitation}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.acceptButtonText}>Create Account & Accept Invitation</Text>
              </>
            )}
          </TouchableOpacity>

          {userExists && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowSignIn(false)}
            >
              <Text style={styles.backButtonText}>← Back to options</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Common decline button */}
      <View style={styles.declineSection}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.declineButtonText}>Decline Invitation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By accepting this invitation, you agree to join {invitation.businessName} 
          and will have access to business information appropriate for your role.
        </Text>
        <Text style={styles.expiryText}>
          This invitation expires on {invitation.expiresAt.toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    backgroundColor: 'white',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  declineButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  declineButtonText: {
    color: '#666',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  expiryText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  choiceDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryChoiceButton: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  choiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
  },
  secondaryChoiceButtonText: {
    color: '#666',
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  declineSection: {
    padding: 20,
    alignItems: 'center',
  },
});

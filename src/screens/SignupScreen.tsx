import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import { AuthStackParamList, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import SocialLoginButtons from '../components/SocialLoginButtons';
import AuthService from '../services/AuthServiceFactory';

type SignupScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const { state, signup } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'business_owner' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else {
      // Check if email already exists
      try {
        const existingUser = await AuthService.checkEmailExists(formData.email.trim());
        if (existingUser) {
          newErrors.email = 'An account with this email already exists';
        }
      } catch (error) {
        console.error('Email check error:', error);
        // Don't block signup if check fails, but log the error
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      if (state.error) {
        Alert.alert('Signup Failed', state.error);
      } else if (state.message) {
        Alert.alert('Account Created!', state.message, [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email.trim() && validateEmail(formData.email)) {
      try {
        const exists = await AuthService.checkEmailExists(formData.email.trim());
        if (exists) {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
        }
      } catch (error) {
        console.error('Email validation error:', error);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={48} color="#007AFF" />
            <Text style={styles.logoText}>Simply</Text>
          </View>
          <Text style={styles.subtitle}>Business Tracker</Text>
          <Text style={styles.welcomeText}>Create your account</Text>
          <Text style={styles.subtitleText}>Get started with your business tracking</Text>
        </View>

        <View style={styles.socialSection}>
          <SocialLoginButtons disabled={state.isLoading} />
          <View style={styles.orDivider}>
            <View style={styles.orDividerLine} />
            <Text style={styles.orDividerText}>Or sign up with email</Text>
            <View style={styles.orDividerLine} />
          </View>
        </View>

        <View style={styles.form}>

          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, styles.nameInput]}>
              <Text style={styles.label}>First Name</Text>
              <View style={[styles.inputContainer, errors.firstName ? styles.inputError : null]}>
                <TextInput
                  style={styles.textInput}
                  value={formData.firstName}
                  onChangeText={(text) => updateFormData('firstName', text)}
                  placeholder="First name"
                  autoCapitalize="words"
                  editable={!state.isLoading}
                />
              </View>
              {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
            </View>

            <View style={[styles.inputGroup, styles.nameInput]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={[styles.inputContainer, errors.lastName ? styles.inputError : null]}>
                <TextInput
                  style={styles.textInput}
                  value={formData.lastName}
                  onChangeText={(text) => updateFormData('lastName', text)}
                  placeholder="Last name"
                  autoCapitalize="words"
                  editable={!state.isLoading}
                />
              </View>
              {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                onBlur={handleEmailBlur}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!state.isLoading}
              />
            </View>
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!state.isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputContainer, errors.confirmPassword ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!state.isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.signupButton, state.isLoading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={state.isLoading}
          >
            <Text style={styles.signupButtonText}>
              {state.isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {state.error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#F44336" />
              <Text style={styles.errorMessage}>{state.error}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={state.isLoading}
          >
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.teamMemberSection}>
          <Text style={styles.teamMemberText}>Joining a team?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TeamMemberSignup')}
            disabled={state.isLoading}
          >
            <Text style={styles.teamMemberLink}>Join with invitation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  socialSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  orDividerText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameInput: {
    flex: 1,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#ffebee',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  signupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: '#ccc',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  teamMemberSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  teamMemberText: {
    fontSize: 14,
    color: '#666',
  },
  teamMemberLink: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
});

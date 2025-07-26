import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'BusinessOnboarding'>;
};

export default function BusinessOnboardingScreen({ navigation }: Props) {
  const { state } = useAuth();

  const handleCreateBusiness = () => {
    if (state.user) {
      navigation.navigate('CreateBusiness', { userId: state.user.id });
    }
  };

  const handleWaitForInvitation = () => {
    navigation.navigate('WaitingForInvitation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={64} color="#007AFF" />
          </View>
          <Text style={styles.title}>Welcome to Simply!</Text>
          <Text style={styles.subtitle}>
            Let's get you set up. You can either create your own business or join an existing one.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={handleCreateBusiness}>
            <View style={styles.optionIcon}>
              <Ionicons name="add-circle" size={48} color="#007AFF" />
            </View>
            <Text style={styles.optionTitle}>Create a Business</Text>
            <Text style={styles.optionDescription}>
              Start your own business and invite team members to join you.
            </Text>
            <View style={styles.optionButton}>
              <Text style={styles.optionButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#007AFF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={handleWaitForInvitation}>
            <View style={styles.optionIcon}>
              <Ionicons name="mail" size={48} color="#28A745" />
            </View>
            <Text style={styles.optionTitle}>Join a Business</Text>
            <Text style={styles.optionDescription}>
              Wait for an invitation from a business owner to join their team.
            </Text>
            <View style={styles.optionButton}>
              <Text style={[styles.optionButtonText, { color: '#28A745' }]}>Wait for Invite</Text>
              <Ionicons name="arrow-forward" size={20} color="#28A745" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={24} color="#666" />
            <Text style={styles.infoText}>
              You can always create or join additional businesses later from your profile.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoSection: {
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

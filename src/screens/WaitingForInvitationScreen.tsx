import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import TeamInvitationService, { TeamInvitation } from '../services/TeamInvitationService';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'WaitingForInvitation'>;
};

export default function WaitingForInvitationScreen({ navigation }: Props) {
  const { state, logout } = useAuth();
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    if (!state.user?.email) return;

    try {
      const userInvitations = await TeamInvitationService.getUserInvitations(state.user.email);
      setInvitations(userInvitations);
    } catch (error) {
      console.error('Load invitations error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvitations();
    setRefreshing(false);
  };

  const handleAcceptInvitation = async (invitation: TeamInvitation) => {
    try {
      const result = await TeamInvitationService.acceptInvitation(
        invitation.token,
        state.user!.email
      );

      if (result.success) {
        Alert.alert(
          'Invitation Accepted!',
          `Welcome to ${invitation.businessName}!`,
          [{ text: 'OK', onPress: () => {
            // Refresh the app to load the new business
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      Alert.alert('Error', 'Failed to accept invitation');
    }
  };

  const handleCreateBusiness = () => {
    if (state.user) {
      navigation.navigate('CreateBusiness', { userId: state.user.id });
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const renderInvitation = (invitation: TeamInvitation) => (
    <View key={invitation.id} style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <View style={styles.businessIcon}>
          <Ionicons name="business" size={24} color="#007AFF" />
        </View>
        <View style={styles.invitationInfo}>
          <Text style={styles.businessName}>{invitation.businessName}</Text>
          <Text style={styles.inviterName}>Invited by {invitation.inviterName}</Text>
          <Text style={styles.role}>Role: {invitation.role.replace('_', ' ')}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => handleAcceptInvitation(invitation)}
      >
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.acceptButtonText}>Accept Invitation</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
          
          <View style={styles.iconContainer}>
            <Ionicons name="mail-open" size={64} color="#007AFF" />
          </View>
          
          <Text style={styles.title}>Waiting for Invitations</Text>
          <Text style={styles.subtitle}>
            You'll receive invitations here when business owners invite you to join their team.
          </Text>
        </View>

        {invitations.length > 0 ? (
          <View style={styles.invitationsContainer}>
            <Text style={styles.sectionTitle}>Pending Invitations</Text>
            {invitations.map(renderInvitation)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>No Invitations Yet</Text>
            <Text style={styles.emptyText}>
              Pull down to refresh and check for new invitations.
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.createBusinessButton} onPress={handleCreateBusiness}>
            <Ionicons name="add-circle" size={20} color="#007AFF" />
            <Text style={styles.createBusinessText}>Create Your Own Business Instead</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.infoText}>
              Business owners can invite you by email. Make sure they use the email address: {state.user?.email}
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
    marginBottom: 30,
    paddingTop: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
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
    fontSize: 24,
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
  invitationsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  businessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  inviterName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  createBusinessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  createBusinessText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
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

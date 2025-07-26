import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';

import { BusinessMember, BusinessRole } from '../types/database';
import { RootStackParamList } from '../types';
import DatabaseService from '../services/DatabaseServiceFactory';
import TeamInvitationService, { TeamInvitation } from '../services/TeamInvitationService';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ManageTeam'>;
};

export default function ManageTeamScreen({ navigation }: Props) {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<BusinessRole>(BusinessRole.EMPLOYEE);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      if (!state.user?.businessId) return;

      const [teamMembers, teamInvitations] = await Promise.all([
        DatabaseService.getBusinessMembers(state.user.businessId),
        TeamInvitationService.getBusinessInvitations(state.user.businessId)
      ]);

      setMembers(teamMembers);
      setInvitations(teamInvitations);
    } catch (error) {
      console.error('Load team data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteTeamMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!inviteEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!state.user?.businessId || !state.user?.id) {
      Alert.alert('Error', 'Business information not available');
      return;
    }

    try {
      setInviting(true);

      const result = await TeamInvitationService.sendInvitation(
        state.user.businessId,
        state.user.id,
        inviteEmail.trim(),
        inviteRole
      );

      if (result.success) {
        Alert.alert(
          'Invitation Sent',
          `Team invitation has been sent to ${inviteEmail}`,
          [{ text: 'OK', onPress: () => {
            setShowInviteModal(false);
            setInviteEmail('');
            loadTeamData();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invite team member error:', error);
      Alert.alert('Error', 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await TeamInvitationService.cancelInvitation(invitationId);
      
      if (result.success) {
        Alert.alert('Success', 'Invitation cancelled');
        loadTeamData();
      } else {
        Alert.alert('Error', result.error || 'Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Cancel invitation error:', error);
      Alert.alert('Error', 'Failed to cancel invitation');
    }
  };

  const getRoleDisplayName = (role: BusinessRole) => {
    switch (role) {
      case BusinessRole.OWNER:
        return 'Owner';
      case BusinessRole.MANAGER:
        return 'Manager';
      case BusinessRole.EMPLOYEE:
        return 'Employee';
      case BusinessRole.ACCOUNTANT:
        return 'Accountant';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'accepted':
        return '#28a745';
      case 'declined':
        return '#dc3545';
      case 'expired':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const renderMember = ({ item }: { item: BusinessMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberIcon}>
        <Ionicons name="person" size={24} color="#007AFF" />
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>Team Member</Text>
        <Text style={styles.memberRole}>{getRoleDisplayName(item.role)}</Text>
        <Text style={styles.memberDate}>
          Joined {new Date(item.joinedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.memberActions}>
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </View>
    </View>
  );

  const renderInvitation = ({ item }: { item: TeamInvitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationIcon}>
        <Ionicons name="mail" size={24} color="#ffc107" />
      </View>
      <View style={styles.invitationInfo}>
        <Text style={styles.invitationEmail}>{item.inviteeEmail}</Text>
        <Text style={styles.invitationRole}>{getRoleDisplayName(item.role)}</Text>
        <View style={styles.invitationStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelInvitation(item.id)}
        >
          <Ionicons name="close" size={20} color="#dc3545" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading team...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Management</Text>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Ionicons name="person-add" size={20} color="white" />
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={[
          ...members.map(m => ({ ...m, type: 'member' })),
          ...invitations.map(i => ({ ...i, type: 'invitation' }))
        ]}
        renderItem={({ item }) => 
          item.type === 'member' 
            ? renderMember({ item: item as BusinessMember })
            : renderInvitation({ item: item as TeamInvitation })
        }
        keyExtractor={(item) => `${item.type}-${item.id}`}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Team Members</Text>
            <Text style={styles.emptyText}>
              Invite team members to help manage your business
            </Text>
          </View>
        }
      />

      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowInviteModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Invite Team Member</Text>
            <TouchableOpacity
              onPress={handleInviteTeamMember}
              disabled={inviting}
              style={[styles.modalSendButton, inviting && styles.modalSendButtonDisabled]}
            >
              {inviting ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.modalSendText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="Enter team member's email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={inviteRole}
                  onValueChange={setInviteRole}
                  style={styles.picker}
                >
                  <Picker.Item label="Employee" value={BusinessRole.EMPLOYEE} />
                  <Picker.Item label="Manager" value={BusinessRole.MANAGER} />
                  <Picker.Item label="Accountant" value={BusinessRole.ACCOUNTANT} />
                </Picker>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>How it works</Text>
                <Text style={styles.infoText}>
                  An invitation email will be sent to the team member. They can create an account or sign in to join your business.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 12,
    color: '#666',
  },
  memberActions: {
    padding: 8,
  },
  invitationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  invitationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff3cd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  invitationRole: {
    fontSize: 14,
    color: '#ffc107',
    marginBottom: 4,
  },
  invitationStatus: {
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
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  cancelButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSendButton: {
    padding: 8,
  },
  modalSendButtonDisabled: {
    opacity: 0.6,
  },
  modalSendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
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
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
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

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import DatabaseService from '../services/DatabaseServiceFactory';

interface Props {
  onBusinessDeleted: () => void;
}

export default function DangerZone({ onBusinessDeleted }: Props) {
  const { state, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const currentBusiness = state.currentBusiness;
  const isOwner = state.currentUserRole === 'OWNER';

  if (!isOwner || !currentBusiness) {
    return null;
  }

  const handleDeleteBusiness = () => {
    Alert.alert(
      '⚠️ Danger Zone',
      'You are about to enter the danger zone. This area contains actions that cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => setShowDeleteModal(true) }
      ]
    );
  };

  const confirmDelete = async () => {
    if (confirmationText !== currentBusiness.name) {
      Alert.alert('Error', 'Business name does not match. Please type the exact business name.');
      return;
    }

    Alert.alert(
      '🚨 Final Warning',
      `Are you absolutely sure you want to delete "${currentBusiness.name}"?\n\nThis will:\n• Delete all business data\n• Remove all team members\n• Delete all transactions\n• Cannot be undone\n\nType "DELETE" to confirm:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Type DELETE',
              'Type "DELETE" in capital letters to confirm:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: (text) => {
                    if (text === 'DELETE') {
                      performDelete();
                    } else {
                      Alert.alert('Error', 'You must type "DELETE" exactly to confirm.');
                    }
                  }
                }
              ],
              'plain-text'
            );
          }
        }
      ]
    );
  };

  const performDelete = async () => {
    try {
      setIsDeleting(true);

      if (!state.user || !currentBusiness) {
        throw new Error('User or business not found');
      }

      await DatabaseService.deleteBusiness(currentBusiness.id, state.user.id);

      // Check how many businesses the user has left
      const remainingBusinesses = state.businesses.filter(b => b.id !== currentBusiness.id);

      const message = remainingBusinesses.length > 0
        ? `"${currentBusiness.name}" has been deleted. You will be redirected to select another business.`
        : `"${currentBusiness.name}" has been deleted. You will be redirected to create a new business or wait for invitations.`;

      Alert.alert(
        'Business Deleted',
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowDeleteModal(false);
              onBusinessDeleted();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Delete business error:', error);
      Alert.alert(
        'Delete Failed',
        error instanceof Error ? error.message : 'Failed to delete business. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <View style={styles.dangerZone}>
        <View style={styles.dangerHeader}>
          <Ionicons name="warning" size={24} color="#FF3B30" />
          <Text style={styles.dangerTitle}>Danger Zone</Text>
        </View>
        <Text style={styles.dangerDescription}>
          Irreversible and destructive actions. Proceed with extreme caution.
        </Text>
        
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteBusiness}>
          <Ionicons name="trash" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Business</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showDeleteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delete Business</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.warningSection}>
              <Ionicons name="warning" size={48} color="#FF3B30" />
              <Text style={styles.warningTitle}>This action cannot be undone</Text>
              <Text style={styles.warningText}>
                Deleting "{currentBusiness.name}" will permanently remove:
              </Text>
              
              <View style={styles.consequencesList}>
                <View style={styles.consequenceItem}>
                  <Ionicons name="business" size={16} color="#FF3B30" />
                  <Text style={styles.consequenceText}>All business information</Text>
                </View>
                <View style={styles.consequenceItem}>
                  <Ionicons name="people" size={16} color="#FF3B30" />
                  <Text style={styles.consequenceText}>All team members and access</Text>
                </View>
                <View style={styles.consequenceItem}>
                  <Ionicons name="card" size={16} color="#FF3B30" />
                  <Text style={styles.consequenceText}>All transactions and financial data</Text>
                </View>
                <View style={styles.consequenceItem}>
                  <Ionicons name="stats-chart" size={16} color="#FF3B30" />
                  <Text style={styles.consequenceText}>All reports and analytics</Text>
                </View>
              </View>
            </View>

            <View style={styles.confirmationSection}>
              <Text style={styles.confirmationLabel}>
                Type the business name to confirm: <Text style={styles.businessName}>"{currentBusiness.name}"</Text>
              </Text>
              <TextInput
                style={styles.confirmationInput}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder={currentBusiness.name}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.confirmDeleteButton,
                (confirmationText !== currentBusiness.name || isDeleting) && styles.confirmDeleteButtonDisabled
              ]}
              onPress={confirmDelete}
              disabled={confirmationText !== currentBusiness.name || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="white" />
                  <Text style={styles.confirmDeleteButtonText}>Delete Business Forever</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dangerZone: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  warningSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  consequencesList: {
    alignSelf: 'stretch',
  },
  consequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  consequenceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  confirmationSection: {
    marginBottom: 32,
  },
  confirmationLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  businessName: {
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  confirmationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  confirmDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  confirmDeleteButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmDeleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

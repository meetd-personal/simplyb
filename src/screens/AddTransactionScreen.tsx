import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList, Category } from '../types';
import TransactionService from '../services/TransactionService';

type AddTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddTransaction'>;
type AddTransactionScreenRouteProp = RouteProp<RootStackParamList, 'AddTransaction'>;

interface Props {
  navigation: AddTransactionScreenNavigationProp;
  route: AddTransactionScreenRouteProp;
}

export default function AddTransactionScreen({ navigation, route }: Props) {
  const { type } = route.params;
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [date] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const allCategories = await TransactionService.getCategories();
      const filteredCategories = allCategories.filter(cat => cat.type === type);
      setCategories(filteredCategories);
      
      // Auto-select first category if available
      if (filteredCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(filteredCategories[0]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSave = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await TransactionService.addTransaction({
        type,
        amount: numericAmount,
        description,
        category: selectedCategory.name,
        date,
      });

      Alert.alert(
        'Success',
        `${type === 'revenue' ? 'Revenue' : 'Expense'} added successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => {
        setSelectedCategory(item);
        setShowCategoryModal(false);
      }}
    >
      <View style={[styles.categoryColor, { backgroundColor: item.color }]} />
      <Text style={styles.categoryName}>{item.name}</Text>
      {selectedCategory?.id === item.id && (
        <Ionicons name="checkmark" size={20} color="#007AFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Add {type === 'revenue' ? 'Revenue' : 'Expense'}
        </Text>
        <Text style={styles.subtitle}>
          Track your {type === 'revenue' ? 'income' : 'business expenses'}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder={`Enter ${type} description`}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            {selectedCategory ? (
              <View style={styles.selectedCategoryContainer}>
                <View style={[styles.categoryColor, { backgroundColor: selectedCategory.color }]} />
                <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Select a category</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dateSelector}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: type === 'revenue' ? '#4CAF50' : '#F44336' }
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : `Save ${type === 'revenue' ? 'Revenue' : 'Expense'}`}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            style={styles.categoryList}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  form: {
    padding: 20,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 16,
    color: '#333',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categorySelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  dateSelector: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  categoryList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCategoryItem: {
    backgroundColor: '#f0f8ff',
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

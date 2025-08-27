/**
 * AI Personal Assistant - Reminders, Scheduling & Meetings
 * A comprehensive personal assistant for managing important dates, schedules, and meetings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';

// Types
interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'reminder' | 'meeting' | 'task';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
}

// Main AI Personal Assistant Component
export default function AIPersonalAssistant() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'reminder' | 'meeting' | 'task'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Format date
  const formatDate = (dateString: string, timeString: string) => {
    const date = new Date(`${dateString} ${timeString}`);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const addReminder = (reminderData: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setReminders(prev => [...prev, newReminder]);
    setShowAddModal(false);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setShowAddModal(false);
    setSelectedReminder(null);
  };

  const deleteReminder = (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setReminders(prev => prev.filter(r => r.id !== id)),
        },
      ]
    );
  };

  const toggleComplete = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const getFilteredReminders = () => {
    let filtered = reminders;

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ff8800';
      case 'low': return '#00C851';
      default: return '#2196F3';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'task': return '✅';
      case 'reminder': return '🔔';
      default: return '📅';
    }
  };

  const filteredReminders = getFilteredReminders();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Personal Assistant</Text>
        <Text style={styles.headerSubtitle}>Smart Reminders & Scheduling</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search reminders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'reminder', 'meeting', 'task'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && styles.filterButtonActive
                ]}
                onPress={() => setFilterType(type as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterType === type && styles.filterButtonTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* All Reminders */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>All Reminders ({filteredReminders.length})</Text>
          {filteredReminders.length === 0 ? (
            <Text style={styles.emptyText}>
              No reminders found. Tap the + button to add your first reminder!
            </Text>
          ) : (
            filteredReminders.map((reminder: Reminder) => (
              <View key={reminder.id} style={styles.reminderItem}>
                <View style={styles.reminderContent}>
                  <View style={styles.reminderHeader}>
                    <Text style={styles.reminderIcon}>{getTypeIcon(reminder.type)}</Text>
                    <View style={styles.reminderText}>
                      <Text style={[
                        styles.reminderTitle,
                        reminder.completed && styles.completedText,
                      ]}>
                        {reminder.title}
                      </Text>
                      <Text style={styles.reminderDescription}>
                        {reminder.description}
                      </Text>
                      <View style={styles.reminderMeta}>
                        <Text style={styles.reminderDate}>
                          {formatDate(reminder.date, reminder.time)}
                        </Text>
                        <View style={[
                          styles.priorityBadge,
                          { backgroundColor: getPriorityColor(reminder.priority) }
                        ]}>
                          <Text style={styles.priorityText}>{reminder.priority}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.reminderActions}>
                  <TouchableOpacity
                    onPress={() => toggleComplete(reminder.id)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>
                      {reminder.completed ? '✓' : '○'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedReminder(reminder);
                      setShowAddModal(true);
                    }}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteReminder(reminder.id)}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Reminder Modal */}
      <AddReminderModal
        visible={showAddModal}
        reminder={selectedReminder}
        onDismiss={() => {
          setShowAddModal(false);
          setSelectedReminder(null);
        }}
        onSave={addReminder}
        onUpdate={updateReminder}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// Add/Edit Reminder Modal Component
function AddReminderModal({ visible, reminder, onDismiss, onSave, onUpdate }: any) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    date: string;
    time: string;
    type: 'reminder' | 'meeting' | 'task';
    priority: 'low' | 'medium' | 'high';
  }>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toISOString().split('T')[1].substring(0, 5),
    type: 'reminder',
    priority: 'medium',
  });

  useEffect(() => {
    if (reminder) {
      setFormData({
        title: reminder.title,
        description: reminder.description,
        date: reminder.date,
        time: reminder.time,
        type: reminder.type,
        priority: reminder.priority,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1].substring(0, 5),
        type: 'reminder',
        priority: 'medium',
      });
    }
  }, [reminder]);

  const handleSave = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the reminder');
      return;
    }

    if (reminder) {
      onUpdate(reminder.id, formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>
            {reminder ? 'Edit Reminder' : 'Add New Reminder'}
          </Text>

          <TextInput
            placeholder="Title"
            value={formData.title}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, title: text }))}
            style={styles.input}
          />

          <TextInput
            placeholder="Description"
            value={formData.description}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              value={formData.date}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, date: text }))}
              style={[styles.input, styles.halfInput]}
            />
            <TextInput
              placeholder="Time (HH:MM)"
              value={formData.time}
              onChangeText={(text: string) => setFormData(prev => ({ ...prev, time: text }))}
              style={[styles.input, styles.halfInput]}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.buttonGroup}>
                {['reminder', 'meeting', 'task'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      formData.type === type && styles.typeButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type: type as 'reminder' | 'meeting' | 'task' }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextActive
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.buttonGroup}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, priority: priority as 'low' | 'medium' | 'high' }))}
                  >
                    <Text style={[
                      styles.priorityButtonText,
                      formData.priority === priority && styles.priorityButtonTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onDismiss} style={[styles.modalButton, styles.cancelButton]}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.modalButton, styles.saveButton]}>
              <Text style={styles.saveButtonText}>{reminder ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterButtonText: {
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  card: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reminderContent: {
    flex: 1,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderDate: {
    fontSize: 12,
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  reminderActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  actionButtonText: {
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  priorityButtonActive: {
    backgroundColor: '#ff8800',
    borderColor: '#ff8800',
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#666',
  },
  priorityButtonTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  saveButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
});

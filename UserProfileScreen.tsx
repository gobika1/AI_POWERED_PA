import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import firestoreService, { User, UserPreferences } from './firestore.service';

interface UserProfileScreenProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  onClose: () => void;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
  user,
  onUserUpdate,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedUser, setEditedUser] = useState<User>({ ...user });
  const [stats, setStats] = useState<{
    totalReminders: number;
    completedReminders: number;
    totalSessions: number;
  } | null>(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const reminders = await firestoreService.getReminders(user.id);
      // Note: getUserSessions method not implemented yet, using placeholder
      const sessions: any[] = [];
      
      setStats({
        totalReminders: reminders.length,
        completedReminders: reminders.filter(r => r.completed).length,
        totalSessions: sessions.length,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await firestoreService.updateUser(user.id, {
        name: editedUser.name,
        email: editedUser.email,
        profilePicture: editedUser.profilePicture,
        preferences: editedUser.preferences,
      });

      if (success) {
        const updatedUser = await firestoreService.getUser(user.id);
        if (updatedUser) {
          onUserUpdate(updatedUser);
          setIsEditing(false);
          Alert.alert('Success', 'Profile updated successfully!');
        }
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    setEditedUser(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      } as UserPreferences,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Profile</Text>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Picture */}
      <View style={styles.profileSection}>
        <View style={styles.profilePictureContainer}>
          {editedUser.profilePicture ? (
            <Image source={{ uri: editedUser.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Text style={styles.profilePictureText}>
                {editedUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        {isEditing && (
          <TouchableOpacity style={styles.changePictureButton}>
            <Text style={styles.changePictureText}>Change Picture</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={editedUser.name}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              placeholderTextColor="#666"
            />
          ) : (
            <Text style={styles.fieldValue}>{user.name}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email</Text>
          {isEditing ? (
            <TextInput
              style={styles.textInput}
              value={editedUser.email}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.fieldValue}>{user.email}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Member Since</Text>
          <Text style={styles.fieldValue}>
            {user.createdAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Last Login</Text>
          <Text style={styles.fieldValue}>
            {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : 'Never'}
          </Text>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Theme</Text>
          {isEditing ? (
            <View style={styles.themeSelector}>
              {['light', 'dark', 'auto'].map((theme) => (
                <TouchableOpacity
                  key={theme}
                  style={[
                    styles.themeOption,
                    editedUser.preferences?.theme === theme && styles.themeOptionSelected
                  ]}
                  onPress={() => updatePreference('theme', theme)}
                >
                  <Text style={[
                    styles.themeOptionText,
                    editedUser.preferences?.theme === theme && styles.themeOptionTextSelected
                  ]}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.preferenceValue}>
              {user.preferences?.theme ? user.preferences.theme.charAt(0).toUpperCase() + user.preferences.theme.slice(1) : 'Auto'}
            </Text>
          )}
        </View>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Notifications</Text>
          {isEditing ? (
            <Switch
              value={editedUser.preferences?.notifications ?? true}
              onValueChange={(value) => updatePreference('notifications', value)}
              trackColor={{ false: '#767577', true: '#4A90E2' }}
              thumbColor={editedUser.preferences?.notifications ? '#FFFFFF' : '#f4f3f4'}
            />
          ) : (
            <Text style={styles.preferenceValue}>
              {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
            </Text>
          )}
        </View>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Voice Commands</Text>
          {isEditing ? (
            <Switch
              value={editedUser.preferences?.voiceEnabled ?? true}
              onValueChange={(value) => updatePreference('voiceEnabled', value)}
              trackColor={{ false: '#767577', true: '#4A90E2' }}
              thumbColor={editedUser.preferences?.voiceEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          ) : (
            <Text style={styles.preferenceValue}>
              {user.preferences?.voiceEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          )}
        </View>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Language</Text>
          {isEditing ? (
            <View style={styles.languageSelector}>
              {[
                { code: 'en', name: 'English' },
                { code: 'es', name: 'Spanish' },
                { code: 'fr', name: 'French' },
                { code: 'de', name: 'German' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    editedUser.preferences?.language === lang.code && styles.languageOptionSelected
                  ]}
                  onPress={() => updatePreference('language', lang.code)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    editedUser.preferences?.language === lang.code && styles.languageOptionTextSelected
                  ]}>
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.preferenceValue}>
              {user.preferences?.language === 'en' ? 'English' : 
               user.preferences?.language === 'es' ? 'Spanish' :
               user.preferences?.language === 'fr' ? 'French' :
               user.preferences?.language === 'de' ? 'German' : 'English'}
            </Text>
          )}
        </View>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Timezone</Text>
          <Text style={styles.preferenceValue}>
            {user.preferences?.timezone || 'System Default'}
          </Text>
        </View>
      </View>

      {/* Statistics */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalReminders}</Text>
              <Text style={styles.statLabel}>Total Reminders</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completedReminders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  profilePictureContainer: {
    marginBottom: 12,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePictureText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  changePictureButton: {
    marginTop: 8,
  },
  changePictureText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 4,
  },
  fieldValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  textInput: {
    backgroundColor: '#2A2A3E',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  preferenceLabel: {
    color: '#CCCCCC',
    fontSize: 16,
    flex: 1,
  },
  preferenceValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#444',
  },
  themeOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  themeOptionText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  themeOptionTextSelected: {
    color: '#FFFFFF',
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    borderWidth: 1,
    borderColor: '#444',
  },
  languageOptionSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  languageOptionText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  languageOptionTextSelected: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#4A90E2',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
  },
});

export default UserProfileScreen;

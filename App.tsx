import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Alert,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  PermissionsAndroid,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import { initNotifications, scheduleNotification, displayNotification, scheduleReminderWithAlerts, getReminderNotificationStatus } from './notifications';
import { initWakeWord, startWakeWord, stopWakeWord, destroyWakeWord, onWakeWord } from './voice';
import VoiceAssistant, { VoiceResponse } from './voice-assistant';
import firestoreService, { User, UserPreferences } from './firestore.service';
import LoginScreen from './LoginScreen';
import UserProfileScreen from './UserProfileScreen';
import weatherService, { WeatherData } from './weather.service';
import newsService, { NewsArticle, NewsResponse } from './news.service';
import locationService from './location.service';
import cacheService from './cache.service';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { initializeFCM, getFCMToken, sendTokenToServer } from './firebase-messaging.service';

// Add error handling for Firebase initialization
try {
  require('./firebase.config');
} catch (error) {
  console.log('Firebase config not loaded, continuing without it:', error);
}

// Add error handling for Voice module
let VoiceModule: any = null;
try {
  VoiceModule = require('@react-native-voice/voice');
} catch (error) {
  console.log('Voice module not loaded, continuing without voice recognition:', error);
  VoiceModule = null;
}

// Types
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'weather' | 'news';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  data?: any;
}

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

const { width, height } = Dimensions.get('window');

// Main App Component
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <AppContent />
    </SafeAreaProvider>
  );
}

// App Content Component
function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your AI personal assistant. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [userName, setUserName] = useState('User');
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  
  // Meeting/Reminder modal state
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderType, setReminderType] = useState<'reminder' | 'meeting' | 'task'>('reminder');

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Handle Firebase Auth state changes
  useEffect(() => {
    let subscriber: any = null;
    
    const initializeAuth = async () => {
      try {
        // Test Firebase connection with a timeout
        const testPromise = auth().currentUser;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Firebase connection timeout')), 5000);
        });
        
        await Promise.race([testPromise, timeoutPromise]);
        
        // Firebase is working, set up auth state listener
        subscriber = auth().onAuthStateChanged(async (user) => {
          console.log('Auth state changed:', user?.email);
          setFirebaseUser(user);
          
          if (user) {
            // User is signed in, handle login
            await handleFirebaseLogin(user);
          } else {
            // User is signed out
            setIsLoggedIn(false);
            setUserData(null);
            setCurrentUserId(null);
            setCurrentSessionId(null);
            setMessages([{
              id: '1',
              type: 'assistant',
              content: "Hello! I'm your AI personal assistant. How can I help you today?",
              timestamp: new Date(),
            }]);
            setReminders([]);
          }
          
          if (initializing) setInitializing(false);
        });
      } catch (error) {
        console.log('Firebase not available, using demo mode:', error);
        // Firebase not available, skip auth state listener
        if (initializing) setInitializing(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      if (subscriber) {
        subscriber(); // unsubscribe on unmount
      }
    };
  }, [initializing]);

  // Initialize voice assistant and check voice availability
  useEffect(() => {
    const initVoice = async () => {
      try {
        if (VoiceModule && typeof VoiceModule.start === 'function') {
          setIsVoiceAvailable(true);
          await VoiceAssistant.init('user123');
          VoiceAssistant.setCommandResultCallback(handleVoiceResponse);
        }
      } catch (error) {
        console.log('Voice initialization error:', error);
        setIsVoiceAvailable(false);
      }
    };

    initVoice();
  }, []);

  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    const initFCM = async () => {
      try {
        await initializeFCM();
        console.log('FCM initialized successfully');
      } catch (error) {
        console.log('FCM initialization error:', error);
      }
    };

    initFCM();
  }, []);

  // Initialize wake word
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await initWakeWord();
      if (!ok || !mounted) return;
      onWakeWord(() => {
        if (!isListening) {
          startVoiceListening();
        }
      });
    })();
    return () => {
      mounted = false;
      stopWakeWord();
      destroyWakeWord();
    };
  }, [isListening]);

  // Animate microphone when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  // Handle voice assistant responses
  const handleVoiceResponse = (response: VoiceResponse) => {
    setIsProcessing(false);
    
    // Add assistant response to chat
    addMessage('assistant', response.message);
    
    if (response.success) {
      // Update reminders if data was returned
      if (response.data?.reminders) {
        setReminders(response.data.reminders);
      }
    }
  };

  // Add message to chat
  const addMessage = (type: 'user' | 'assistant' | 'weather' | 'news', content: string, isVoice = false, data?: any) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      type,
      content,
      timestamp: new Date(),
      isVoice,
      data
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Enhanced query parsing for weather and news
  const parseUserQuery = (input: string): { type: 'weather' | 'news' | 'other', location?: string, category?: string, query?: string } => {
    const lowerInput = input.toLowerCase();
    
    // Weather patterns
    const weatherPatterns = [
      /weather in (.+)/i,
      /weather at (.+)/i,
      /weather for (.+)/i,
      /forecast in (.+)/i,
      /forecast for (.+)/i,
      /temperature in (.+)/i,
      /temperature at (.+)/i,
      /how.*weather.*in (.+)/i,
      /what.*weather.*like.*in (.+)/i
    ];

    // News patterns with categories
    const newsPatterns = [
      /news (about|on) (.+)/i,
      /headlines (about|on) (.+)/i,
      /latest news (about|on) (.+)/i,
      /(business|tech|technology|sports|health|science|entertainment) news/i,
      /news in (.+)/i,
      /news from (.+)/i,
      /headlines in (.+)/i,
      /headlines from (.+)/i
    ];

    // Check for weather queries
    if (lowerInput.includes('weather') || lowerInput.includes('temperature') || lowerInput.includes('forecast')) {
      for (const pattern of weatherPatterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
          return { type: 'weather', location: match[1].trim() };
        }
      }
      
      // Check for "my location" or "here"
      if (lowerInput.includes('my location') || lowerInput.includes('here') || lowerInput.includes('current location')) {
        return { type: 'weather', location: 'current' };
      }
      
      return { type: 'weather' };
    }

    // Check for news queries
    if (lowerInput.includes('news') || lowerInput.includes('headlines') || lowerInput.includes('latest')) {
      // Check for category-specific news
      const categories = ['business', 'technology', 'tech', 'sports', 'health', 'science', 'entertainment'];
      for (const category of categories) {
        if (lowerInput.includes(category)) {
          const mappedCategory = category === 'tech' ? 'technology' : category;
          return { type: 'news', category: mappedCategory };
        }
      }
      
      // Check for location-based news
      for (const pattern of newsPatterns) {
        const match = input.match(pattern);
        if (match) {
          if (match[1] && (match[1] === 'about' || match[1] === 'on')) {
            return { type: 'news', query: match[2].trim() };
          } else if (match[1]) {
            return { type: 'news', location: match[1].trim() };
          }
        }
      }
      
      return { type: 'news', query: 'general' };
    }

    return { type: 'other' };
  };

  // Fetch weather data with location services and caching
  const fetchWeatherData = async (location?: string) => {
    try {
      setIsProcessing(true);
      
      let weatherData: WeatherData | null = null;
      
      if (!location || location === 'current') {
        // Try to get weather for current location
        addMessage('assistant', "Getting weather for your current location...");
        weatherData = await weatherService.getWeatherForCurrentLocation();
        
        if (!weatherData) {
          // Fallback to default city if location services fail
          weatherData = await weatherService.getCurrentWeather('New York');
        }
      } else {
        weatherData = await weatherService.getCurrentWeather(location);
      }
      
      if (weatherData && weatherData.temperature !== undefined) {
        const locationName = location && location !== 'current' ? location : weatherData.city;
        const cacheAge = cacheService.getCacheAge('weather', locationName);
        let cacheInfo = '';
        
        if (cacheAge !== null) {
          const ageMinutes = Math.floor(cacheAge / (1000 * 60));
          cacheInfo = ageMinutes > 0 ? ` (cached ${ageMinutes}m ago)` : ' (fresh data)';
        }
        
        addMessage('weather', `Here's the current weather in ${locationName}${cacheInfo}:`, false, weatherData);
      } else {
        const locationName = location && location !== 'current' ? location : 'that location';
        addMessage('assistant', `Sorry, I couldn't find weather information for ${locationName}. Please try another location or check the spelling.`);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      const locationName = location && location !== 'current' ? location : 'that location';
      addMessage('assistant', `Sorry, I encountered an error while fetching weather data for ${locationName}. Please try again later.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch news data with improved categorization
  const fetchNewsData = async (query?: string, category?: string, location?: string) => {
    try {
      setIsProcessing(true);
      
      let newsData: NewsArticle[] = [];
      let searchTerm = query || category || location || 'general';
      
      if (category) {
        newsData = await newsService.getNewsByCategory(category);
        searchTerm = category;
      } else if (query && query !== 'general') {
        newsData = await newsService.searchNews(query);
        searchTerm = query;
      } else {
        newsData = await newsService.getTopHeadlines('general');
        searchTerm = 'general';
      }
      
      if (newsData.length > 0) {
        const emoji = category ? newsService.getCategoryEmoji(category) : '📰';
        let messageContent = '';
        
        if (category) {
          messageContent = `${emoji} Here are the latest ${category} news headlines:`;
        } else if (query && query !== 'general') {
          messageContent = `📰 Here are news articles about "${query}":`;
        } else {
          messageContent = `📰 Here are today's top news headlines:`;
        }
        
        addMessage('news', messageContent, false, newsData);
      } else {
        addMessage('assistant', `Sorry, I couldn't find any news for ${searchTerm}. Please try another topic, category, or check back later.`);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      addMessage('assistant', `Sorry, I encountered an error while fetching news. Please try again later.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process user input with enhanced parsing
  const processUserInput = async (input: string) => {
    const userInput = input.trim();
    if (!userInput) return;

    // Add user message
    addMessage('user', userInput);
    setInputText('');

    // Parse the user query
    const parsedQuery = parseUserQuery(userInput);
    
    if (parsedQuery.type === 'weather') {
      if (parsedQuery.location) {
        fetchWeatherData(parsedQuery.location);
      } else {
        // Ask for location if not provided
        addMessage('assistant', "I can check the weather for you! Please specify a location (e.g., 'weather in London') or say 'weather here' for your current location.");
      }
      return;
    }

    if (parsedQuery.type === 'news') {
      fetchNewsData(parsedQuery.query, parsedQuery.category, parsedQuery.location);
      return;
    }

    // Check for reminder/meeting commands
    if (userInput.toLowerCase().includes('remind me') || 
        userInput.toLowerCase().includes('set a reminder') ||
        userInput.toLowerCase().includes('schedule meeting')) {
      setIsReminderModalVisible(true);
      return;
    }
    
    // Simple AI responses
    let response = '';
    
    if (userInput.toLowerCase().includes('joke')) {
      response = "Why did the scarecrow win an award? Because he was outstanding in his field! 😄";
    } else if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
      response = `Hello ${userName}! How can I assist you today?`;
    } else if (userInput.toLowerCase().includes('reminder') || userInput.toLowerCase().includes('remind')) {
      response = "I can help you create reminders! Try saying 'Create a reminder for team meeting tomorrow' or use the voice button to speak your request.";
    } else if (userInput.toLowerCase().includes('meeting')) {
      response = "I can help you schedule meetings! Click the 'Schedule Meeting' button or use voice commands.";
    } else if (userInput.toLowerCase().includes('weather')) {
      response = "I can check the weather for you! Try saying:\n• 'Weather in London'\n• 'What's the weather like here?'\n• 'Temperature in New York'\n• 'Weather forecast for Tokyo'";
    } else if (userInput.toLowerCase().includes('news')) {
      response = "I can fetch the latest news for you! Try saying:\n• 'Latest news'\n• 'Technology news'\n• 'Business headlines'\n• 'News about climate change'\n• 'Sports news'";
    } else if (userInput.toLowerCase().includes('help')) {
      response = "I can help you with:\n• Creating reminders and tasks\n• Scheduling meetings\n• Checking weather and forecasts (with location detection)\n• Getting latest news and headlines by category\n• Real-time data with smart caching\n• Voice commands and natural language processing\n• Telling jokes\n\nTry using the voice button for hands-free interaction!\n\n**Enhanced Features:**\n• Smart query parsing for weather and news\n• Automatic location detection\n• Data caching for faster responses\n• Category-specific news (tech, business, sports, etc.)";
    } else {
      response = "I'm here to help! You can ask me to:\n\n**Weather:** 'Weather in Tokyo', 'What's the weather here?'\n**News:** 'Latest tech news', 'Business headlines', 'News about AI'\n**Reminders:** 'Remind me to call John tomorrow'\n**Meetings:** 'Schedule a team meeting'\n\nI use smart caching for faster responses and can detect your location for weather updates. Try the voice button for natural conversation!";
    }

    // Add assistant response
    setTimeout(() => {
      addMessage('assistant', response);
    }, 500);
  };

  // Handle send button
  const handleSend = () => {
    if (inputText.trim()) {
      processUserInput(inputText);
    }
  };

  // Start voice listening
  const startVoiceListening = async () => {
    if (isListening || isProcessing) return;

    try {
      setIsListening(true);
      setIsProcessing(true);
      
      const success = await VoiceAssistant.startListening();
      if (!success) {
        Alert.alert('Error', 'Failed to start voice recognition');
        setIsListening(false);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Voice start error:', error);
      setIsListening(false);
      setIsProcessing(false);
      Alert.alert('Voice Error', 'Failed to start voice recognition');
    }
  };

  // Stop voice listening
  const stopVoiceListening = async () => {
    if (!isListening) return;

    try {
      await VoiceAssistant.stopListening();
    } catch (error) {
      console.error('Voice stop error:', error);
    } finally {
      setIsListening(false);
    }
  };

  // Request microphone permission
  const requestMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone Permission',
        message: 'We need access to your microphone for voice commands.',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // Handle voice button press
  const handleVoicePress = async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      Alert.alert('Permission required', 'Microphone permission is needed for voice commands.');
      return;
    }

    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
  };

  // Create a reminder/meeting with Firestore storage
  const createReminder = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your reminder');
      return;
    }

    if (!currentUserId) {
      Alert.alert('Error', 'Please log in to create reminders');
      return;
    }

    try {
      // Create due date from date and time inputs
      const dueDate = new Date();
      if (reminderDate && reminderTime) {
        const [year, month, day] = reminderDate.split('-').map(Number);
        const [hours, minutes] = reminderTime.split(':').map(Number);
        dueDate.setFullYear(year, month - 1, day);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        // Default to 1 hour from now
        dueDate.setHours(dueDate.getHours() + 1);
      }

      // Save to Firestore
      const reminderId = await firestoreService.createReminder({
        userId: currentUserId,
        title: reminderTitle,
        description: reminderDescription,
        dueDate: dueDate,
        completed: false,
      });

      // Create local reminder object for state
      const newReminder: Reminder = {
        id: reminderId,
        title: reminderTitle,
        description: reminderDescription,
        date: reminderDate || new Date().toISOString().split('T')[0],
        time: reminderTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
        type: reminderType,
        priority: reminderPriority,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setReminders(prev => [...prev, newReminder]);
      
      // Schedule notification with multiple alerts
      await initNotifications();
      const notificationIds = await scheduleReminderWithAlerts({
        id: `reminder_${reminderId}`,
        title: `${reminderType === 'meeting' ? 'Meeting' : 'Reminder'}: ${reminderTitle}`,
        body: reminderDescription || 'Time for your scheduled activity!',
        timestampMs: dueDate.getTime(),
        alertMinutes: [15, 5, 0], // Alert 15 min before, 5 min before, and at time
      });

      if (notificationIds.length > 0) {
        addMessage('assistant', `${reminderType === 'meeting' ? 'Meeting' : 'Reminder'} "${reminderTitle}" has been saved successfully! You'll receive ${notificationIds.length} notifications: 15 minutes before, 5 minutes before, and at the scheduled time.`);
        
        // Show a confirmation notification
        await displayNotification(
          'Reminder Scheduled ✅', 
          `Your ${reminderType} "${reminderTitle}" is set for ${new Date(dueDate).toLocaleString()} with ${notificationIds.length} alerts`
        );
      } else {
        addMessage('assistant', `${reminderType === 'meeting' ? 'Meeting' : 'Reminder'} "${reminderTitle}" has been saved, but notification scheduling failed. Please check your notification permissions.`);
      }

      // Reset form
      setReminderTitle('');
      setReminderDescription('');
      setReminderDate('');
      setReminderTime('');
      setReminderPriority('medium');
      setIsReminderModalVisible(false);
      
      console.log('Reminder created and saved to Firestore:', reminderId);
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    }
  };

  // Handle Firebase user login
  const handleFirebaseLogin = async (firebaseUser: FirebaseAuthTypes.User) => {
    try {
      const email = firebaseUser.email;
      const name = firebaseUser.displayName || email?.split('@')[0] || 'User';
      
      if (!email) {
        throw new Error('No email found in Firebase user');
      }

      // Check if user exists in Firestore
      let user = await firestoreService.getUserByEmail(email);
      
      if (!user) {
        // Create new user if doesn't exist
        const userId = await firestoreService.createUser({
          email: email.toLowerCase(),
          name: name,
        });
        user = await firestoreService.getUser(userId);
      } else {
        // Update login timestamp for existing user
        await firestoreService.updateUserLogin(user.id);
      }
      
      if (user) {
        setUserData(user);
        setCurrentUserId(user.id);
        setUserName(user.name);
        setIsLoggedIn(true);
        
        // Create user session
        const deviceInfo = `React Native App - ${Platform.OS}`;
        const sessionId = await firestoreService.createUserSession(user.id, deviceInfo);
        setCurrentSessionId(sessionId);
        
        // Send FCM token to server for push notifications
        try {
          await sendTokenToServer(user.id);
        } catch (error) {
          console.log('FCM token registration failed:', error);
        }
        
        // Load user's reminders from Firestore
        const userReminders = await firestoreService.getReminders(user.id);
        setReminders(userReminders.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description || '',
          date: r.dueDate.toISOString().split('T')[0],
          time: r.dueDate.toTimeString().split(' ')[0].substring(0, 5),
          type: 'reminder' as const,
          priority: 'medium' as const,
          completed: r.completed,
          createdAt: r.createdAt.toISOString(),
        })));
        
        // Update welcome message
        const welcomeMessage = user.lastLoginAt 
          ? `Welcome back, ${user.name}! Last seen ${user.lastLoginAt.toLocaleDateString()}. How can I help you today?`
          : `Hello ${user.name}! Welcome to your AI personal assistant. How can I help you today?`;
          
        setMessages([{
          id: '1',
          type: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
        }]);
        
        console.log('User logged in successfully:', user.email);
      }
    } catch (error) {
      console.error('Firebase login error:', error);
      Alert.alert('Login Error', 'Failed to log in. Please try again.');
    }
  };

  // Handle login callback from LoginScreen (Firebase only)
  const handleLogin = async (loginData: { email: string; name: string }) => {
    console.log('Login callback received:', loginData.email);
    
    // This callback is only called when Firebase auth succeeds
    // The actual user data will be handled by the Firebase auth state listener
  };

  // Handle logout with session cleanup
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              // Save chat history before logout
              if (currentUserId && currentSessionId && messages.length > 1) {
                const chatMessages = messages.map(msg => ({
                  id: msg.id,
                  type: msg.type,
                  content: msg.content,
                  timestamp: msg.timestamp,
                  isVoice: msg.isVoice,
                  data: msg.data,
                }));
                await firestoreService.saveChatHistory(currentUserId, chatMessages, currentSessionId);
              }
              
              // End user session
              if (currentSessionId) {
                await firestoreService.endUserSession(currentSessionId);
              }
              
              // Sign out from Firebase Auth
              await auth().signOut();
              
              console.log('User logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
              // Still proceed with logout even if operations fail
              await auth().signOut();
            }
          }
        },
      ]
    );
  };

  // Render chat message
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // Handle weather messages
    if (item.type === 'weather') {
      const weatherData = item.data || {};
      return (
        <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
          <View style={[styles.messageBubble, styles.assistantMessageBubble]}>
            <Text style={styles.messageText}>{item.content}</Text>
            
            <View style={styles.weatherContainer}>
              <Text style={styles.weatherTemp}>
                {weatherData.temperature !== undefined ? `${Math.round(weatherData.temperature)}°C` : 'N/A'}
              </Text>
              <Text style={styles.weatherDescription}>{weatherData.description || 'No description available'}</Text>
              
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherDetail}>
                  Humidity: {weatherData.humidity !== undefined ? `${weatherData.humidity}%` : 'N/A'}
                </Text>
                <Text style={styles.weatherDetail}>
                  Wind: {weatherData.windSpeed !== undefined ? `${weatherData.windSpeed} km/h` : 'N/A'}
                </Text>
                <Text style={styles.weatherDetail}>
                  Feels like: {weatherData.feelsLike !== undefined ? `${Math.round(weatherData.feelsLike)}°C` : 'N/A'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.messageTime}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }
    
    // Handle news messages
    if (item.type === 'news') {
      // Ensure we're working with an array and filter out invalid articles
      const newsItems = Array.isArray(item.data) 
        ? item.data.filter(article => article && article.title && article.title !== '[Removed]') 
        : [];
      
      return (
        <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
          <View style={[styles.messageBubble, styles.assistantMessageBubble, styles.newsBubble]}>
            <Text style={styles.messageText}>{item.content}</Text>
            
            {newsItems.length > 0 ? (
              <ScrollView style={styles.newsContainer} horizontal={true}>
                {newsItems.slice(0, 5).map((article: NewsArticle, index: number) => (
                  <View key={index} style={styles.newsItem}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {article.title}
                    </Text>
                    {article.description && (
                      <Text style={styles.newsDescription} numberOfLines={3}>
                        {article.description}
                      </Text>
                    )}
                    <Text style={styles.newsSource}>
                      {article.source?.name || 'Unknown source'}
                    </Text>
                    {article.url && (
                      <TouchableOpacity onPress={() => Linking.openURL(article.url)}>
                        <Text style={styles.newsLink}>Read more</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noNewsText}>No news articles found.</Text>
            )}
            
            <Text style={styles.messageTime}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    }
    
    // Regular chat messages
    return (
      <View style={[
        styles.messageContainer,
        item.type === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          item.type === 'user' ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.messageTime}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {item.isVoice && (
          <Text style={styles.voiceIndicator}>🎤</Text>
        )}
      </View>
    );
  };

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>🤖</Text>
        <Text style={styles.loadingSubtext}>Initializing AI Assistant...</Text>
      </View>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>AI Personal Assistant</Text>
            <Text style={styles.userGreeting}>Welcome, {userName}!</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.scheduleButton} 
            onPress={() => setShowUserProfile(true)}
          >
            <Text style={styles.scheduleButtonText}>👤 Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.scheduleButton} 
            onPress={() => setIsReminderModalVisible(true)}
          >
            <Text style={styles.scheduleButtonText}>📅 Schedule Meeting</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.scheduleButton} 
            onPress={async () => {
              // Test notification - schedule for 10 seconds from now
              await initNotifications();
              const testTime = Date.now() + 10000; // 10 seconds from now
              const nid = await scheduleNotification({
                id: `test_${Date.now()}`,
                title: '🔔 Test Notification',
                body: 'This is a test notification to verify your notification system is working!',
                timestampMs: testTime,
              });
              
              if (nid) {
                addMessage('assistant', '🔔 Test notification scheduled for 10 seconds from now! You should receive it shortly.');
              } else {
                addMessage('assistant', '❌ Failed to schedule test notification. Please check your notification permissions.');
              }
            }}
          >
            <Text style={styles.scheduleButtonText}>🔔 Test Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.remindersButton} onPress={async () => {
            if (currentUserId) {
              // Fetch fresh reminders from Firestore
              const userReminders = await firestoreService.getReminders(currentUserId);
              if (userReminders.length > 0) {
                const remindersList = await Promise.all(userReminders.map(async r => {
                  const status = await getReminderNotificationStatus(`reminder_${r.id}`);
                  const statusText = status.scheduled > 0 ? `📱 ${status.scheduled} alerts` : '❌ No alerts';
                  return `• ${r.title} (${r.dueDate.toLocaleDateString()} ${r.dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}) - ${statusText}`;
                }));
                addMessage('assistant', `Here are your reminders:\n\n${remindersList.join('\n')}`);
              } else {
                addMessage('assistant', "You don't have any reminders scheduled yet.");
              }
            } else {
              if (reminders.length > 0) {
                const remindersList = reminders.map(r => `• ${r.title} (${r.date} ${r.time})`).join('\n');
                addMessage('assistant', `Here are your reminders:\n\n${remindersList}`);
              } else {
                addMessage('assistant', "You don't have any reminders scheduled yet.");
              }
            }
          }}>
            <Text style={styles.remindersButtonText}>🔔 View Reminders ({reminders.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Section */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask me anything..."
          placeholderTextColor="#CCCCCC"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Voice Button */}
      {isVoiceAvailable && (
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonListening]} 
          onPress={handleVoicePress}
        >
          <Animated.View style={[styles.voiceIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.voiceIconText}>
              {isListening ? '⏹️' : '🎤'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Status Indicator */}
      {(isListening || isProcessing) && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isListening ? 'Listening...' : 'Processing...'}
          </Text>
        </View>
      )}

      {/* Reminder/Meeting Modal */}
      <Modal
        visible={isReminderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReminderModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Reminder/Meeting</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Title*</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter title"
                value={reminderTitle}
                onChangeText={setReminderTitle}
              />
              
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Enter description"
                value={reminderDescription}
                onChangeText={setReminderDescription}
                multiline
              />
              
              <View style={styles.rowInput}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="YYYY-MM-DD"
                    value={reminderDate}
                    onChangeText={setReminderDate}
                  />
                </View>
                
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Time</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="HH:MM"
                    value={reminderTime}
                    onChangeText={setReminderTime}
                  />
                </View>
              </View>
              
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity 
                  style={[styles.typeButton, reminderType === 'reminder' && styles.typeButtonActive]}
                  onPress={() => setReminderType('reminder')}
                >
                  <Text style={styles.typeButtonText}>Reminder</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.typeButton, reminderType === 'meeting' && styles.typeButtonActive]}
                  onPress={() => setReminderType('meeting')}
                >
                  <Text style={styles.typeButtonText}>Meeting</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.typeButton, reminderType === 'task' && styles.typeButtonActive]}
                  onPress={() => setReminderType('task')}
                >
                  <Text style={styles.typeButtonText}>Task</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityButtons}>
                <TouchableOpacity 
                  style={[styles.priorityButton, reminderPriority === 'low' && styles.priorityButtonLow]}
                  onPress={() => setReminderPriority('low')}
                >
                  <Text style={styles.priorityButtonText}>Low</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.priorityButton, reminderPriority === 'medium' && styles.priorityButtonMedium]}
                  onPress={() => setReminderPriority('medium')}
                >
                  <Text style={styles.priorityButtonText}>Medium</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.priorityButton, reminderPriority === 'high' && styles.priorityButtonHigh]}
                  onPress={() => setReminderPriority('high')}
                >
                  <Text style={styles.priorityButtonText}>High</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setIsReminderModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={createReminder}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
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
    backgroundColor: '#1A1A2E',
  },
  header: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C4A',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userGreeting: {
    fontSize: 16,
    color: '#008080',
    fontStyle: 'italic',
    marginBottom: 3,
  },
  logoutButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  scheduleButton: {
    backgroundColor: '#008080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  remindersButton: {
    backgroundColor: '#4A4A8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  remindersButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userMessageBubble: {
    backgroundColor: '#008080',
    borderBottomRightRadius: 5,
  },
  assistantMessageBubble: {
    backgroundColor: 'rgba(44, 44, 74, 0.9)',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  voiceIndicator: {
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 5,
  },
  // Weather styles
  weatherContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  weatherDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  weatherDetail: {
    fontSize: 12,
    color: '#CCCCCC',
    marginRight: 10,
  },
  // News styles
  newsBubble: {
    maxWidth: width * 0.85,
  },
  newsContainer: {
    marginTop: 10,
    maxHeight: 200,
  },
  newsItem: {
    width: 250,
    marginRight: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  newsDescription: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 5,
  },
  newsSource: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  newsLink: {
    fontSize: 12,
    color: '#008080',
    textDecorationLine: 'underline',
  },
  noNewsText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1A1A2E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C4A',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2C2C4A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4A4A4A',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  voiceButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  voiceButtonListening: {
    backgroundColor: '#FF6347',
  },
  voiceIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  statusContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#2C2C4A',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    maxHeight: '70%',
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  rowInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#3C3C5A',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  typeButtonActive: {
    backgroundColor: '#008080',
  },
  typeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#3C3C5A',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  priorityButtonLow: {
    backgroundColor: '#4CAF50',
  },
  priorityButtonMedium: {
    backgroundColor: '#FF9800',
  },
  priorityButtonHigh: {
    backgroundColor: '#F44336',
  },
  priorityButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#FF6347',
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  createButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#008080',
    alignItems: 'center',
    marginLeft: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 60,
    marginBottom: 20,
  },
  loadingSubtext: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default App;
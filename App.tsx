/**
 * AI Personal Assistant - Chat Interface with Voice & Firestore
 * A comprehensive personal assistant with chat interface, voice commands, and database storage
 */

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
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  PermissionsAndroid,
  Animated,
  Dimensions,
} from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import './firebase.config';
import { initNotifications, scheduleNotification, cancelNotification } from './notifications';
import { initWakeWord, startWakeWord, stopWakeWord, destroyWakeWord, onWakeWord } from './voice';
import VoiceAssistant, { VoiceResponse } from './voice-assistant';
import firestoreService from './firestore.service';
import LoginScreen from './LoginScreen';
import weatherService, { WeatherData } from './weather.service';
import newsService, { NewsArticle } from './news.service';

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
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
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
  const [userData, setUserData] = useState<{ email: string; name: string } | null>(null);
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
  const [userName, setUserName] = useState('Panju Dharmar');
  const [weather, setWeather] = useState('14°C Clouds');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

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

  // Initialize weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Try to get weather for a default city (you can change this)
        const weatherResponse = await weatherService.getCurrentWeather('New York');
        
        if (weatherResponse.success && weatherResponse.data) {
          setWeatherData(weatherResponse.data);
          setWeather(weatherService.formatWeatherDisplay(weatherResponse.data));
        } else {
          // Use mock data if API fails
          const mockData = weatherService.getMockWeatherData();
          setWeatherData(mockData);
          setWeather(weatherService.formatWeatherDisplay(mockData));
          }
        } catch (error) {
        console.log('Weather fetch error:', error);
        // Use mock data as fallback
        const mockData = weatherService.getMockWeatherData();
        setWeatherData(mockData);
        setWeather(weatherService.formatWeatherDisplay(mockData));
      }
    };

    fetchWeather();
  }, []);

  // Initialize news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Try to get top headlines
        const newsResponse = await newsService.getTopHeadlines('us');
        
        if (newsResponse.success && newsResponse.articles) {
          setNewsData(newsResponse.articles);
        } else {
          // Use mock data if API fails
          const mockData = newsService.getMockNewsData();
          setNewsData(mockData);
        }
      } catch (error) {
        console.log('News fetch error:', error);
        // Use mock data as fallback
        const mockData = newsService.getMockNewsData();
        setNewsData(mockData);
      }
    };

    fetchNews();
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
  const addMessage = (type: 'user' | 'assistant', content: string, isVoice = false) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      type,
      content,
      timestamp: new Date(),
      isVoice,
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Process user input
  const processUserInput = async (input: string) => {
    const userInput = input.trim();
    if (!userInput) return;

    // Add user message
    addMessage('user', userInput);
    setInputText('');

    // Simple AI responses
    let response = '';
    
    if (userInput.toLowerCase().includes('joke')) {
      response = "Why did the scarecrow win an award? Because he was outstanding in his field! 😄";
    } else if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
      response = `Hello ${userName}! How can I assist you today?`;
    } else if (userInput.toLowerCase().includes('reminder') || userInput.toLowerCase().includes('remind')) {
      response = "I can help you create reminders! Try saying 'Create a reminder for team meeting tomorrow' or use the voice button to speak your request.";
    } else if (userInput.toLowerCase().includes('weather')) {
      if (weatherData) {
        response = weatherService.getDetailedWeatherInfo(weatherData);
    } else {
        response = `The current weather is ${weather}. Would you like me to check the forecast for tomorrow?`;
      }
    } else if (userInput.toLowerCase().includes('forecast') || userInput.toLowerCase().includes('tomorrow')) {
      response = "I can provide weather forecasts! Try asking 'What's the weather forecast for tomorrow?' or use the voice button for detailed weather information.";
    } else if (userInput.toLowerCase().includes('news') || userInput.toLowerCase().includes('headlines')) {
      if (newsData.length > 0) {
        response = newsService.formatNewsSummary(newsData, 5);
      } else {
        response = "I can provide you with the latest news! Try asking 'What are the latest headlines?' or 'Tell me the news'.";
      }
    } else if (userInput.toLowerCase().includes('technology') || userInput.toLowerCase().includes('tech')) {
      response = "I can get you the latest technology news! Try asking 'Show me tech news' or 'What's new in technology?'";
    } else if (userInput.toLowerCase().includes('business') || userInput.toLowerCase().includes('finance')) {
      response = "I can provide business and finance news! Try asking 'Show me business news' or 'What's happening in finance?'";
    } else if (userInput.toLowerCase().includes('sports')) {
      response = "I can get you the latest sports news! Try asking 'Show me sports news' or 'What's happening in sports?'";
    } else if (userInput.toLowerCase().includes('help')) {
      response = "I can help you with:\n• Creating reminders and tasks\n• Scheduling meetings\n• Taking voice notes\n• Checking weather and forecasts\n• Getting latest news and headlines\n• Telling jokes\n\nTry using the voice button for hands-free interaction!";
    } else {
      response = "I'm here to help! You can ask me to create reminders, schedule meetings, check weather, get news, or just chat. Try using the voice button for a more natural experience.";
    }

    // Add assistant response
    setTimeout(() => {
      addMessage('assistant', response);
    }, 500);
  };

  // Handle send button
  const handleSend = () => {
    processUserInput(inputText);
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

  // Test notifications
  const testNotifications = async () => {
    try {
      await initNotifications();
      const nid = await scheduleNotification({
        id: 'test_notification',
        title: 'AI Assistant Test',
        body: 'This is a test notification from your AI assistant!',
        timestampMs: Date.now() + 2000, // 2 seconds from now
      });
      
      if (nid) {
        addMessage('assistant', 'Test notification scheduled! You should receive it in 2 seconds.');
      }
    } catch (error) {
      console.error('Notification test error:', error);
      addMessage('assistant', 'Failed to schedule test notification. Please check your notification settings.');
    }
  };

  // Handle login
  const handleLogin = (userData: { email: string; name: string }) => {
    setUserData(userData);
    setUserName(userData.name);
    setIsLoggedIn(true);
    
    // Update welcome message
    setMessages([{
      id: '1',
      type: 'assistant',
      content: `Hello ${userData.name}! I'm your AI personal assistant. How can I help you today?`,
      timestamp: new Date(),
    }]);
  };

  // Refresh weather data
  const refreshWeather = async () => {
    try {
      const weatherResponse = await weatherService.getCurrentWeather('New York');
      
      if (weatherResponse.success && weatherResponse.data) {
        setWeatherData(weatherResponse.data);
        setWeather(weatherService.formatWeatherDisplay(weatherResponse.data));
        addMessage('assistant', `Weather updated! ${weatherService.formatWeatherDisplay(weatherResponse.data)}`);
      } else {
        addMessage('assistant', 'Sorry, I couldn\'t fetch the latest weather data. Please try again later.');
      }
    } catch (error) {
      console.log('Weather refresh error:', error);
      addMessage('assistant', 'Sorry, I couldn\'t refresh the weather data. Please try again later.');
    }
  };

  // Refresh news data
  const refreshNews = async () => {
    try {
      const newsResponse = await newsService.getTopHeadlines('us');
      
      if (newsResponse.success && newsResponse.articles) {
        setNewsData(newsResponse.articles);
        addMessage('assistant', 'News updated! Here are the latest headlines:\n\n' + newsService.formatNewsSummary(newsResponse.articles, 3));
    } else {
        addMessage('assistant', 'Sorry, I couldn\'t fetch the latest news. Please try again later.');
      }
    } catch (error) {
      console.log('News refresh error:', error);
      addMessage('assistant', 'Sorry, I couldn\'t refresh the news. Please try again later.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // Clear data and reset to initial state
          setIsLoggedIn(false);
          setUserData(null);
          setMessages([{
            id: '1',
            type: 'assistant',
            content: "Hello! I'm your AI personal assistant. How can I help you today?",
            timestamp: new Date(),
          }]);
          setReminders([]);
          setInputText('');
        }},
      ]
    );
  };

  // Render chat message
  const renderMessage = ({ item }: { item: ChatMessage }) => (
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
            <TouchableOpacity onPress={refreshWeather} style={styles.weatherContainer}>
              <Text style={styles.weatherInfo}>
                {weatherData ? weatherService.getWeatherEmoji(weatherData.icon) : '🌤️'} {weather}
              </Text>
                </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={refreshNews}>
            <Text style={styles.headerButtonIcon}>📰</Text>
            <Text style={styles.headerButtonText}>News</Text>
                </TouchableOpacity>
          <TouchableOpacity style={styles.testNotificationButton} onPress={testNotifications}>
            <Text style={styles.testNotificationIcon}>🔔</Text>
            <Text style={styles.testNotificationText}>Test Notifications</Text>
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
          style={styles.sendButton} 
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
  weatherContainer: {
    marginTop: 3,
  },
  weatherInfo: {
    fontSize: 14,
    color: '#FFFFFF',
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
  testNotificationButton: {
    backgroundColor: '#008080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  testNotificationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    backgroundColor: '#008080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  testNotificationText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
    backgroundColor: '#2C2C4A',
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
});

export default App;

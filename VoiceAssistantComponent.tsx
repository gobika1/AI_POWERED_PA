import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VoiceAssistant, { VoiceResponse } from './voice-assistant';

const { width } = Dimensions.get('window');

interface VoiceAssistantComponentProps {
  userId: string;
}

const VoiceAssistantComponent: React.FC<VoiceAssistantComponentProps> = ({ userId }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState<VoiceResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>>([]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize voice assistant
    const initAssistant = async () => {
      const success = await VoiceAssistant.init(userId);
      if (success) {
        VoiceAssistant.setCommandResultCallback(handleCommandResult);
        console.log('Voice assistant initialized successfully');
      } else {
        Alert.alert('Error', 'Failed to initialize voice assistant');
      }
    };

    initAssistant();

    return () => {
      VoiceAssistant.destroy();
    };
  }, [userId]);

  // Animate microphone button when listening
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

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  const handleCommandResult = (voiceResponse: VoiceResponse) => {
    setResponse(voiceResponse);
    setIsProcessing(false);
    
    // Add to conversation history
    setConversationHistory(prev => [
      ...prev,
      {
        type: 'assistant',
        message: voiceResponse.message,
        timestamp: new Date(),
      }
    ]);

    // Show success/error feedback
    if (voiceResponse.success) {
      Alert.alert('Success', voiceResponse.message);
    } else {
      Alert.alert('Error', voiceResponse.message);
    }
  };

  const startListening = async () => {
    if (isListening || isProcessing) return;

    try {
      setIsListening(true);
      setTranscript('');
      setResponse(null);
      
      const success = await VoiceAssistant.startListening();
      if (!success) {
        Alert.alert('Error', 'Failed to start voice recognition');
        setIsListening(false);
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Error', 'Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    if (!isListening) return;

    try {
      setIsListening(false);
      setIsProcessing(true);
      await VoiceAssistant.stopListening();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const renderWaveAnimation = () => {
    if (!isListening) return null;

    return (
      <View style={styles.waveContainer}>
        {[1, 2, 3].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.wave,
              {
                transform: [
                  {
                    scale: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5 + index * 0.3],
                    }),
                  },
                ],
                opacity: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderConversationHistory = () => {
    return (
      <ScrollView style={styles.conversationContainer}>
        {conversationHistory.map((item, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              item.type === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.type === 'user' ? styles.userMessageText : styles.assistantMessageText,
              ]}
            >
              {item.message}
            </Text>
            <Text style={styles.timestamp}>
              {item.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Assistant</Text>
        <Text style={styles.subtitle}>Tap and hold to speak</Text>
      </View>

      {renderConversationHistory()}

      <View style={styles.controlsContainer}>
        <View style={styles.statusContainer}>
          {isListening && (
            <Text style={styles.statusText}>Listening...</Text>
          )}
          {isProcessing && (
            <Text style={styles.statusText}>Processing...</Text>
          )}
          {transcript && (
            <Text style={styles.transcriptText}>"{transcript}"</Text>
          )}
        </View>

        <View style={styles.micContainer}>
          {renderWaveAnimation()}
          
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonListening,
            ]}
            onPress={handleMicPress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.micIcon,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.micIconText}>
                {isListening ? '⏹️' : '🎤'}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Try saying:</Text>
          <Text style={styles.helpText}>• "Create reminder for team meeting tomorrow"</Text>
          <Text style={styles.helpText}>• "Get my reminders"</Text>
          <Text style={styles.helpText}>• "Schedule meeting for 3 PM today"</Text>
          <Text style={styles.helpText}>• "Add task to buy groceries"</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  conversationContainer: {
    flex: 1,
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  transcriptText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  waveContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  micButtonListening: {
    backgroundColor: '#FF3B30',
  },
  micIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIconText: {
    fontSize: 32,
  },
  helpContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default VoiceAssistantComponent;

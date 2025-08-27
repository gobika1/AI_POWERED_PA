import VoiceAssistant from './voice-assistant';
import { VoiceResponse } from './voice-assistant';

// Example usage of the Voice Assistant

// 1. Initialize the voice assistant
export const initializeVoiceAssistant = async (userId: string) => {
  try {
    const success = await VoiceAssistant.init(userId);
    if (success) {
      console.log('Voice assistant initialized successfully');
      
      // Set up callback for command results
      VoiceAssistant.setCommandResultCallback((response: VoiceResponse) => {
        console.log('Voice command result:', response);
        // Handle the response in your UI
        if (response.success) {
          console.log('✅ Success:', response.message);
          if (response.data) {
            console.log('Data:', response.data);
          }
        } else {
          console.log('❌ Error:', response.message);
        }
      });
      
      return true;
    } else {
      console.log('Failed to initialize voice assistant');
      return false;
    }
  } catch (error) {
    console.error('Error initializing voice assistant:', error);
    return false;
  }
};

// 2. Start listening for voice commands
export const startVoiceListening = async () => {
  try {
    const success = await VoiceAssistant.startListening();
    if (success) {
      console.log('🎤 Started listening for voice commands');
      return true;
    } else {
      console.log('Failed to start voice listening');
      return false;
    }
  } catch (error) {
    console.error('Error starting voice listening:', error);
    return false;
  }
};

// 3. Stop listening
export const stopVoiceListening = async () => {
  try {
    await VoiceAssistant.stopListening();
    console.log('⏹️ Stopped listening');
  } catch (error) {
    console.error('Error stopping voice listening:', error);
  }
};

// 4. Test voice commands (simulate what the voice assistant would understand)
export const testVoiceCommands = () => {
  const testCommands = [
    // Reminder commands
    "create reminder for team meeting tomorrow",
    "add reminder to buy groceries today",
    "set reminder for doctor appointment next week",
    "get my reminders",
    "show all reminders",
    
    // Meeting commands
    "schedule meeting for 3 PM today",
    "create meeting with John tomorrow at 2 PM",
    "add meeting about project review",
    "get my meetings",
    "show upcoming meetings",
    
    // Task commands
    "add task to complete report",
    "create task for laundry",
    "add todo to call mom",
    "get my tasks",
    "show pending tasks",
    
    // Note commands
    "create note about ideas",
    "add memo for shopping list",
    "get my notes",
    "show voice notes",
    
    // Complex commands
    "create urgent reminder for presentation tomorrow at 10 AM",
    "schedule important meeting with client next Monday",
    "add high priority task to finish project by Friday",
  ];

  console.log('🎯 Test Voice Commands:');
  testCommands.forEach((command, index) => {
    console.log(`${index + 1}. "${command}"`);
  });
  
  return testCommands;
};

// 5. Complete workflow example
export const voiceAssistantWorkflow = async (userId: string) => {
  try {
    // Step 1: Initialize
    console.log('🚀 Initializing voice assistant...');
    const initialized = await initializeVoiceAssistant(userId);
    if (!initialized) {
      throw new Error('Failed to initialize voice assistant');
    }

    // Step 2: Show test commands
    console.log('\n📝 Available voice commands:');
    testVoiceCommands();

    // Step 3: Start listening (in a real app, this would be triggered by user interaction)
    console.log('\n🎤 Voice assistant is ready!');
    console.log('In your app, call startVoiceListening() when user taps the mic button');
    console.log('Call stopVoiceListening() when user releases the mic button');

    return true;
  } catch (error) {
    console.error('❌ Voice assistant workflow failed:', error);
    return false;
  }
};

// 6. Cleanup
export const cleanupVoiceAssistant = () => {
  try {
    VoiceAssistant.destroy();
    console.log('🧹 Voice assistant cleaned up');
  } catch (error) {
    console.error('Error cleaning up voice assistant:', error);
  }
};

// 7. Integration with React Native component
export const voiceAssistantIntegrationExample = `
// In your React Native component:

import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import VoiceAssistant, { VoiceResponse } from './voice-assistant';

const MyVoiceComponent = ({ userId }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => {
    // Initialize voice assistant
    const init = async () => {
      await VoiceAssistant.init(userId);
      VoiceAssistant.setCommandResultCallback((response: VoiceResponse) => {
        setLastResponse(response);
        console.log('Voice response:', response);
      });
    };
    
    init();

    // Cleanup
    return () => {
      VoiceAssistant.destroy();
    };
  }, [userId]);

  const handleMicPress = async () => {
    if (isListening) {
      await VoiceAssistant.stopListening();
      setIsListening(false);
    } else {
      const success = await VoiceAssistant.startListening();
      setIsListening(success);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleMicPress}>
        <Text>{isListening ? '⏹️ Stop' : '🎤 Start'} Listening</Text>
      </TouchableOpacity>
      
      {lastResponse && (
        <Text>
          {lastResponse.success ? '✅' : '❌'} {lastResponse.message}
        </Text>
      )}
    </View>
  );
};
`;

// 8. Voice command patterns and examples
export const voiceCommandPatterns = {
  reminders: {
    create: [
      "create reminder for [title] [time]",
      "add reminder to [title] [date]",
      "set reminder for [title] [when]",
      "remind me to [title] [when]",
    ],
    get: [
      "get my reminders",
      "show reminders",
      "list reminders",
      "what are my reminders",
    ],
  },
  meetings: {
    create: [
      "schedule meeting for [time] [date]",
      "create meeting with [person] [when]",
      "add meeting about [topic] [when]",
      "book meeting for [time]",
    ],
    get: [
      "get my meetings",
      "show meetings",
      "what meetings do I have",
      "upcoming meetings",
    ],
  },
  tasks: {
    create: [
      "add task to [title]",
      "create task for [title]",
      "add todo [title]",
      "new task [title]",
    ],
    get: [
      "get my tasks",
      "show tasks",
      "pending tasks",
      "what tasks do I have",
    ],
  },
  notes: {
    create: [
      "create note about [topic]",
      "add memo for [title]",
      "new note [content]",
      "save note [content]",
    ],
    get: [
      "get my notes",
      "show notes",
      "list notes",
      "my voice notes",
    ],
  },
};

// 9. Natural language processing examples
export const nlpExamples = {
  timeExpressions: [
    "today",
    "tomorrow", 
    "next week",
    "next Monday",
    "3 PM",
    "10:30 AM",
    "in 2 hours",
    "this afternoon",
    "tonight",
  ],
  priorityWords: [
    "urgent",
    "important", 
    "high priority",
    "low priority",
    "not urgent",
    "critical",
  ],
  actionWords: {
    create: ["create", "add", "set", "make", "new"],
    get: ["get", "show", "find", "list", "what"],
    update: ["update", "change", "modify", "edit"],
    delete: ["delete", "remove", "cancel", "clear"],
  },
};

console.log('🎤 Voice Assistant Examples Loaded!');
console.log('Use these functions to integrate voice commands into your app.');

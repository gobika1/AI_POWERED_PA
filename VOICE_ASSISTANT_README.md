# 🎤 Voice Assistant System

A comprehensive voice-to-text assistant that understands natural language commands and converts them into structured data, similar to WhatsApp's audio message functionality.

## ✨ Features

- **🎯 Natural Language Processing** - Understands conversational commands
- **🗓️ Smart Date/Time Parsing** - Extracts dates from natural language
- **📝 Voice-to-Text Conversion** - Real-time speech recognition
- **💾 Firestore Integration** - Stores data in your database
- **🎨 Beautiful UI** - WhatsApp-style interface with animations
- **🔊 Real-time Feedback** - Visual and audio feedback
- **📱 Cross-platform** - Works on iOS and Android

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @react-native-voice/voice
```

### 2. Add Voice Assistant to Your App

```typescript
import VoiceAssistantComponent from './VoiceAssistantComponent';

// In your main app component
<VoiceAssistantComponent userId="your-user-id" />
```

### 3. Initialize Voice Assistant

```typescript
import VoiceAssistant from './voice-assistant';

// Initialize with user ID
await VoiceAssistant.init('your-user-id');

// Set up response callback
VoiceAssistant.setCommandResultCallback((response) => {
  console.log('Voice response:', response);
});
```

## 🎯 Voice Commands

### Reminders
- **"Create reminder for team meeting tomorrow"**
- **"Add reminder to buy groceries today"**
- **"Set reminder for doctor appointment next week"**
- **"Get my reminders"**

### Meetings
- **"Schedule meeting for 3 PM today"**
- **"Create meeting with John tomorrow at 2 PM"**
- **"Add meeting about project review"**
- **"Get my meetings"**

### Tasks
- **"Add task to complete report"**
- **"Create task for laundry"**
- **"Add todo to call mom"**
- **"Get my tasks"**

### Notes
- **"Create note about ideas"**
- **"Add memo for shopping list"**
- **"Get my notes"**

## 📅 Date/Time Recognition

The voice assistant understands various time expressions:

- **"today"** - Current date
- **"tomorrow"** - Next day
- **"next week"** - 7 days from now
- **"3 PM"** - Specific time today
- **"next Monday"** - Next occurrence of Monday
- **"in 2 hours"** - Relative time

## 🎨 UI Components

### VoiceAssistantComponent
A complete React Native component with:
- 🎤 Animated microphone button
- 🌊 Wave animations during recording
- 💬 Conversation history
- 📱 WhatsApp-style interface
- ⚡ Real-time status updates

### Usage Example

```typescript
import VoiceAssistantComponent from './VoiceAssistantComponent';

const MyApp = () => {
  return (
    <VoiceAssistantComponent 
      userId="user123"
    />
  );
};
```

## 🔧 Advanced Usage

### Custom Voice Commands

```typescript
import VoiceAssistant from './voice-assistant';

// Start listening
const success = await VoiceAssistant.startListening();

// Stop listening
await VoiceAssistant.stopListening();

// Handle responses
VoiceAssistant.setCommandResultCallback((response) => {
  if (response.success) {
    console.log('✅ Success:', response.message);
    console.log('Data:', response.data);
  } else {
    console.log('❌ Error:', response.message);
  }
});
```

### Integration with Your App

```typescript
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import VoiceAssistant, { VoiceResponse } from './voice-assistant';

const MyVoiceComponent = ({ userId }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

  useEffect(() => {
    // Initialize
    const init = async () => {
      await VoiceAssistant.init(userId);
      VoiceAssistant.setCommandResultCallback((response: VoiceResponse) => {
        setLastResponse(response);
      });
    };
    
    init();
    return () => VoiceAssistant.destroy();
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
```

## 🗂️ File Structure

```
├── voice-assistant.ts              # Core voice assistant logic
├── VoiceAssistantComponent.tsx     # React Native UI component
├── voice-assistant-examples.ts     # Usage examples
├── firestore.service.ts            # Database operations
└── VOICE_ASSISTANT_README.md       # This file
```

## 🔍 How It Works

### 1. Voice Recognition
- Uses `@react-native-voice/voice` for speech-to-text
- Supports multiple languages (default: English)
- Real-time transcription

### 2. Natural Language Processing
- Parses voice commands into structured data
- Extracts dates, times, priorities, and actions
- Confidence scoring for command accuracy

### 3. Command Execution
- Maps parsed commands to database operations
- Creates, reads, updates data in Firestore
- Returns structured responses

### 4. UI Feedback
- Visual animations during recording
- Real-time status updates
- Conversation history display

## 🎯 Command Patterns

### Action Words
- **Create**: "create", "add", "set", "make", "new"
- **Get**: "get", "show", "find", "list", "what"
- **Update**: "update", "change", "modify", "edit"
- **Delete**: "delete", "remove", "cancel", "clear"

### Priority Words
- **High**: "urgent", "important", "high priority", "critical"
- **Medium**: Default priority
- **Low**: "low priority", "not urgent"

### Time Expressions
- **Absolute**: "3 PM", "10:30 AM", "next Monday"
- **Relative**: "today", "tomorrow", "next week", "in 2 hours"

## 🔧 Configuration

### Permissions

#### iOS (Info.plist)
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to microphone for voice commands.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs access to speech recognition for voice commands.</string>
```

#### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Voice Recognition Settings

```typescript
// Customize voice recognition
await Voice.start('en-US'); // Language code
await Voice.start('en-US', {
  EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 1000,
  EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 500,
  EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 300,
});
```

## 🧪 Testing

### Test Voice Commands

```typescript
import { testVoiceCommands } from './voice-assistant-examples';

// See all available test commands
testVoiceCommands();
```

### Complete Workflow Test

```typescript
import { voiceAssistantWorkflow } from './voice-assistant-examples';

// Test the complete voice assistant
await voiceAssistantWorkflow('test-user-id');
```

## 🚨 Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Check app permissions in device settings
   - Ensure proper permission requests in code

2. **Voice Recognition Not Working**
   - Check internet connection
   - Verify language settings
   - Test with simple commands first

3. **Commands Not Understood**
   - Speak clearly and slowly
   - Use supported command patterns
   - Check confidence scores in logs

4. **Database Errors**
   - Verify Firestore configuration
   - Check user authentication
   - Ensure proper data structure

### Debug Mode

```typescript
// Enable debug logging
if (__DEV__) {
  console.log('Voice assistant debug mode enabled');
  // Add your debug code here
}
```

## 📚 API Reference

### VoiceAssistant Class

#### Methods
- `init(userId: string): Promise<boolean>` - Initialize voice assistant
- `startListening(): Promise<boolean>` - Start voice recognition
- `stopListening(): Promise<void>` - Stop voice recognition
- `setCommandResultCallback(callback: Function)` - Set response handler
- `destroy(): void` - Cleanup resources

#### Events
- `onSpeechStart` - Voice recognition started
- `onSpeechEnd` - Voice recognition ended
- `onSpeechResults` - Speech transcribed
- `onSpeechError` - Recognition error

### VoiceCommand Interface

```typescript
interface VoiceCommand {
  type: 'reminder' | 'meeting' | 'task' | 'note' | 'query' | 'unknown';
  action: 'create' | 'get' | 'update' | 'delete' | 'list';
  data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  };
  confidence: number;
}
```

### VoiceResponse Interface

```typescript
interface VoiceResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
```

## 🎉 Success Stories

Users can now:
- ✅ Create reminders by speaking naturally
- ✅ Schedule meetings with voice commands
- ✅ Add tasks without typing
- ✅ Get information hands-free
- ✅ Use the app while driving or cooking

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Custom wake words
- [ ] Voice biometrics
- [ ] Offline voice processing
- [ ] Advanced NLP with AI
- [ ] Voice synthesis for responses
- [ ] Integration with calendar apps
- [ ] Smart suggestions

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the examples in `voice-assistant-examples.ts`
3. Test with simple commands first
4. Check console logs for errors

---

**🎤 Your voice assistant is ready to make your app more accessible and user-friendly!**

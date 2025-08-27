import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';
import firestoreService from './firestore.service';

// Voice Assistant Types
export interface VoiceCommand {
  type: 'reminder' | 'meeting' | 'task' | 'note' | 'query' | 'unknown';
  action: 'create' | 'get' | 'update' | 'delete' | 'list';
  data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    [key: string]: any;
  };
  confidence: number;
}

export interface VoiceResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class VoiceAssistant {
  private isListening = false;
  private isProcessing = false;
  private currentUserId: string | null = null;

  constructor() {
    this.setupVoiceHandlers();
  }

  // Initialize voice assistant
  async init(userId: string): Promise<boolean> {
    try {
      this.currentUserId = userId;
      
      // Request microphone permissions
      if (Platform.OS === 'ios') {
        await Voice.requestPermissions();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize voice assistant:', error);
      return false;
    }
  }

  // Setup voice event handlers
  private setupVoiceHandlers() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
    Voice.onSpeechPartialResults = this.onSpeechPartialResults.bind(this);
  }

  // Start listening for voice commands
  async startListening(): Promise<boolean> {
    if (this.isListening || this.isProcessing) {
      return false;
    }

    try {
      this.isListening = true;
      await Voice.start('en-US');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  // Stop listening
  async stopListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.stop();
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
    } finally {
      this.isListening = false;
    }
  }

  // Voice event handlers
  private onSpeechStart() {
    console.log('Voice recognition started');
  }

  private onSpeechEnd() {
    console.log('Voice recognition ended');
    this.isListening = false;
  }

  private onSpeechError(error: any) {
    console.error('Voice recognition error:', error);
    this.isListening = false;
  }

  private onSpeechPartialResults(results: string[]) {
    if (results && results.length > 0) {
      console.log('Partial result:', results[0]);
    }
  }

  private async onSpeechResults(results: string[]) {
    if (!results || results.length === 0) return;

    const transcript = results[0].toLowerCase();
    console.log('Voice transcript:', transcript);

    this.isProcessing = true;
    
    try {
      const command = this.parseVoiceCommand(transcript);
      const response = await this.executeCommand(command);
      
      // You can emit this response to your UI
      this.onCommandResult(response);
    } catch (error) {
      console.error('Error processing voice command:', error);
      this.onCommandResult({
        success: false,
        message: 'Sorry, I could not process your request.',
        error: error.message
      });
    } finally {
      this.isProcessing = false;
    }
  }

  // Parse natural language into structured command
  private parseVoiceCommand(transcript: string): VoiceCommand {
    const words = transcript.split(' ');
    
    // Default command
    let command: VoiceCommand = {
      type: 'unknown',
      action: 'create',
      data: {},
      confidence: 0.5
    };

    // Parse action words
    if (transcript.includes('create') || transcript.includes('add') || transcript.includes('set') || transcript.includes('make')) {
      command.action = 'create';
      command.confidence += 0.2;
    } else if (transcript.includes('get') || transcript.includes('show') || transcript.includes('find') || transcript.includes('list')) {
      command.action = 'get';
      command.confidence += 0.2;
    } else if (transcript.includes('update') || transcript.includes('change') || transcript.includes('modify')) {
      command.action = 'update';
      command.confidence += 0.2;
    } else if (transcript.includes('delete') || transcript.includes('remove') || transcript.includes('cancel')) {
      command.action = 'delete';
      command.confidence += 0.2;
    }

    // Parse type words
    if (transcript.includes('reminder') || transcript.includes('remind')) {
      command.type = 'reminder';
      command.confidence += 0.3;
    } else if (transcript.includes('meeting') || transcript.includes('appointment')) {
      command.type = 'meeting';
      command.confidence += 0.3;
    } else if (transcript.includes('task') || transcript.includes('todo')) {
      command.type = 'task';
      command.confidence += 0.3;
    } else if (transcript.includes('note') || transcript.includes('memo')) {
      command.type = 'note';
      command.confidence += 0.3;
    }

    // Extract title/description
    const titleMatch = transcript.match(/(?:for|about|regarding)\s+(.+?)(?:\s+(?:on|at|for|tomorrow|today|next|this))?/i);
    if (titleMatch) {
      command.data.title = titleMatch[1].trim();
      command.confidence += 0.2;
    }

    // Extract date/time
    const dateTime = this.extractDateTime(transcript);
    if (dateTime) {
      command.data.dueDate = dateTime;
      command.confidence += 0.2;
    }

    // Extract priority
    if (transcript.includes('urgent') || transcript.includes('important') || transcript.includes('high priority')) {
      command.data.priority = 'high';
      command.confidence += 0.1;
    } else if (transcript.includes('low priority') || transcript.includes('not urgent')) {
      command.data.priority = 'low';
      command.confidence += 0.1;
    } else {
      command.data.priority = 'medium';
    }

    return command;
  }

  // Extract date and time from natural language
  private extractDateTime(transcript: string): Date | null {
    const now = new Date();
    
    // Today
    if (transcript.includes('today')) {
      return now;
    }
    
    // Tomorrow
    if (transcript.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    // Next week
    if (transcript.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }
    
    // Specific time today
    const timeMatch = transcript.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();
      
      let adjustedHour = hour;
      if (period === 'pm' && hour !== 12) {
        adjustedHour += 12;
      } else if (period === 'am' && hour === 12) {
        adjustedHour = 0;
      }
      
      const date = new Date(now);
      date.setHours(adjustedHour, minute, 0, 0);
      return date;
    }
    
    // Day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
      if (transcript.includes(days[i])) {
        const targetDay = i;
        const currentDay = now.getDay();
        const daysToAdd = (targetDay - currentDay + 7) % 7;
        const date = new Date(now);
        date.setDate(date.getDate() + daysToAdd);
        return date;
      }
    }
    
    return null;
  }

  // Execute the parsed command
  private async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    if (!this.currentUserId) {
      return {
        success: false,
        message: 'User not authenticated',
        error: 'No user ID'
      };
    }

    try {
      switch (command.type) {
        case 'reminder':
          return await this.handleReminderCommand(command);
        case 'meeting':
          return await this.handleMeetingCommand(command);
        case 'task':
          return await this.handleTaskCommand(command);
        case 'note':
          return await this.handleNoteCommand(command);
        default:
          return {
            success: false,
            message: 'I did not understand that command. Please try again.',
            error: 'Unknown command type'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Sorry, there was an error processing your request.',
        error: error.message
      };
    }
  }

  // Handle reminder commands
  private async handleReminderCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.action) {
      case 'create':
        const reminderId = await firestoreService.createReminder({
          userId: this.currentUserId!,
          title: command.data.title || 'Voice Reminder',
          description: command.data.description,
          dueDate: command.data.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
          completed: false,
        });
        
        return {
          success: true,
          message: `Reminder "${command.data.title || 'Voice Reminder'}" created successfully.`,
          data: { reminderId }
        };

      case 'get':
        const reminders = await firestoreService.getReminders(this.currentUserId!);
        return {
          success: true,
          message: `You have ${reminders.length} reminders.`,
          data: { reminders }
        };

      default:
        return {
          success: false,
          message: 'That action is not supported for reminders.',
          error: 'Unsupported action'
        };
    }
  }

  // Handle meeting commands
  private async handleMeetingCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.action) {
      case 'create':
        const meetingId = await firestoreService.createReminder({
          userId: this.currentUserId!,
          title: command.data.title || 'Voice Meeting',
          description: command.data.description || 'Meeting scheduled via voice',
          dueDate: command.data.dueDate || new Date(Date.now() + 60 * 60 * 1000), // Default to 1 hour from now
          completed: false,
        });
        
        return {
          success: true,
          message: `Meeting "${command.data.title || 'Voice Meeting'}" scheduled successfully.`,
          data: { meetingId }
        };

      case 'get':
        const meetings = await firestoreService.getReminders(this.currentUserId!);
        const upcomingMeetings = meetings.filter(m => !m.completed && m.dueDate > new Date());
        return {
          success: true,
          message: `You have ${upcomingMeetings.length} upcoming meetings.`,
          data: { meetings: upcomingMeetings }
        };

      default:
        return {
          success: false,
          message: 'That action is not supported for meetings.',
          error: 'Unsupported action'
        };
    }
  }

  // Handle task commands
  private async handleTaskCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.action) {
      case 'create':
        const taskId = await firestoreService.createReminder({
          userId: this.currentUserId!,
          title: command.data.title || 'Voice Task',
          description: command.data.description,
          dueDate: command.data.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
          completed: false,
        });
        
        return {
          success: true,
          message: `Task "${command.data.title || 'Voice Task'}" created successfully.`,
          data: { taskId }
        };

      case 'get':
        const tasks = await firestoreService.getReminders(this.currentUserId!);
        const pendingTasks = tasks.filter(t => !t.completed);
        return {
          success: true,
          message: `You have ${pendingTasks.length} pending tasks.`,
          data: { tasks: pendingTasks }
        };

      default:
        return {
          success: false,
          message: 'That action is not supported for tasks.',
          error: 'Unsupported action'
        };
    }
  }

  // Handle note commands
  private async handleNoteCommand(command: VoiceCommand): Promise<VoiceResponse> {
    switch (command.action) {
      case 'create':
        const noteId = await firestoreService.createVoiceNote({
          userId: this.currentUserId!,
          title: command.data.title || 'Voice Note',
          audioUrl: '', // This would be set when recording audio
          transcript: command.data.description || transcript,
          duration: 0, // This would be set when recording audio
        });
        
        return {
          success: true,
          message: `Note "${command.data.title || 'Voice Note'}" created successfully.`,
          data: { noteId }
        };

      case 'get':
        const notes = await firestoreService.getVoiceNotes(this.currentUserId!);
        return {
          success: true,
          message: `You have ${notes.length} voice notes.`,
          data: { notes }
        };

      default:
        return {
          success: false,
          message: 'That action is not supported for notes.',
          error: 'Unsupported action'
        };
    }
  }

  // Callback for command results (override this in your component)
  private onCommandResult(response: VoiceResponse) {
    console.log('Voice command result:', response);
    // Emit this to your UI component
    // You can use a callback or event system here
  }

  // Set callback for command results
  setCommandResultCallback(callback: (response: VoiceResponse) => void) {
    this.onCommandResult = callback;
  }

  // Cleanup
  destroy() {
    Voice.destroy().then(Voice.removeAllListeners);
  }
}

export default new VoiceAssistant();

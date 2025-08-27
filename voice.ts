import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import { PorcupineManager, PorcupineKeyword } from '@picovoice/porcupine-react-native';
import { PICOVOICE_ACCESS_KEY } from './picovoice.config';

let porcupine: PorcupineManager | null = null;
let isListening = false;
let subscriber: (() => void) | null = null;

// Configure these values
const ACCESS_KEY = PICOVOICE_ACCESS_KEY || process.env.PVC_ACCESS_KEY || '';
// Provide either built-in keywords or custom keyword files
// Using built-in Alexa keyword requires a licensed keyword. We'll default to 'Picovoice' demo keyword.
const KEYWORDS: PorcupineKeyword[] = [
  // { builtin: 'ALEXA' },
  { builtin: 'PICOVOICE' },
];

export function onWakeWord(handler: () => void) {
  subscriber = handler;
}

export async function initWakeWord(): Promise<boolean> {
  try {
    if (porcupine) return true;
    if (!ACCESS_KEY) {
      console.log('Porcupine ACCESS_KEY not set; wake word disabled');
      return false;
    }

    porcupine = await PorcupineManager.fromBuiltInKeywords(
      ACCESS_KEY,
      KEYWORDS,
      (keywordIndex: number) => {
        if (subscriber) subscriber();
      },
      (error: any) => {
        console.log('Porcupine error:', error);
      }
    );
    return true;
  } catch (e) {
    console.log('Failed to init wake word engine:', e);
    porcupine = null;
    return false;
  }
}

export async function startWakeWord(): Promise<void> {
  if (!porcupine || isListening) return;
  try {
    await porcupine.start();
    isListening = true;
  } catch (e) {
    console.log('Failed to start wake word:', e);
  }
}

export async function stopWakeWord(): Promise<void> {
  if (!porcupine || !isListening) return;
  try {
    await porcupine.stop();
  } catch (e) {
    console.log('Failed to stop wake word:', e);
  } finally {
    isListening = false;
  }
}

export async function destroyWakeWord(): Promise<void> {
  try {
    if (porcupine) {
      await porcupine.delete();
    }
  } catch (e) {
    console.log('Failed to destroy wake word:', e);
  } finally {
    porcupine = null;
    isListening = false;
  }
}

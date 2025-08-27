import { initializeApp } from '@react-native-firebase/app';

// TODO: Replace these values with your real Firebase project configuration
// Get these from: Firebase Console → Project Settings → Your Apps → Android App
const firebaseConfig = {
  apiKey: "AIzaSyBCuP6d_Z8ApUJWZo5A2xaqsAW05o9OBIs", // Replace with real API key
  authDomain: "aipoweredpa-voice.firebaseapp.com", // Replace with real domain
  projectId: "aipoweredpa-voice", // Replace with real project ID
  storageBucket: "aipoweredpa-voice.appspot.com", // Replace with real bucket
  messagingSenderId: "300552847997", // Replace with real sender ID
  appId: "1:300552847997:android:391f00e7ae017a2904a714", // Replace with real app ID
  measurementId: "G-6565656565" // Replace with real measurement ID (optional)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

import { initializeApp } from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCND20OWSEALqP7AW4zYYMWhJcILX96Y54",
  authDomain: "aipowered-d6194.firebaseapp.com",
  projectId: "aipowered-d6194",
  storageBucket: "aipowered-d6194.firebasestorage.app",
  messagingSenderId: "222809660841",
  appId: "1:222809660841:android:54f22155a8492f717838b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;

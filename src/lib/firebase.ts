// ─── Firebase Configuration ─────────────────────────────────
// IMPORTANT: Replace these placeholder values with your real Firebase config.
// Go to: https://console.firebase.google.com → Project Settings → Your Apps → Web App
// ────────────────────────────────────────────────────────────

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getMessaging, isSupported as isFCMSupported } from 'firebase/messaging';

// ── YOUR FIREBASE CONFIG ──────────────────────────────────────
// Replace with your real config from Firebase Console
export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDlFbtCCHwFfJ6XKSGjw5GFsiAC7o81JJ0",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "moment-keeper-498111.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "moment-keeper-498111",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "moment-keeper-498111.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "585904704264",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:585904704264:web:3d91509aec8996ac497abd",
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V1CJ04WZ1Z",
};
// ──────────────────────────────────────────────────────────────

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth
export const auth = getAuth(app);
auth.useDeviceLanguage();

// Set auth persistence
setPersistence(auth, indexedDBLocalPersistence).catch(() => {
  setPersistence(auth, browserLocalPersistence);
});

// Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
  ignoreUndefinedProperties: true,
});

// Storage
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Analytics (async, browser only)
export const initAnalytics = async () => {
  if (await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

// FCM Messaging (browser only)
export const initMessaging = async () => {
  if (await isFCMSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;

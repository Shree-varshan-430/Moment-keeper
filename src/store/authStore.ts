// ─── Zustand Auth Store ──────────────────────────────────────

import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  updateProfile as fbUpdateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { getUserProfile, createUserProfile, updateUserProfile, subscribeToUserProfile } from '@/lib/firestore';
import type { UserProfile } from '@/types';
import { checkRateLimit } from '@/lib/rateLimiter';

let authActionInProgress = false;

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileInfo: (name: string, photoURL?: string) => Promise<void>;
  updateNotificationPrefs: (prefs: Partial<UserProfile['notificationPreferences']>) => Promise<void>;
  updateThemePreference: (theme: 'light' | 'dark' | 'system') => void;
  updateReduceMotionPreference: (reduceMotion: boolean) => void;
  updatePrivatePasskey: (passkey: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initializeAuth: () => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Set user instantly, but keep loading true until the profile is fetched or fallback created
        set({ user: firebaseUser, initialized: true, error: null });

        // Subscribe to profile reactively
        unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, async (profile) => {
          if (!profile) {
            // Skip auto-creation if an explicit auth flow is already in progress
            if (authActionInProgress) {
              console.log('[AuthStore] Skipping profile auto-creation since explicit auth is in progress.');
              return;
            }

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || undefined,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              notificationPreferences: {
                enabled: true,
                sound: true,
                vibration: true,
                defaultTimings: ['1d', 'same_day'],
              },
              theme: 'dark',
              reduceMotion: false,
              createdAt: new Date().toISOString(),
            };
            try {
              await createUserProfile(newProfile);
              set({ profile: newProfile, loading: false });
            } catch (err) {
              console.warn('Failed to create fallback profile:', err);
              // Fallback in memory to avoid screen lock
              set({ profile: newProfile, loading: false });
            }
          } else {
            document.documentElement.classList.add('dark');
            set({ profile, loading: false });
          }
        });
      } else {
        set({ user: null, profile: null, loading: false, initialized: true, error: null });
        document.documentElement.classList.add('dark');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  },

  signUp: async (email, password, name) => {
    if (!checkRateLimit('signUp', 3000)) {
      throw new Error('Too many registration requests. Please wait a moment.');
    }
    authActionInProgress = true;
    set({ loading: true, error: null });
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email,
        displayName: name,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notificationPreferences: {
          enabled: true,
          sound: true,
          vibration: true,
          defaultTimings: ['1d', 'same_day'],
        },
        theme: 'dark',
        reduceMotion: false,
        createdAt: new Date().toISOString(),
      };

      // Run profile update and Firestore creation in parallel to speed up registration
      await Promise.all([
        fbUpdateProfile(credential.user, { displayName: name }),
        createUserProfile(newProfile),
      ]);

      set({ user: credential.user, profile: newProfile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    } finally {
      authActionInProgress = false;
    }
  },

  logIn: async (email, password) => {
    if (!checkRateLimit('logIn', 2000)) {
      throw new Error('Too many login attempts. Please wait a moment.');
    }
    authActionInProgress = true;
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // loading state and profile are handled reactively by initializeAuth subscription
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    } finally {
      authActionInProgress = false;
    }
  },

  logInWithGoogle: async () => {
    authActionInProgress = true;
    set({ loading: true, error: null });
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      
      // Check if profile exists; if not, create it
      const profile = await getUserProfile(credential.user.uid);
      if (!profile) {
        const newProfile: UserProfile = {
          uid: credential.user.uid,
          email: credential.user.email || '',
          displayName: credential.user.displayName || 'Google User',
          photoURL: credential.user.photoURL || undefined,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notificationPreferences: {
            enabled: true,
            sound: true,
            vibration: true,
            defaultTimings: ['1d', 'same_day'],
          },
          theme: 'dark',
          reduceMotion: false,
          createdAt: new Date().toISOString(),
        };
        await createUserProfile(newProfile);
        set({ user: credential.user, profile: newProfile, loading: false });
      } else {
        set({ user: credential.user, profile, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    } finally {
      authActionInProgress = false;
    }
  },

  logOut: async () => {
    set({ loading: true, error: null });
    try {
      await fbSignOut(auth);
      set({ user: null, profile: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  resetPassword: async (email) => {
    if (!checkRateLimit('resetPassword', 5000)) {
      throw new Error('Please wait at least 5 seconds before requesting another password reset email.');
    }
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateProfileInfo: async (name, photoURL) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    set({ loading: true, error: null });
    try {
      await fbUpdateProfile(user, { displayName: name, photoURL });
      const updatedProfile = { ...profile, displayName: name, photoURL };
      await updateUserProfile(user.uid, { displayName: name, photoURL });
      set({ profile: updatedProfile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateNotificationPrefs: async (prefs) => {
    const { user, profile } = get();
    if (!user || !profile) return;
    try {
      const newPrefs = { ...(profile.notificationPreferences || {}), ...prefs };
      await updateUserProfile(user.uid, { notificationPreferences: newPrefs });
      set({ profile: { ...profile, notificationPreferences: newPrefs } });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateThemePreference: async (theme) => {
    document.documentElement.classList.add('dark');
  },

  updateReduceMotionPreference: async (reduceMotion) => {
    const { user, profile } = get();
    if (profile) {
      set({ profile: { ...profile, reduceMotion } });
    }
    if (user) {
      await updateUserProfile(user.uid, { reduceMotion });
    }
  },

  updatePrivatePasskey: async (passkey) => {
    if (!checkRateLimit('updatePrivatePasskey', 3000)) {
      throw new Error('Please wait a moment before updating your passkey again.');
    }
    const { user, profile } = get();
    if (!user || !profile) return;
    try {
      await updateUserProfile(user.uid, { privatePasskey: passkey });
      set({ profile: { ...profile, privatePasskey: passkey } });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

}));

// ─── Main App Shell Router & Initialization ───────────────────

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Network } from '@capacitor/network';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EventsPage } from '@/pages/events/EventsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { PeoplePage } from '@/pages/people/PeoplePage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage';
import { TermsPage } from '@/pages/TermsPage';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { BackgroundParticles } from '@/components/fx/BackgroundParticles';
import { CelebrationScreen } from '@/components/celebration/CelebrationScreen';
import { BackButtonHandler } from '@/components/BackButtonHandler';
import { Toaster, toast } from 'react-hot-toast';

export const App: React.FC = () => {
  const { initializeAuth, user } = useAuthStore();
  const { setOnline, isOnline } = useUIStore();

  useEffect(() => {
    // Start auth subscription listener
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    if (isOnline && user?.uid) {
      import('@/store/eventStore').then(({ syncOfflinePhotos }) => {
        syncOfflinePhotos(user.uid).catch((err) => console.warn('Sync offline photos failed:', err));
      });
    }
  }, [isOnline, user?.uid]);

  useEffect(() => {
    let active = true;
    let removeListener: (() => void) | null = null;
    let lastStatus: boolean | null = null;

    const setupNetworkListener = async () => {
      // Get initial status
      try {
        const status = await Network.getStatus();
        if (active) {
          setOnline(status.connected);
          lastStatus = status.connected;
        }
      } catch (e) {
        if (active) {
          setOnline(navigator.onLine);
          lastStatus = navigator.onLine;
        }
      }

      // Listen for network changes
      try {
        const listener = await Network.addListener('networkStatusChange', (status) => {
          if (active) {
            setOnline(status.connected);
            if (lastStatus !== status.connected) {
              lastStatus = status.connected;
              if (status.connected) {
                toast.success('Back online! Syncing data...', { id: 'network-status' });
              } else {
                toast.error('Connection lost. Working in offline mode.', { id: 'network-status', duration: 4000 });
              }
            }
          }
        });
        removeListener = () => {
          listener.remove();
        };
      } catch (e) {
        // Fallback to standard web listeners
        const handleOnline = () => {
          if (active && lastStatus !== true) {
            setOnline(true);
            lastStatus = true;
            toast.success('Back online! Syncing data...', { id: 'network-status' });
          }
        };
        const handleOffline = () => {
          if (active && lastStatus !== false) {
            setOnline(false);
            lastStatus = false;
            toast.error('Connection lost. Working in offline mode.', { id: 'network-status', duration: 4000 });
          }
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        removeListener = () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };

    setupNetworkListener();

    return () => {
      active = false;
      if (removeListener) {
        removeListener();
      }
    };
  }, [setOnline]);

  useEffect(() => {
    // Ask for notification permission at startup
    const requestNotificationPermission = async () => {
      try {
        const { notificationService } = await import('@/services/notificationService');
        await notificationService.requestPermission();
      } catch (err) {
        console.warn('Failed to request notifications permission on startup:', err);
      }
    };
    
    // Slight delay to allow smooth launch animations
    const timer = setTimeout(() => {
      requestNotificationPermission();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      {/* Toast Alert Config */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass text-mk-white border-mk-glass-border',
          style: {
            background: 'var(--mk-glass-bg)',
            color: '#F5F5F5',
            border: '1px solid var(--mk-glass-border)',
            backdropFilter: 'blur(10px)',
          },
          duration: 3000,
        }}
      />

      {/* Floating particles background, back handlers & overlays */}
      <BackButtonHandler />
      <BackgroundParticles />
      <CelebrationScreen />
      <SplashScreen />

      <Routes>
        {/* Unprotected Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsPage />} />
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

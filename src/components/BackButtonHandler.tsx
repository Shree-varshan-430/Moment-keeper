// ─── Capacitor Android Back Button & Gesture Navigation Handler ────

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { useUIStore } from '@/store/uiStore';
import { hapticService } from '@/services/hapticService';

export const BackButtonHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen, celebrationEventId, triggerCelebration } = useUIStore();

  const stateRef = useRef({ sidebarOpen, celebrationEventId, pathname: location.pathname });

  // Update mutable state ref to avoid resetting the event listener unnecessarily
  useEffect(() => {
    stateRef.current = { sidebarOpen, celebrationEventId, pathname: location.pathname };
  }, [sidebarOpen, celebrationEventId, location.pathname]);

  useEffect(() => {
    let isActive = true;
    let handler: any;

    const addListener = async () => {
      try {
        handler = await CapApp.addListener('backButton', () => {
          if (!isActive) return;
          const { sidebarOpen: open, celebrationEventId: cEventId, pathname } = stateRef.current;

          // 1. Close mobile drawer sidebar if open
          if (open) {
            hapticService.lightImpact();
            setSidebarOpen(false);
            return;
          }

          // 2. Close active milestone celebration popup if open
          if (cEventId) {
            hapticService.lightImpact();
            triggerCelebration(null);
            return;
          }

          // 3. Catch-all query selector to click-close any open Radix UI / custom modal dialogues
          const modalCloseBtn = document.querySelector(
            '[role="dialog"] button, .glass button.absolute, [role="dialog"] [aria-label="Close"]'
          ) as HTMLButtonElement | null;
          if (modalCloseBtn) {
            hapticService.lightImpact();
            modalCloseBtn.click();
            return;
          }

          // 4. Handle navigation or app exit based on the current page path
          const isRootPage = pathname === '/' || pathname === '/login' || pathname === '/signup';
          if (isRootPage) {
            hapticService.mediumImpact();
            CapApp.exitApp();
          } else {
            hapticService.lightImpact();
            navigate(-1);
          }
        });
      } catch (err) {
        console.warn('Capacitor App Back Button listener not active in this environment.', err);
      }
    };

    addListener();

    return () => {
      isActive = false;
      if (handler) {
        handler.remove();
      }
    };
  }, [navigate, setSidebarOpen, triggerCelebration]);

  return null;
};

export default BackButtonHandler;

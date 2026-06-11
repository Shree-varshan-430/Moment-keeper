// ─── Capacitor & Web Haptic Vibration Feedback Service ─────────

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useAuthStore } from '@/store/authStore';

class HapticService {
  private isVibrationEnabled(): boolean {
    const profile = useAuthStore.getState().profile;
    if (!profile || !profile.notificationPreferences) return true;
    return profile.notificationPreferences.vibration !== false;
  }

  // Light tap for button clicks / item selections
  async lightImpact() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Fallback to web vibration api if running in web browser
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }

  // Medium tap for edits, toggles, success checks
  async mediumImpact() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
  }

  // Heavy tap for deletes, critical warnings
  async heavyImpact() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }

  // Success haptic notification (double vibration)
  async success() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    }
  }

  // Warning haptic notification
  async warning() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate([60, 100, 60]);
      }
    }
  }

  // Error haptic notification
  async error() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate([80, 50, 80, 50, 100]);
      }
    }
  }

  // Persistent heartbeat vibration pattern (e.g. for active alarm / celebration start)
  async startHeartbeat() {
    if (!this.isVibrationEnabled()) return;
    try {
      await Haptics.vibrate({ duration: 150 });
      setTimeout(async () => {
        if (!this.isVibrationEnabled()) return;
        await Haptics.vibrate({ duration: 150 });
      }, 250);
    } catch {
      if (navigator.vibrate) {
        navigator.vibrate([150, 100, 150]);
      }
    }
  }
}

export const hapticService = new HapticService();
export default hapticService;

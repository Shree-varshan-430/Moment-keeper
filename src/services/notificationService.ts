// ─── Capacitor Local Notifications Service ────────────────────

import { LocalNotifications } from '@capacitor/local-notifications';
import { getDaysUntilEvent } from '@/lib/utils';
import { useEventStore } from '@/store/eventStore';
import { MKEvent } from '@/types';

class NotificationService {
  async requestPermission(): Promise<boolean> {
    try {
      // 1. Try standard Web Notifications API first if available in browser
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          const webPerm = await Notification.requestPermission();
          if (webPerm === 'granted') return true;
        } else if (Notification.permission === 'granted') {
          return true;
        }
      }

      // 2. Try Capacitor LocalNotifications
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('LocalNotifications permissions not supported in this environment.', err);
      // Fallback check for web
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission === 'granted';
      }
      return false;
    }
  }

  async createNotificationChannels() {
    try {
      // Create high-end Premium channel
      await LocalNotifications.createChannel({
        id: 'premium_favorites',
        name: 'Premium Favorites 💎',
        description: 'Vibrant alerts for your most treasured memories',
        importance: 5, // High importance
        sound: 'chime.wav',
        vibration: true,
        lights: true,
        lightColor: '#D4AF37', // Gold color glow
      });

      // Regular channel
      await LocalNotifications.createChannel({
        id: 'standard_milestones',
        name: 'Standard Milestones 🔔',
        description: 'General reminders for upcoming events',
        importance: 3, // Default importance
        sound: 'beep.wav',
        vibration: true,
      });
    } catch (err) {
      console.warn('Notification channels creation not supported in this environment.', err);
    }
  }

  async scheduleEventReminder(event: MKEvent) {
    const isGranted = await this.requestPermission();
    if (!isGranted) return;

    // Register channels first
    await this.createNotificationChannels();

    const daysUntil = getDaysUntilEvent(event.date, event.isRecurring);
    if (daysUntil < 0) return; // Event has passed

    // Lookup linked person to get their nickname
    const { persons } = useEventStore.getState();
    const person = event.personId 
      ? persons.find(p => p.id === event.personId) 
      : (event.personName ? persons.find(p => p.name.toLowerCase() === event.personName!.toLowerCase()) : null);

    const displayName = person ? (person.nickname || person.name) : (event.personName || 'your event');

    // Replace full name with nickname in the event title if possible
    let formattedTitle = event.title;
    if (person && person.nickname && person.name) {
      const nameRegex = new RegExp(person.name, 'gi');
      formattedTitle = event.title.replace(nameRegex, person.nickname);
    }

    const targetDate = new Date(event.date);

    // Timing configurations
    const notificationTimes: Array<{ timing: string; offsetDays: number }> = [
      { timing: 'same_day', offsetDays: 0 },
      { timing: '1d', offsetDays: 1 },
      { timing: '3d', offsetDays: 3 },
      { timing: '7d', offsetDays: 7 },
    ];

    const schedules = notificationTimes
      .filter((nt) => event.notificationTimings && event.notificationTimings.includes(nt.timing as any))
      .map((nt, index) => {
        const scheduleDate = new Date(targetDate);
        scheduleDate.setDate(scheduleDate.getDate() - nt.offsetDays);
        // Default alert time: 9:00 AM
        scheduleDate.setHours(9, 0, 0, 0);

        // Ensure schedule is in the future
        if (scheduleDate.getTime() > Date.now()) {
          // Customize notifications for Premium Favorites
          if (event.isFavorite) {
            const timeLabel = nt.offsetDays === 0 ? 'Today' : nt.offsetDays === 1 ? 'Tomorrow' : `in ${nt.offsetDays} days`;
            const customTitle = `✨👑 PREMIUM FAVORITE: ${formattedTitle} ${timeLabel}! 🌟✨`;
            
            const relationshipText = person
              ? `Celebrate with ${displayName}! (${person.relationship || 'friend'})`
              : (event.personName ? `Celebrate with ${event.personName}!` : 'Make sure to celebrate this treasured moment!');
            const customBody = `💎 A Special Memory is Approaching!\n\n${relationshipText}\n"${event.description || 'No description provided'}"\n\nLet's make this day extraordinary. 💖`;

            const attachments = event.photoUrl ? [{ id: 'event_photo', url: event.photoUrl }] : undefined;

            return {
              title: customTitle,
              body: customBody,
              id: Math.abs(hashCode(event.id) + index),
              schedule: { at: scheduleDate },
              sound: 'chime.wav',
              channelId: 'premium_favorites',
              actionTypeId: 'EVENT_REMINDER',
              attachments,
              extra: { eventId: event.id },
            };
          } else {
            // Standard notification
            const timeLabel = nt.offsetDays === 0 ? 'Today' : nt.offsetDays === 1 ? 'Tomorrow' : `in ${nt.offsetDays} days`;
            const standardTitle = `🔔 Reminder: ${formattedTitle} ${timeLabel}!`;
            const standardBody = event.description || (person ? `Milestone reminder for ${displayName}` : `Milestone reminder for ${event.personName || 'your event'}`);

            return {
              title: standardTitle,
              body: standardBody,
              id: Math.abs(hashCode(event.id) + index),
              schedule: { at: scheduleDate },
              sound: 'beep.wav',
              channelId: 'standard_milestones',
              actionTypeId: 'EVENT_REMINDER',
              extra: { eventId: event.id },
            };
          }
        }
        return null;
      })
      .filter((s) => s !== null);

    if (schedules.length > 0) {
      try {
        await LocalNotifications.schedule({
          notifications: schedules as any[],
        });
      } catch (err) {
        console.warn('Failed to schedule local notifications', err);
      }
    }
  }


  async syncAllEventNotifications(events: MKEvent[]) {
    try {
      await this.cancelAllNotifications();
      
      const activeEvents = events.filter(e => !e.isArchived);
      for (const event of activeEvents) {
        await this.scheduleEventReminder(event);
      }
    } catch (err) {
      console.warn('Failed to sync event notifications:', err);
    }
  }

  async cancelAllNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
      }
    } catch (err) {
      console.warn('Capacitor cancel notifications not supported.', err);
    }
  }
}

// Simple deterministic hash helper for IDs
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const character = str.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export const notificationService = new NotificationService();

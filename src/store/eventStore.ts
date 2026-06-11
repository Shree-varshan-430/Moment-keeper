// ─── Zustand Event Store ─────────────────────────────────────

import { create } from 'zustand';
import {
  subscribeToEvents,
  createEvent as fbCreateEvent,
  updateEvent as fbUpdateEvent,
  deleteEvent as fbDeleteEvent,
  archiveEvent as fbArchiveEvent,
  restoreEvent as fbRestoreEvent,
  toggleFavorite as fbToggleFavorite,
  getEvents as fbGetEvents,
  getArchivedEvents as fbGetArchivedEvents,
  getPersons as fbGetPersons,
  createPerson as fbCreatePerson,
  updatePerson as fbUpdatePerson,
  deletePerson as fbDeletePerson,
  subscribeToGroups,
  subscribeToVisibleEvents,
  createGroup as fbCreateGroup,
  addMemberToGroupByEmail as fbAddMemberToGroupByEmail,
  leaveGroup as fbLeaveGroup,
  getUserProfiles as fbGetUserProfiles,
  subscribeToPersons,
  subscribeToArchivedEvents,
  uploadPersonPhoto,
} from '@/lib/firestore';
import { getDaysUntilEvent } from '@/lib/utils';
import type { MKEvent, Person, Group, UserProfile, EventCategory, PriorityLevel, EventStats } from '@/types';
import { checkRateLimit } from '@/lib/rateLimiter';
import { useUIStore } from '@/store/uiStore';

interface EventState {
  events: MKEvent[];
  archivedEvents: MKEvent[];
  persons: Person[];
  groups: Group[];
  memberProfiles: Record<string, UserProfile>;
  loading: boolean;
  error: string | null;
  selectedCategoryFilter: EventCategory | 'all';
  selectedPriorityFilter: PriorityLevel | 'all';
  searchQuery: string;

  setCategoryFilter: (category: EventCategory | 'all') => void;
  setPriorityFilter: (priority: PriorityLevel | 'all') => void;
  setSearchQuery: (query: string) => void;
  
  fetchEventsAndPersons: (userId: string) => Promise<() => void>;
  fetchArchivedEvents: (userId: string) => Promise<void>;
  
  addEvent: (event: Omit<MKEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { groupId?: string }) => Promise<string>;
  editEvent: (id: string, data: Partial<MKEvent>) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
  archiveExistingEvent: (id: string) => Promise<void>;
  restoreArchivedEvent: (id: string) => Promise<void>;
  toggleFavoriteEvent: (id: string, current: boolean) => Promise<void>;

  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>, photoBlob?: Blob | null) => Promise<string>;
  editPerson: (id: string, data: Partial<Person>, photoBlob?: Blob | null) => Promise<void>;
  removePerson: (id: string) => Promise<void>;
  uploadPersonPicture: (personId: string, blob: Blob) => Promise<string>;

  createGroup: (name: string, type: Group['type'], description?: string) => Promise<string>;
  inviteMemberToGroup: (groupId: string, email: string) => Promise<string>;
  leaveGroup: (groupId: string) => Promise<void>;

  getStats: () => EventStats;
  getFilteredEvents: () => MKEvent[];
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  archivedEvents: [],
  persons: [],
  groups: [],
  memberProfiles: {},
  loading: false,
  error: null,
  selectedCategoryFilter: 'all',
  selectedPriorityFilter: 'all',
  searchQuery: '',

  setCategoryFilter: (category) => set({ selectedCategoryFilter: category }),
  setPriorityFilter: (priority) => set({ selectedPriorityFilter: priority }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchEventsAndPersons: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      let unsubscribeEvents: (() => void) | null = null;

      // 1. Subscribe to groups reactively
      const unsubscribeGroups = subscribeToGroups(userId, async (groupsList) => {
        set({ groups: groupsList });

        // Resolve user profiles for all group members in the background
        const uniqueMemberIds = Array.from(new Set(groupsList.flatMap(g => g.memberIds)));
        if (uniqueMemberIds.length > 0) {
          try {
            const profiles = await fbGetUserProfiles(uniqueMemberIds);
            const profilesMap = { ...get().memberProfiles };
            profiles.forEach(p => {
              profilesMap[p.uid] = p;
            });
            set({ memberProfiles: profilesMap });
          } catch (err) {
            console.warn('Failed to pre-fetch member profiles:', err);
          }
        }

        // Whenever groups list changes, rebuild events subscription
        if (unsubscribeEvents) {
          unsubscribeEvents();
        }

        const groupIds = groupsList.map(g => g.id);
        unsubscribeEvents = subscribeToVisibleEvents(userId, groupIds, (eventsList) => {
          set({ events: eventsList, loading: false });
          // Synchronize local notifications in the background
          import('@/services/notificationService').then(({ notificationService }) => {
            notificationService.syncAllEventNotifications(eventsList);
          }).catch((err) => console.warn('Failed to load notificationService:', err));
        });
      });

      // 2. Subscribe to persons profiles reactively
      const unsubscribePersons = subscribeToPersons(userId, (personsList) => {
        const enriched = personsList.map(p => {
          const offlinePhoto = localStorage.getItem(`mk_offline_photo_${p.id}`);
          if (offlinePhoto) {
            return { ...p, photoUrl: offlinePhoto };
          }
          return p;
        });
        set({ persons: enriched });
      });

      // 3. Subscribe to archived events reactively
      const unsubscribeArchived = subscribeToArchivedEvents(userId, (archivedList) => {
        set({ archivedEvents: archivedList });
      });

      // Return cleanup subscriber wrapper
      return () => {
        unsubscribeGroups();
        unsubscribePersons();
        unsubscribeArchived();
        if (unsubscribeEvents) {
          unsubscribeEvents();
        }
      };
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return () => {};
    }
  },

  fetchArchivedEvents: async (userId: string) => {
    // No-op since we subscribe to archived events reactively in fetchEventsAndPersons
  },

  addEvent: async (event) => {
    if (!checkRateLimit('addEvent', 1500)) {
      throw new Error('You are creating events too quickly. Please wait a moment.');
    }
    console.log("ZUSTAND addEvent received event payload:", event);
    let finalPayload = { ...event, isArchived: false } as any;
    
    if (event.isArchived) {
      const { encryptionService } = await import('@/services/encryptionService');
      const { useAuthStore } = await import('@/store/authStore');
      const { profile, user } = useAuthStore.getState();
      const passkey = profile?.privatePasskey || '1234';
      const uid = user?.uid || '';
      finalPayload = await encryptionService.encryptEvent(finalPayload, passkey, uid);
      finalPayload.isArchived = true;
    }
    
    const newId = await fbCreateEvent(finalPayload);
    return newId;
  },

  editEvent: async (id, data) => {
    if (!checkRateLimit(`editEvent-${id}`, 1000)) {
      throw new Error('Please wait a moment before updating this event again.');
    }
    let finalData = { ...data };
    
    const { events, archivedEvents } = get();
    const existingEvent = events.find(e => e.id === id) || archivedEvents.find(e => e.id === id);
    const isPrivate = data.isArchived !== undefined ? data.isArchived : (existingEvent?.isArchived || false);

    if (isPrivate) {
      const { encryptionService } = await import('@/services/encryptionService');
      const { useAuthStore } = await import('@/store/authStore');
      const { profile, user } = useAuthStore.getState();
      const passkey = profile?.privatePasskey || '1234';
      const uid = user?.uid || '';
      finalData = await encryptionService.encryptEvent(finalData as any, passkey, uid);
    }
    
    await fbUpdateEvent(id, finalData);
  },

  removeEvent: async (id) => {
    await fbDeleteEvent(id);
  },

  archiveExistingEvent: async (id) => {
    const { events } = get();
    const event = events.find(e => e.id === id);
    if (!event) return;

    const { encryptionService } = await import('@/services/encryptionService');
    const { useAuthStore } = await import('@/store/authStore');
    const { profile, user } = useAuthStore.getState();
    const passkey = profile?.privatePasskey || '1234';
    const uid = user?.uid || '';

    // Encrypt event data before archiving
    const encryptedData = await encryptionService.encryptEvent(event, passkey, uid);
    
    await fbUpdateEvent(id, {
      ...encryptedData,
      isArchived: true,
    });
  },

  restoreArchivedEvent: async (id) => {
    const { archivedEvents } = get();
    const event = archivedEvents.find(e => e.id === id);
    if (!event) return;

    const { encryptionService } = await import('@/services/encryptionService');
    const { useAuthStore } = await import('@/store/authStore');
    const { profile, user } = useAuthStore.getState();
    const passkey = profile?.privatePasskey || '1234';
    const uid = user?.uid || '';

    // Decrypt the fields
    const decryptedEvent = await encryptionService.decryptEvent(event, passkey, uid);

    // Convert back to public unencrypted form
    const publicPayload: any = {
      title: decryptedEvent.title,
      description: decryptedEvent.description || '',
      notes: decryptedEvent.notes || '',
      personName: decryptedEvent.personName || '',
      isArchived: false,
      isEncrypted: false,
    };

    await fbUpdateEvent(id, publicPayload);
  },

  toggleFavoriteEvent: async (id, current) => {
    await fbToggleFavorite(id, current);
  },

  addPerson: async (person, photoBlob) => {
    if (!checkRateLimit('addPerson', 1500)) {
      throw new Error('You are creating profiles too quickly. Please wait a moment.');
    }
    const { useAuthStore } = await import('@/store/authStore');
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    const { doc, collection, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    const personRef = doc(collection(db, 'persons'));
    const personId = personRef.id;

    let finalPhotoUrl = person.photoUrl;
    let isOfflineSaved = false;

    if (photoBlob) {
      const isOnline = useUIStore.getState().isOnline;
      if (isOnline) {
        try {
          finalPhotoUrl = await uploadPersonPhoto(user.uid, personId, photoBlob);
        } catch (err) {
          console.warn('Failed to upload photo online, caching offline:', err);
          isOfflineSaved = true;
        }
      } else {
        isOfflineSaved = true;
      }

      if (isOfflineSaved) {
        try {
          const base64 = await blobToBase64(photoBlob);
          localStorage.setItem(`mk_offline_photo_${personId}`, base64);
          finalPhotoUrl = undefined;
        } catch (e) {
          console.error('Failed to convert photo to Base64:', e);
        }
      }
    }

    const { cleanPayload } = await import('@/lib/firestore');
    await setDoc(personRef, {
      ...cleanPayload({
        ...person,
        photoUrl: finalPhotoUrl || undefined,
      }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return personId;
  },

  editPerson: async (id, data, photoBlob) => {
    if (!checkRateLimit(`editPerson-${id}`, 1000)) {
      throw new Error('Please wait a moment before updating this profile again.');
    }

    let finalData = { ...data };
    let isOfflineSaved = false;

    if (photoBlob) {
      const { useAuthStore } = await import('@/store/authStore');
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      const isOnline = useUIStore.getState().isOnline;
      if (isOnline) {
        try {
          const downloadUrl = await uploadPersonPhoto(user.uid, id, photoBlob);
          finalData.photoUrl = downloadUrl;
          localStorage.removeItem(`mk_offline_photo_${id}`);
        } catch (err) {
          console.warn('Failed to upload photo online, caching offline:', err);
          isOfflineSaved = true;
        }
      } else {
        isOfflineSaved = true;
      }

      if (isOfflineSaved) {
        try {
          const base64 = await blobToBase64(photoBlob);
          localStorage.setItem(`mk_offline_photo_${id}`, base64);
          delete finalData.photoUrl;
        } catch (e) {
          console.error('Failed to convert photo to Base64:', e);
        }
      }
    }

    await fbUpdatePerson(id, finalData);
  },

  removePerson: async (id) => {
    await fbDeletePerson(id);
  },

  uploadPersonPicture: async (personId, blob) => {
    const { useAuthStore } = await import('@/store/authStore');
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');

    const downloadUrl = await uploadPersonPhoto(user.uid, personId, blob);
    await fbUpdatePerson(personId, { photoUrl: downloadUrl });
    return downloadUrl;
  },

  createGroup: async (name, type, description) => {
    const { useAuthStore } = await import('@/store/authStore');
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');
    
    const newId = await fbCreateGroup({
      ownerId: user.uid,
      name,
      type,
      description: description || '',
      memberIds: [user.uid],
      sharedEventIds: []
    });
    return newId;
  },

  inviteMemberToGroup: async (groupId, email) => {
    const memberName = await fbAddMemberToGroupByEmail(groupId, email);
    return memberName;
  },

  leaveGroup: async (groupId) => {
    const { useAuthStore } = await import('@/store/authStore');
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Not authenticated');
    await fbLeaveGroup(groupId, user.uid);
  },

  getStats: () => {
    const { events } = get();
    const today = new Date();
    const stats: EventStats = {
      total: events.length,
      upcoming7Days: 0,
      upcoming30Days: 0,
      todayCount: 0,
      favorites: 0,
      byCategory: {
        birthday: 0,
        anniversary: 0,
        wedding: 0,
        family: 0,
        personal: 0,
        holiday: 0,
        business: 0,
        custom: 0,
      },
    };

    events.forEach((e) => {
      const days = getDaysUntilEvent(e.date, e.isRecurring);
      if (days === 0) stats.todayCount++;
      if (days > 0 && days <= 7) stats.upcoming7Days++;
      if (days > 0 && days <= 30) stats.upcoming30Days++;
      if (e.isFavorite) stats.favorites++;
      if (stats.byCategory[e.category] !== undefined) {
        stats.byCategory[e.category]++;
      }
    });

    return stats;
  },

  getFilteredEvents: () => {
    const { events, selectedCategoryFilter, selectedPriorityFilter, searchQuery } = get();
    return events.filter((e) => {
      const matchesCategory = selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;
      const matchesPriority = selectedPriorityFilter === 'all' || e.priority === selectedPriorityFilter;
      
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        e.title.toLowerCase().includes(query) ||
        (e.personName && e.personName.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        e.tags.some((t) => t.toLowerCase().includes(query));

      return matchesCategory && matchesPriority && matchesSearch;
    });
  },
}));

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const syncOfflinePhotos = async (userId: string) => {
  const keys = Object.keys(localStorage);
  const prefix = 'mk_offline_photo_';
  const offlineKeys = keys.filter(key => key.startsWith(prefix));

  if (offlineKeys.length === 0) return;

  console.log(`[OfflineSync] Found ${offlineKeys.length} offline photo(s) to sync.`);
  const { updatePerson, uploadPersonPhoto } = await import('@/lib/firestore');

  for (const key of offlineKeys) {
    const personId = key.substring(prefix.length);
    const base64String = localStorage.getItem(key);
    if (!base64String) continue;

    try {
      const base64ToBlob = (base64: string, contentType = 'image/jpeg') => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: contentType });
      };

      const blob = base64ToBlob(base64String);
      const downloadUrl = await uploadPersonPhoto(userId, personId, blob);
      await updatePerson(personId, { photoUrl: downloadUrl });
      localStorage.removeItem(key);
      console.log(`[OfflineSync] Synchronized photo for person ${personId}`);
    } catch (err) {
      console.error(`[OfflineSync] Failed to sync photo for person ${personId}:`, err);
    }
  }
};

// ─── MomentKeeper – All TypeScript Types ──────────────────────

export type EventCategory =
  | 'birthday'
  | 'anniversary'
  | 'wedding'
  | 'family'
  | 'personal'
  | 'holiday'
  | 'business'
  | 'custom';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type NotificationTiming =
  | '30d' | '15d' | '7d' | '3d' | '1d' | 'same_day' | 'custom';

export interface MKEvent {
  id: string;
  userId: string;
  title: string;
  personName?: string;
  description?: string;
  date: string;             // ISO date string YYYY-MM-DD
  time?: string;            // HH:MM optional
  category: EventCategory;
  photoUrl?: string;
  notes?: string;
  tags: string[];
  priority: PriorityLevel;
  isFavorite: boolean;
  isArchived: boolean;
  isRecurring: boolean;     // e.g. birthdays repeat yearly
  notificationTimings: NotificationTiming[];
  personId?: string;        // link to person profile
  groupId?: string;         // family/friend group
  spotifyUrl?: string;      // Spotify track/alarm sync link
  createdAt: string;
  updatedAt: string;
}

export type RelationshipType = 'family' | 'friend' | 'spouse' | 'partner' | 'colleague' | 'relative' | 'client' | 'other';

export interface Person {
  id: string;
  userId: string;
  name: string;
  nickname?: string;
  gender?: string;
  photoUrl?: string;
  relationship?: RelationshipType | string;
  favoriteColor?: string;
  favoriteFood?: string;
  giftIdeas: string[];
  previousGifts: string[];
  notes?: string;
  tags: string[];
  isFavorite: boolean;
  contactId?: string;       // from device contacts
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  type: 'family' | 'friends' | 'office' | 'custom';
  memberIds: string[];
  sharedEventIds: string[];
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  timeZone: string;
  notificationPreferences: NotificationPreferences;
  theme: 'light' | 'dark' | 'system';
  reduceMotion: boolean;
  privatePasskey?: string; // 4-digit passcode, defaults to "1234"
  createdAt: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  defaultTimings: NotificationTiming[];
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string;
}

export interface EventStats {
  total: number;
  upcoming7Days: number;
  upcoming30Days: number;
  todayCount: number;
  byCategory: Record<EventCategory, number>;
  favorites: number;
}

export interface SearchResult {
  type: 'event' | 'person';
  id: string;
  title: string;
  subtitle?: string;
  category?: EventCategory;
  date?: string;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  birthday:    'Birthday',
  anniversary: 'Anniversary',
  wedding:     'Wedding',
  family:      'Family Event',
  personal:    'Personal',
  holiday:     'Holiday',
  business:    'Business',
  custom:      'Custom',
};

export const CATEGORY_EMOJIS: Record<EventCategory, string> = {
  birthday:    '🎂',
  anniversary: '💍',
  wedding:     '💒',
  family:      '👨‍👩‍👧',
  personal:    '⭐',
  holiday:     '🏖️',
  business:    '💼',
  custom:      '📅',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low:      'Low',
  medium:   'Medium',
  high:     'High',
  critical: 'Critical',
};

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  differenceInDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  addYears,
  startOfDay,
  parseISO,
} from 'date-fns';
import type { EventCategory, MKEvent } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Date Utilities ─────────────────────────────────────────────
export function getDaysUntilEvent(eventDate: string, isRecurring: boolean = false): number {
  const today = startOfDay(new Date());
  let date  = startOfDay(parseISO(eventDate));

  if (isRecurring) {
    while (date < today) {
      date = addYears(date, 1);
    }
  }
  return differenceInCalendarDays(date, today);
}

export function getNextOccurrence(eventDate: string): Date {
  const today = startOfDay(new Date());
  let date = startOfDay(parseISO(eventDate));
  while (date < today) {
    date = addYears(date, 1);
  }
  return date;
}

export function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date))    return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatCountdown(days: number): string {
  if (days === 0) return 'Today! 🎉';
  if (days === 1) return 'Tomorrow';
  if (days < 7)  return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''}`;
}

export function getProgressPercent(days: number): number {
  // Maps days remaining to progress (0 = far away, 100 = today)
  if (days === 0) return 100;
  if (days >= 365) return 0;
  return Math.round((1 - days / 365) * 100);
}

// ── Event Utilities ────────────────────────────────────────────
export function sortEventsByDate(events: MKEvent[]): MKEvent[] {
  return [...events].sort((a, b) => {
    const daysA = getDaysUntilEvent(a.date, a.isRecurring);
    const daysB = getDaysUntilEvent(b.date, b.isRecurring);
    return daysA - daysB;
  });
}

export function filterUpcomingEvents(events: MKEvent[], daysAhead = 30): MKEvent[] {
  return events.filter(e => {
    const days = getDaysUntilEvent(e.date, e.isRecurring);
    return days >= 0 && days <= daysAhead;
  });
}

export function filterTodayEvents(events: MKEvent[]): MKEvent[] {
  return events.filter(e => getDaysUntilEvent(e.date, e.isRecurring) === 0);
}

export function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    birthday:    '#EC4899',
    anniversary: '#A855F7',
    wedding:     '#F43F5E',
    family:      '#3B82F6',
    personal:    '#10B981',
    holiday:     '#F59E0B',
    business:    '#06B6D4',
    custom:      '#C0C0C0',
  };
  return colors[category];
}

export function getCategoryGradient(category: EventCategory): string {
  const gradients: Record<EventCategory, string> = {
    birthday:    'from-pink-500/20 to-rose-500/20',
    anniversary: 'from-purple-500/20 to-violet-500/20',
    wedding:     'from-rose-500/20 to-pink-500/20',
    family:      'from-blue-500/20 to-cyan-500/20',
    personal:    'from-emerald-500/20 to-teal-500/20',
    holiday:     'from-amber-500/20 to-yellow-500/20',
    business:    'from-cyan-500/20 to-blue-500/20',
    custom:      'from-mk-silver/20 to-mk-light/20',
  };
  return gradients[category];
}

// ── Validation ─────────────────────────────────────────────────
export function isValidDate(dateStr: string): boolean {
  const d = parseISO(dateStr);
  return !isNaN(d.getTime());
}

// ── String Utilities ───────────────────────────────────────────
export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── ID Generation ─────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

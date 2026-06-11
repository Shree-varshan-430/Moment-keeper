// ─── Contact & Calendar Smart Import Component ───────────────────

import React, { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { X, Shield, ShieldCheck, UserCheck, AlertTriangle, Check, Loader2, Sparkles, Phone, Mail, Calendar, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { hapticService } from '@/services/hapticService';
import { MKEvent, NotificationTiming } from '@/types';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface ContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportableContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: string; // YYYY-MM-DD
  isDuplicate: boolean;      // Matches existing name in database
  alreadyImported: boolean;  // Mark if already in list
}

interface ImportableCalendarEvent {
  id: string;
  originalSummary: string;
  name: string;
  date: string; // YYYY-MM-DD
  isDuplicate: boolean;
  alreadyImported: boolean;
  isBirthdayHint: boolean;
}

// Extract Name & Date from Google Calendar Birthday event
const parseCalendarBirthday = (summary: string, start: any): { name: string; date: string } => {
  let name = summary || 'Unnamed Event';
  // Strip common birthday keywords
  const patterns = [
    /['’]s\s+birthday/i,
    /\s+birthday/i,
    /birthday\s+of\s+/i,
    /birthday:\s*/i,
    /\s*-\s*birthday/i
  ];
  
  for (const p of patterns) {
    if (p.test(name)) {
      name = name.replace(p, '').trim();
      break;
    }
  }

  // Parse start date (Google Calendar uses start.date for all-day and start.dateTime for standard)
  let date = '';
  if (start) {
    if (start.date) {
      date = start.date; // YYYY-MM-DD
    } else if (start.dateTime) {
      date = start.dateTime.split('T')[0]; // YYYY-MM-DD
    }
  }

  return { name, date };
};

export const ContactImportModal: React.FC<ContactImportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { persons, addPerson, addEvent } = useEventStore();
  const { isOnline } = useUIStore();

  const [activeTab, setActiveTab] = useState<'contacts' | 'calendar'>('contacts');
  const [loading, setLoading] = useState(false);

  // ─── Contacts State ────────────────────────────────────────────────
  const [permissionState, setPermissionState] = useState<'prompt' | 'requesting' | 'granted' | 'denied'>('prompt');
  const [contacts, setContacts] = useState<ImportableContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customBirthdays, setCustomBirthdays] = useState<Record<string, string>>({});

  // ─── Google Calendar State ─────────────────────────────────────────
  const [calendarToken, setCalendarToken] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [calendarEvents, setCalendarEvents] = useState<ImportableCalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedCalendarEventIds, setSelectedCalendarEventIds] = useState<Set<string>>(new Set());
  const [customCalendarBirthdays, setCustomCalendarBirthdays] = useState<Record<string, string>>({});
  const [isSimulatedCalendar, setIsSimulatedCalendar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
      setPermissionState('prompt');
      setContacts([]);
      setSelectedIds(new Set());
      setCustomBirthdays({});
      // Reset Google Calendar state
      setCalendarToken(null);
      setCalendars([]);
      setSelectedCalendarId('');
      setCalendarEvents([]);
      setCalendarLoading(false);
      setSelectedCalendarEventIds(new Set());
      setCustomCalendarBirthdays({});
      setIsSimulatedCalendar(false);
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (tab: 'contacts' | 'calendar') => {
    hapticService.lightImpact();
    setActiveTab(tab);
  };

  // ───────────────────────────────────────────────────────────────────
  // 📱 Device Contacts Logic
  // ───────────────────────────────────────────────────────────────────
  const processContacts = (rawContacts: any[]): ImportableContact[] => {
    return rawContacts.map((c, index) => {
      const name = c.name?.[0] || c.name || 'Unknown Contact';
      const phone = c.tel?.[0] || c.phone || '';
      const email = c.email?.[0] || c.email || '';
      const birthday = c.birthday || '';

      const duplicatePerson = persons.find(p => p.name.toLowerCase() === name.toLowerCase());

      return {
        id: c.id || `contact-${index}`,
        name,
        phone,
        email,
        birthday,
        isDuplicate: !!duplicatePerson,
        alreadyImported: !!duplicatePerson && duplicatePerson.tags.includes('imported'),
      };
    });
  };

  const handleRequestPermission = async () => {
    hapticService.lightImpact();
    setPermissionState('requesting');

    const supportsContactPicker = 'contacts' in navigator && 'ContactsManager' in window;

    if (supportsContactPicker) {
      try {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };
        const rawSelected = await (navigator as any).contacts.select(props, opts);
        
        if (rawSelected && rawSelected.length > 0) {
          hapticService.success();
          setPermissionState('granted');
          const processed = processContacts(rawSelected);
          setContacts(processed);
          
          const autoSelect = new Set<string>();
          processed.forEach(c => {
            if (!c.isDuplicate) {
              autoSelect.add(c.id);
            }
          });
          setSelectedIds(autoSelect);
        } else {
          setPermissionState('prompt');
        }
      } catch (err: any) {
        console.warn('Native Contacts Picker error:', err);
        setPermissionState('denied');
        hapticService.error();
        toast.error('Permission denied or picker cancelled.');
      }
    } else {
      // Simulation mode for unsupported views
      setTimeout(() => {
        hapticService.success();
        setPermissionState('granted');
        
        const mockRaw = [
          { name: 'Sarah Connor', phone: '+1 555-9011', email: 'sarah.c@terminator.com', birthday: '1965-11-10' },
          { name: 'Bruce Wayne', phone: '+1 735-3921', email: 'bruce@waynecorp.com', birthday: '1972-02-19' },
          { name: persons[0]?.name || 'John Doe', phone: '+1 555-1234', email: 'john@example.com', birthday: '' },
          { name: 'Diana Prince', phone: '+1 800-AMAZON', email: 'diana@themyscira.org', birthday: '' },
          { name: 'Tony Stark', phone: '+1 3000-IRON', email: 'tony@stark.io', birthday: '1970-05-29' },
          { name: 'Clark Kent', phone: '+1 555-DAILY', email: 'clark@dailyplanet.com', birthday: '' }
        ];
        
        const processed = processContacts(mockRaw);
        setContacts(processed);

        const autoSelect = new Set<string>();
        processed.forEach(c => {
          if (!c.isDuplicate) {
            autoSelect.add(c.id);
          }
        });
        setSelectedIds(autoSelect);
      }, 1000);
    }
  };

  const handleToggleSelect = (id: string) => {
    hapticService.lightImpact();
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleBirthdayChange = (id: string, dateStr: string) => {
    setCustomBirthdays(prev => ({
      ...prev,
      [id]: dateStr
    }));
  };

  const handleImportSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setLoading(true);
    hapticService.mediumImpact();

    let successCount = 0;
    try {
      const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

      for (const contact of selectedContacts) {
        const personPayload = {
          userId: user.uid,
          name: contact.name,
          relationship: 'Friend',
          favoriteColor: '#C0C0C0',
          favoriteFood: '',
          giftIdeas: [],
          previousGifts: [],
          tags: ['imported'],
          notes: `Synced from device contacts. Phone: ${contact.phone || 'N/A'}, Email: ${contact.email || 'N/A'}`,
          isFavorite: false,
        };

        const personId = await addPerson(personPayload);

        const finalBirthday = contact.birthday || customBirthdays[contact.id];
        if (finalBirthday) {
          let dateStr = finalBirthday;
          if (dateStr.length === 5) {
            dateStr = `2000-${dateStr}`;
          }

          const eventPayload = {
            userId: user.uid,
            title: `${contact.name}'s Birthday`,
            personName: contact.name,
            personId: personId,
            category: 'birthday' as const,
            date: dateStr,
            priority: 'medium' as const,
            tags: ['birthday', 'imported'],
            isFavorite: false,
            isArchived: false,
            isRecurring: true,
            notificationTimings: ['7d', '3d', '1d', 'same_day'] as NotificationTiming[],
            notes: `Auto-generated from contacts import. Keep this date special!`,
          };

          await addEvent(eventPayload);
        }
        successCount++;
      }

      hapticService.success();
      toast.success(`Successfully imported ${successCount} contact profiles!`);
      onClose();
    } catch (err: any) {
      hapticService.error();
      toast.error(`Import failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────
  // 📅 Google Calendar Logic
  // ───────────────────────────────────────────────────────────────────
  const processCalendarEvents = (rawEvents: any[]): ImportableCalendarEvent[] => {
    return rawEvents.map((item) => {
      const summary = item.summary || '';
      const { name, date } = parseCalendarBirthday(summary, item.start);
      
      const duplicatePerson = persons.find(p => p.name.toLowerCase() === name.toLowerCase());
      const isBdayKeyword = /birthday|bday|b'day|birth\s*day/i.test(summary);
      
      return {
        id: item.id || `cal-event-${Math.random()}`,
        originalSummary: summary,
        name,
        date,
        isDuplicate: !!duplicatePerson,
        alreadyImported: !!duplicatePerson && duplicatePerson.tags.includes('google-calendar'),
        isBirthdayHint: isBdayKeyword
      };
    }).sort((a, b) => {
      if (a.isBirthdayHint && !b.isBirthdayHint) return -1;
      if (!a.isBirthdayHint && b.isBirthdayHint) return 1;
      return 0;
    });
  };

  const handleConnectGoogleCalendar = async (simulate = false) => {
    hapticService.lightImpact();
    
    if (simulate) {
      setIsSimulatedCalendar(true);
      setCalendarToken('demo-token');
      const mockCals = [
        { id: 'primary', summary: 'Personal Calendar (Demo)', primary: true },
        { id: 'birthdays', summary: 'Google Contacts Birthdays (Demo)' }
      ];
      setCalendars(mockCals);
      setSelectedCalendarId('primary');
      loadMockEvents('primary');
      hapticService.success();
      return;
    }

    setCalendarLoading(true);
    setIsSimulatedCalendar(false);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      provider.setCustomParameters({ prompt: 'consent' });
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      if (!token) {
        throw new Error('Google Auth did not return an access token.');
      }
      
      setCalendarToken(token);
      await loadCalendars(token);
      hapticService.success();
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      hapticService.error();
      toast.error(`Google Connection failed: ${err.message || err}`);
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadCalendars = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Google Calendar API error: ${res.status} - ${errBody}`);
      }
      
      const data = await res.json();
      const items = data.items || [];
      setCalendars(items);
      
      const primaryCal = items.find((c: any) => c.primary) || items[0];
      if (primaryCal) {
        setSelectedCalendarId(primaryCal.id);
        await loadCalendarEvents(primaryCal.id, token);
      }
    } catch (err: any) {
      console.error('Fetch calendars error:', err);
      toast.error(`Failed to load calendars: ${err.message}`);
    }
  };

  const loadCalendarEvents = async (calendarId: string, token: string) => {
    setCalendarLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const timeMin = `${currentYear}-01-01T00:00:00Z`;
      const timeMax = `${currentYear}-12-31T23:59:59Z`;
      
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&maxResults=250&timeMin=${timeMin}&timeMax=${timeMax}`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Google API error: ${res.status}`);
      }
      
      const data = await res.json();
      const items = data.items || [];
      
      const processed = processCalendarEvents(items);
      setCalendarEvents(processed);
      
      const autoSelect = new Set<string>();
      processed.forEach(e => {
        if (!e.isDuplicate && e.date) {
          autoSelect.add(e.id);
        }
      });
      setSelectedCalendarEventIds(autoSelect);
    } catch (err: any) {
      console.error('Fetch events error:', err);
      toast.error(`Failed to load events: ${err.message}`);
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadMockEvents = (calendarId: string) => {
    setCalendarLoading(true);
    setTimeout(() => {
      let mockRaw = [];
      if (calendarId === 'birthdays') {
        mockRaw = [
          { id: 'cal-mock-1', summary: 'Sarah Connor', start: { date: '1965-11-10' } },
          { id: 'cal-mock-2', summary: 'Clark Kent', start: { date: '1979-04-18' } },
          { id: 'cal-mock-3', summary: 'Bruce Wayne', start: { date: '1972-02-19' } },
          { id: 'cal-mock-4', summary: persons[0]?.name || 'John Doe', start: { date: '2000-01-01' } }
        ];
      } else {
        mockRaw = [
          { id: 'cal-mock-p1', summary: "Tony Stark's Birthday Reminder", start: { date: '1970-05-29' } },
          { id: 'cal-mock-p2', summary: 'Diana Prince Birthday', start: { date: '1984-10-31' } },
          { id: 'cal-mock-p3', summary: 'Dentist Appointment', start: { dateTime: '2026-06-05T14:00:00Z' } },
          { id: 'cal-mock-p4', summary: 'Project Sync Meeting', start: { dateTime: '2026-06-08T09:30:00Z' } },
          { id: 'cal-mock-p5', summary: 'Peter Parker Birthday Party', start: { date: '2001-08-10' } }
        ];
      }
      
      const processed = processCalendarEvents(mockRaw);
      setCalendarEvents(processed);
      
      const autoSelect = new Set<string>();
      processed.forEach(e => {
        if ((e.isBirthdayHint || calendarId === 'birthdays') && !e.isDuplicate && e.date) {
          autoSelect.add(e.id);
        }
      });
      setSelectedCalendarEventIds(autoSelect);
      setCalendarLoading(false);
    }, 800);
  };

  const handleCalendarChange = async (calendarId: string) => {
    hapticService.lightImpact();
    setSelectedCalendarId(calendarId);
    if (isSimulatedCalendar) {
      loadMockEvents(calendarId);
    } else if (calendarToken) {
      await loadCalendarEvents(calendarId, calendarToken);
    }
  };

  const handleToggleSelectCalendarEvent = (id: string) => {
    hapticService.lightImpact();
    const updated = new Set(selectedCalendarEventIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedCalendarEventIds(updated);
  };

  const handleCalendarBirthdayChange = (id: string, dateStr: string) => {
    setCustomCalendarBirthdays(prev => ({
      ...prev,
      [id]: dateStr
    }));
  };

  const handleImportCalendarSelected = async () => {
    if (!user || selectedCalendarEventIds.size === 0) return;
    setLoading(true);
    hapticService.mediumImpact();
    
    let successCount = 0;
    try {
      const selectedEvents = calendarEvents.filter(e => selectedCalendarEventIds.has(e.id));
      
      for (const event of selectedEvents) {
        const personPayload = {
          userId: user.uid,
          name: event.name,
          relationship: 'Friend',
          favoriteColor: '#C0C0C0',
          favoriteFood: '',
          giftIdeas: [],
          previousGifts: [],
          tags: ['imported', 'google-calendar'],
          notes: `Imported from Google Calendar event: "${event.originalSummary}"`,
          isFavorite: false,
        };

        const personId = await addPerson(personPayload);

        const finalDate = customCalendarBirthdays[event.id] || event.date;
        if (finalDate) {
          let dateStr = finalDate;
          if (dateStr.length === 5) {
            dateStr = `2000-${dateStr}`;
          }

          const eventPayload = {
            userId: user.uid,
            title: `${event.name}'s Birthday`,
            personName: event.name,
            personId: personId,
            category: 'birthday' as const,
            date: dateStr,
            priority: 'medium' as const,
            tags: ['birthday', 'imported', 'google-calendar'],
            isFavorite: false,
            isArchived: false,
            isRecurring: true,
            notificationTimings: ['7d', '3d', '1d', 'same_day'] as NotificationTiming[],
            notes: `Auto-generated from Google Calendar import.`,
          };

          await addEvent(eventPayload);
        }
        successCount++;
      }

      hapticService.success();
      toast.success(`Successfully imported ${successCount} profiles from Google Calendar!`);
      onClose();
    } catch (err: any) {
      console.error('Import calendar events error:', err);
      hapticService.error();
      toast.error(`Import failed: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-mk-dark border border-mk-glass-border shadow-silver my-8 max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-mk-glass-border/40">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-silver text-mk-black text-sm font-bold shadow-silver-sm">
              📥
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-mk-white">Smart Import Center</h2>
              <span className="text-[10px] text-mk-silver tracking-widest uppercase block mt-0.5">
                Sync birthdays from contacts or calendars
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-mk-glass-border/30 bg-mk-black/20 shrink-0">
          <button
            onClick={() => handleTabChange('contacts')}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'contacts'
                ? 'border-mk-silver text-mk-white bg-white/[0.02]'
                : 'border-transparent text-mk-silver hover:text-mk-white hover:bg-white/[0.01]'
            }`}
          >
            <span>📱 Device Contacts</span>
          </button>
          <button
            onClick={() => handleTabChange('calendar')}
            className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'calendar'
                ? 'border-mk-silver text-mk-white bg-white/[0.02]'
                : 'border-transparent text-mk-silver hover:text-mk-white hover:bg-white/[0.01]'
            }`}
          >
            <span>📅 Google Calendar</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'contacts' ? (
            /* Contacts Tab */
            <div className="space-y-6">
              {permissionState === 'prompt' && (
                <div className="flex flex-col items-center justify-center text-center py-12 space-y-5 animate-fade-in">
                  <div className="h-16 w-16 rounded-full bg-white/5 border border-mk-glass-border flex items-center justify-center text-mk-accent animate-pulse">
                    <Shield size={32} />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-mk-white mb-2">Sync Contacts Permission</h3>
                    <p className="text-xs text-mk-silver leading-relaxed">
                      Allow MomentKeeper to access your device address book. We will scan your contacts to detect birthdays and help you set up reminders instantly. Your contact data is processed locally and never leaves your device.
                    </p>
                  </div>
                  <button
                    onClick={handleRequestPermission}
                    className="btn-premium px-8 py-3 flex items-center gap-2 font-bold"
                  >
                    <span>Authorize & Scan Contacts</span>
                  </button>
                </div>
              )}

              {permissionState === 'requesting' && (
                <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 animate-fade-in">
                  <Loader2 size={36} className="text-mk-silver animate-spin" />
                  <span className="text-sm font-semibold text-mk-white">Accessing device address book...</span>
                  <span className="text-xs text-mk-silver">Scanning and matching profiles</span>
                </div>
              )}

              {permissionState === 'denied' && (
                <div className="flex flex-col items-center justify-center text-center py-12 space-y-5 animate-fade-in">
                  <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                    <AlertTriangle size={32} />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-mk-white mb-2">Contacts Permission Denied</h3>
                    <p className="text-xs text-mk-silver leading-relaxed">
                      Access to device contacts was restricted. To import contacts, you must enable contacts permission in your device system settings or browser preferences and reload.
                    </p>
                  </div>
                  <button
                    onClick={handleRequestPermission}
                    className="btn-premium px-6 py-2.5 font-bold"
                  >
                    <span>Retry Authorization</span>
                  </button>
                </div>
              )}

              {permissionState === 'granted' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-xl p-3 bg-white/5 border border-mk-glass-border flex items-center gap-3 text-xs text-mk-silver leading-relaxed">
                    <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                    <span>
                      Contacts access granted. We have matched contacts with your existing reminders. Please review and select profiles to import.
                    </span>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Address Book Contacts ({contacts.length})
                    </span>

                    <div className="space-y-2">
                      {contacts.map((contact) => {
                        const isSelected = selectedIds.has(contact.id);
                        const birthdayVal = contact.birthday || customBirthdays[contact.id] || '';

                        return (
                          <div
                            key={contact.id}
                            onClick={() => !contact.alreadyImported && handleToggleSelect(contact.id)}
                            className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                              contact.alreadyImported
                                ? 'border-mk-glass-border/20 bg-white/[0.01] opacity-50 cursor-not-allowed'
                                : isSelected
                                ? 'border-mk-silver/40 bg-white/5 shadow-silver-sm cursor-pointer'
                                : 'border-mk-glass-border bg-white/[0.02] hover:bg-white/5 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`mt-0.5 rounded-lg h-5 w-5 flex items-center justify-center shrink-0 border transition-all ${
                                isSelected
                                  ? 'bg-gradient-silver border-none text-mk-black'
                                  : 'border-mk-glass-border text-transparent'
                              }`}>
                                <Check size={12} className="stroke-[3]" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-mk-white truncate">
                                  {contact.name}
                                </span>
                                <div className="flex flex-wrap gap-2.5 mt-1 text-[10px] text-mk-silver">
                                  {contact.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone size={10} />
                                      {contact.phone}
                                    </span>
                                  )}
                                  {contact.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail size={10} />
                                      {contact.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
                              {contact.isDuplicate && (
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  contact.alreadyImported
                                    ? 'bg-white/5 text-mk-silver border border-mk-glass-border'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`} title={contact.alreadyImported ? 'Already in directory' : 'Name matches an existing contact'}>
                                  {contact.alreadyImported ? <UserCheck size={10} /> : <AlertTriangle size={10} />}
                                  <span>{contact.alreadyImported ? 'Imported' : 'Duplicate'}</span>
                                </span>
                              )}

                              <div className="flex items-center gap-1.5 bg-mk-black/40 border border-mk-glass-border/80 px-2.5 py-1.5 rounded-lg">
                                <span className="text-[10px] font-bold text-mk-silver shrink-0 uppercase tracking-wider">
                                  🍰 B'day:
                                </span>
                                {contact.birthday ? (
                                  <span className="text-xs font-semibold text-mk-white flex items-center gap-1">
                                    <Sparkles size={10} className="text-mk-accent" />
                                    <span>{contact.birthday}</span>
                                  </span>
                                ) : (
                                  <input
                                    type="date"
                                    value={birthdayVal}
                                    disabled={contact.alreadyImported}
                                    onChange={(e) => handleBirthdayChange(contact.id, e.target.value)}
                                    className={`bg-transparent text-xs font-medium text-mk-white border-b ${
                                      birthdayVal ? 'border-mk-silver' : 'border-dashed border-mk-glass-border text-mk-silver'
                                    } outline-none cursor-pointer w-28`}
                                    placeholder="Detecting..."
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Google Calendar Tab */
            <div className="space-y-6">
              {!isOnline ? (
                <div className="flex flex-col items-center justify-center text-center py-12 space-y-5 animate-fade-in">
                  <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <AlertTriangle size={32} />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-mk-white mb-2">Offline Mode</h3>
                    <p className="text-xs text-mk-silver leading-relaxed">
                      Google Calendar synchronization requires an active internet connection. Please check your network connection and try again.
                    </p>
                  </div>
                </div>
              ) : !calendarToken ? (
                <div className="flex flex-col items-center justify-center text-center py-12 space-y-5 animate-fade-in">
                  <div className="h-16 w-16 rounded-full bg-white/5 border border-mk-glass-border flex items-center justify-center text-mk-accent animate-pulse">
                    <Calendar size={32} />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-mk-white mb-2">Sync with Google Calendar</h3>
                    <p className="text-xs text-mk-silver leading-relaxed">
                      Connect your Google Account to scan your primary calendar or custom birthday events. We will parse titles and dates automatically, matching them to profiles.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    {calendarLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-mk-silver" />
                        <span className="text-xs text-mk-silver">Connecting Google Account...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConnectGoogleCalendar(false)}
                        className="btn-premium px-8 py-3 flex items-center gap-2 font-bold"
                      >
                        <LogIn size={16} />
                        <span>Connect Google Calendar</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleConnectGoogleCalendar(true)}
                      className="text-[10px] text-mk-silver underline hover:text-mk-white transition-all tracking-wider"
                    >
                      or simulate with demo calendar
                    </button>
                  </div>
                </div>
              ) : (
                /* Connected State */
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-mk-glass-border">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-mk-white block">Connected to Google Calendar</span>
                        {isSimulatedCalendar && <span className="text-[10px] text-amber-400 font-bold block">Simulation Sandbox Mode</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white/5 border border-mk-glass-border px-3 py-1.5 rounded-xl relative hover:border-mk-silver/30 transition-all duration-200">
                      <span className="text-[10px] font-bold text-mk-silver uppercase tracking-wider shrink-0">Feed:</span>
                      <select
                        value={selectedCalendarId}
                        onChange={(e) => handleCalendarChange(e.target.value)}
                        className="bg-transparent text-xs font-bold text-mk-white outline-none cursor-pointer pr-5 appearance-none focus:outline-none"
                      >
                        {calendars.map(cal => (
                          <option key={cal.id} value={cal.id} className="bg-mk-dark text-mk-white py-1">
                            {cal.summary}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-2.5 pointer-events-none text-[8px] text-mk-silver">
                        ▼
                      </span>
                    </div>
                  </div>

                  {calendarLoading ? (
                    <div className="flex flex-col items-center justify-center text-center py-16 space-y-4 animate-fade-in">
                      <Loader2 size={36} className="text-mk-silver animate-spin" />
                      <span className="text-sm font-semibold text-mk-white">Fetching calendar events...</span>
                      <span className="text-xs text-mk-silver">Scanning and matching birthdays</span>
                    </div>
                  ) : (
                    /* Events list */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Parsed Calendar Events ({calendarEvents.length})
                        </span>
                        <span className="text-[9px] text-mk-silver italic text-right">
                          (Sorted by Birthday hints first)
                        </span>
                      </div>

                      {calendarEvents.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-mk-glass-border rounded-xl">
                          <p className="text-xs text-mk-silver">No birthday-related events found in this feed.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                          {calendarEvents.map((event) => {
                            const isSelected = selectedCalendarEventIds.has(event.id);
                            const birthdayVal = customCalendarBirthdays[event.id] || event.date || '';

                            return (
                              <div
                                key={event.id}
                                onClick={() => !event.alreadyImported && handleToggleSelectCalendarEvent(event.id)}
                                className={`rounded-xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                                  event.alreadyImported
                                    ? 'border-mk-glass-border/20 bg-white/[0.01] opacity-50 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-mk-silver/40 bg-white/5 shadow-silver-sm cursor-pointer'
                                    : 'border-mk-glass-border bg-white/[0.02] hover:bg-white/5 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={`mt-0.5 rounded-lg h-5 w-5 flex items-center justify-center shrink-0 border transition-all ${
                                    isSelected
                                      ? 'bg-gradient-silver border-none text-mk-black'
                                      : 'border-mk-glass-border text-transparent'
                                  }`}>
                                    <Check size={12} className="stroke-[3]" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-mk-white truncate flex items-center gap-1.5">
                                      {event.name}
                                      {event.isBirthdayHint && (
                                        <span title="Birthday keyword matched" className="shrink-0 flex items-center">
                                          <Sparkles size={10} className="text-mk-accent" />
                                        </span>
                                      )}
                                    </span>
                                    <span className="block text-[10px] text-mk-silver truncate mt-0.5">
                                      Event summary: "{event.originalSummary}"
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0 flex-wrap" onClick={e => e.stopPropagation()}>
                                  {event.isDuplicate && (
                                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                      event.alreadyImported
                                        ? 'bg-white/5 text-mk-silver border border-mk-glass-border'
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`} title={event.alreadyImported ? 'Already synced via Calendar' : 'Name matches an existing profile'}>
                                      {event.alreadyImported ? <UserCheck size={10} /> : <AlertTriangle size={10} />}
                                      <span>{event.alreadyImported ? 'Imported' : 'Duplicate'}</span>
                                    </span>
                                  )}

                                  <div className="flex items-center gap-1.5 bg-mk-black/40 border border-mk-glass-border/80 px-2.5 py-1.5 rounded-lg">
                                    <span className="text-[10px] font-bold text-mk-silver shrink-0 uppercase tracking-wider">
                                      🍰 B'day:
                                    </span>
                                    <input
                                      type="date"
                                      value={birthdayVal}
                                      disabled={event.alreadyImported}
                                      onChange={(e) => handleCalendarBirthdayChange(event.id, e.target.value)}
                                      className={`bg-transparent text-xs font-medium text-mk-white border-b ${
                                        birthdayVal ? 'border-mk-silver' : 'border-dashed border-mk-glass-border text-mk-silver'
                                      } outline-none cursor-pointer w-28`}
                                      placeholder="YYYY-MM-DD"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {((activeTab === 'contacts' && permissionState === 'granted') || (activeTab === 'calendar' && calendarToken && !calendarLoading)) && (
          <div className="p-6 border-t border-mk-glass-border/40 flex items-center justify-between gap-4 bg-mk-black/20">
            <span className="text-xs text-mk-silver">
              Selected: <strong className="text-mk-white">
                {activeTab === 'contacts' ? selectedIds.size : selectedCalendarEventIds.size}
              </strong> profiles to import
            </span>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-mk-glass-border bg-white/5 text-xs font-semibold hover:bg-white/10 transition-all text-mk-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || (activeTab === 'contacts' ? selectedIds.size === 0 : selectedCalendarEventIds.size === 0)}
                onClick={activeTab === 'contacts' ? handleImportSelected : handleImportCalendarSelected}
                className="px-6 py-2.5 rounded-xl btn-premium text-xs font-bold flex items-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Import Profiles ({activeTab === 'contacts' ? selectedIds.size : selectedCalendarEventIds.size})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

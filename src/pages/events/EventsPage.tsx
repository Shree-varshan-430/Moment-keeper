// ─── EventsPage Component ─────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { Search, Filter, Eye, Lock, Unlock, Delete } from 'lucide-react';
import { EventCategory, MKEvent } from '@/types';
import toast from 'react-hot-toast';
import { hapticService } from '@/services/hapticService';
import { motion } from 'framer-motion';

export const EventsPage: React.FC = () => {
  const { user, profile } = useAuthStore();
  const {
    archivedEvents,
    fetchEventsAndPersons,
    fetchArchivedEvents,
    restoreArchivedEvent,
    removeEvent,
    selectedCategoryFilter,
    selectedPriorityFilter,
    searchQuery,
    setCategoryFilter,
    setPriorityFilter,
    setSearchQuery,
    getFilteredEvents,
  } = useEventStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MKEvent | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  // Passkey control for private memories
  const [isPrivateUnlocked, setIsPrivateUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('isPrivateUnlocked') === 'true';
  });
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Client-side decrypted private events
  const [decryptedEvents, setDecryptedEvents] = useState<MKEvent[]>([]);

  useEffect(() => {
    if (user) {
      const unsub = fetchEventsAndPersons(user.uid);
      fetchArchivedEvents(user.uid);
      return () => {
        unsub.then((cleanup) => cleanup());
      };
    }
  }, [user, fetchEventsAndPersons, fetchArchivedEvents]);

  useEffect(() => {
    if (passkeyModalOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [passkeyModalOpen]);

  // Local decryption runner for private memories
  useEffect(() => {
    if (isPrivateUnlocked && archivedEvents.length > 0) {
      const decrypt = async () => {
        const { encryptionService } = await import('@/services/encryptionService');
        const passkey = profile?.privatePasskey || '1234';
        const uid = user?.uid || '';
        const list = await encryptionService.decryptEvents(archivedEvents, passkey, uid);
        setDecryptedEvents(list);
      };
      decrypt();
    } else {
      setDecryptedEvents([]);
    }
  }, [isPrivateUnlocked, archivedEvents, profile, user]);

  const activeEvents = getFilteredEvents();

  const handleEditTrigger = (event: MKEvent) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleRestore = async (id: string) => {
    try {
      hapticService.mediumImpact();
      await restoreArchivedEvent(id);
      toast.success('Event made Public.');
      hapticService.success();
    } catch (err) {
      hapticService.error();
      toast.error('Failed to make event Public.');
    }
  };

  const handleDeletePermanent = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this event? This action is irreversible.')) {
      try {
        hapticService.heavyImpact();
        await removeEvent(id);
        toast.success('Event permanently deleted.');
      } catch (err) {
        hapticService.error();
        toast.error('Failed to delete event.');
      }
    }
  };

  const handlePublicClick = () => {
    setViewMode('active');
  };

  const handlePrivateClick = () => {
    if (isPrivateUnlocked) {
      setViewMode('archived');
    } else {
      setPasskeyModalOpen(true);
      setPasscode('');
    }
  };

  const handleNumberClick = (num: string) => {
    hapticService.lightImpact();
    if (passcode.length < 4) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);
      
      if (newPasscode.length === 4) {
        const correctPasskey = String(profile?.privatePasskey || '1234');
        setTimeout(() => {
          if (newPasscode === correctPasskey) {
            hapticService.success();
            toast.success('Access Granted');
            sessionStorage.setItem('isPrivateUnlocked', 'true');
            setIsPrivateUnlocked(true);
            setPasscode('');
            setPasskeyModalOpen(false);
            setViewMode('archived');
          } else {
            setIsShaking(true);
            hapticService.error();
            toast.error('Incorrect Passkey');
            setPasscode('');
            setTimeout(() => setIsShaking(false), 500);
          }
        }, 150);
      }
    }
  };

  const handleDeleteClick = () => {
    hapticService.lightImpact();
    setPasscode((prev) => prev.slice(0, -1));
  };

  const handleCancelClick = () => {
    hapticService.lightImpact();
    setPasskeyModalOpen(false);
    setPasscode('');
    setViewMode('active');
  };

  // Keyboard navigation/entry support
  useEffect(() => {
    if (!passkeyModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        const num = e.key;
        hapticService.lightImpact();
        setPasscode((prev) => {
          if (prev.length >= 4) return prev;
          const newPasscode = prev + num;
          if (newPasscode.length === 4) {
            const correctPasskey = String(profile?.privatePasskey || '1234');
            setTimeout(() => {
              if (newPasscode === correctPasskey) {
                hapticService.success();
                toast.success('Access Granted');
                sessionStorage.setItem('isPrivateUnlocked', 'true');
                setIsPrivateUnlocked(true);
                setPasscode('');
                setPasskeyModalOpen(false);
                setViewMode('archived');
              } else {
                setIsShaking(true);
                hapticService.error();
                toast.error('Incorrect Passkey');
                setPasscode('');
                setTimeout(() => setIsShaking(false), 500);
              }
            }, 150);
          }
          return newPasscode;
        });
      } else if (e.key === 'Backspace') {
        hapticService.lightImpact();
        setPasscode((prev) => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        hapticService.lightImpact();
        setPasskeyModalOpen(false);
        setPasscode('');
        setViewMode('active');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [passkeyModalOpen, setViewMode, profile]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl">Memory Catalogue</h1>
          <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
            Browse and search all dynamic reminders
          </p>
        </div>

        <button onClick={handleCreateNew} className="btn-premium flex items-center justify-center gap-2">
          <span>New Reminder</span>
        </button>
      </div>

      {/* Control Panel: Filters & View Switchers */}
      <div className="rounded-xl p-4 glass border border-mk-glass-border flex flex-col md:flex-row md:items-center gap-4 justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mk-silver" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-premium pl-11"
            placeholder="Search by name, tags, description..."
          />
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as EventCategory | 'all')}
            className="input-premium bg-mk-dark w-auto text-xs py-2 px-3 h-10"
          >
            <option value="all">All Categories</option>
            <option value="birthday">🎂 Birthday</option>
            <option value="anniversary">💍 Anniversary</option>
            <option value="wedding">💒 Wedding</option>
            <option value="family">👨‍👩‍👧 Family</option>
            <option value="personal">⭐ Personal</option>
            <option value="holiday">🏖️ Holiday</option>
            <option value="business">💼 Business</option>
            <option value="custom">📅 Custom</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-white/5 rounded-xl border border-mk-glass-border p-1">
            <button
              onClick={handlePublicClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'active' ? 'bg-gradient-silver text-mk-black' : 'text-mk-silver hover:text-mk-white'
              }`}
            >
              <Unlock size={12} className={viewMode === 'active' ? 'text-mk-black' : 'text-mk-silver'} />
              Public
            </button>
            <button
              onClick={handlePrivateClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'archived' ? 'bg-gradient-silver text-mk-black' : 'text-mk-silver hover:text-mk-white'
              }`}
            >
              <Lock size={12} className={viewMode === 'archived' ? 'text-mk-black' : 'text-mk-silver'} />
              Private
            </button>
          </div>
        </div>
      </div>

      {/* Grid List rendering */}
      {viewMode === 'active' ? (
        activeEvents.length === 0 ? (
          <div className="rounded-2xl p-12 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-5xl mb-4 select-none">📅</span>
            <h3 className="text-lg font-bold text-mk-white">No public reminders found</h3>
            <p className="text-xs text-mk-silver max-w-sm mt-1.5 leading-relaxed">
              Try adjusting your search filters or create a new luxury event card reminder.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.map((event) => (
              <EventCard key={event.id} event={event} onEdit={handleEditTrigger} />
            ))}
          </div>
        )
      ) : archivedEvents.length === 0 ? (
        <div className="rounded-2xl p-12 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-5xl mb-4 select-none">🔒</span>
          <h3 className="text-lg font-bold text-mk-white">No Private Memories</h3>
          <p className="text-xs text-mk-silver max-w-sm mt-1.5 leading-relaxed">
            Move reminders to Private to keep them hidden behind your security passkey lock.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decryptedEvents.map((e) => (
            <EventCard key={e.id} event={e} isArchivedCard={true} />
          ))}
        </div>
      )}

      {/* Shared Dialog Form overlay */}
      <EventFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        editingEvent={editingEvent}
      />

      {/* Premium Glassmorphic Passkey Modal */}
      {passkeyModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xs rounded-3xl glass p-6 border border-mk-glass-border shadow-silver flex flex-col items-center gap-6 text-center"
          >
            {/* Lock Icon header with soft glow */}
            <div className="w-16 h-16 rounded-full bg-white/5 border border-mk-glass-border flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Lock className="w-6 h-6 text-mk-silver" />
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-mk-white">Private Locker</h2>
              <p className="text-[11px] text-mk-silver mt-1.5">
                Enter your 4-digit passkey to access secure private memories.
              </p>
            </div>

            {/* Passcode dots container with shake feedback */}
            <motion.div
              animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex gap-4 my-2"
            >
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    passcode.length > index
                      ? 'bg-gradient-silver border border-mk-silver shadow-[0_0_8px_rgba(255,255,255,0.5)] scale-110'
                      : 'border-2 border-mk-glass-border bg-white/5'
                  }`}
                />
              ))}
            </motion.div>

            {/* Number Pad Grid */}
            <div className="grid grid-cols-3 gap-3.5 w-full max-w-[240px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num.toString())}
                  className="w-14 h-14 rounded-full border border-mk-glass-border bg-white/5 hover:bg-white/10 active:scale-95 text-mk-white font-medium text-lg flex items-center justify-center transition-all focus:outline-none"
                >
                  {num}
                </button>
              ))}
              
              {/* Row 4: Cancel, 0, Backspace */}
              <button
                type="button"
                onClick={handleCancelClick}
                className="w-14 h-14 rounded-full text-xs text-mk-silver hover:text-mk-white hover:bg-white/5 active:scale-95 flex items-center justify-center transition-all focus:outline-none"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="w-14 h-14 rounded-full border border-mk-glass-border bg-white/5 hover:bg-white/10 active:scale-95 text-mk-white font-medium text-lg flex items-center justify-center transition-all focus:outline-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDeleteClick}
                className="w-14 h-14 rounded-full text-mk-silver hover:text-mk-white hover:bg-white/5 active:scale-95 flex items-center justify-center transition-all focus:outline-none"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[10px] text-mk-silver/40">
              Default passcode is 1234
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

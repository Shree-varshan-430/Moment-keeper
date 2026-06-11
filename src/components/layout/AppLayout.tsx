// ─── AppLayout Shell Component ────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useEventStore } from '@/store/eventStore';
import { Menu, Search, Bell, Calendar, Sparkles, X } from 'lucide-react';
import { getDaysUntilEvent } from '@/lib/utils';
import { hapticService } from '@/services/hapticService';
import { Person, CATEGORY_EMOJIS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const AppLayout: React.FC = () => {
  const { toggleSidebar, isOnline } = useUIStore();
  const { profile, user } = useAuthStore();
  const { events, persons } = useEventStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPersonForEvent = (event: any): Person | null => {
    if (event.personId) {
      return persons.find(p => p.id === event.personId) || null;
    }
    if (event.personName) {
      return persons.find(p => p.name.toLowerCase() === event.personName!.toLowerCase()) || null;
    }
    return null;
  };



  const todayNotifications = events.filter((e) => getDaysUntilEvent(e.date, e.isRecurring) === 0 && !e.isArchived);
  const upcomingNotifications = events.filter((e) => {
    const days = getDaysUntilEvent(e.date, e.isRecurring);
    return days > 0 && days <= 7 && !e.isArchived;
  });
  const totalNotifications = todayNotifications.length + upcomingNotifications.length;

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none opacity-40"></div>
      <div className="absolute top-10 left-[10%] h-[350px] w-[350px] rounded-full bg-mk-silver/5 blur-[120px] pointer-events-none animate-pulse-silver"></div>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="main-content flex flex-col min-h-screen">
        {/* Top Header Navigation */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 sm:px-8 border-b border-mk-glass-border glass transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden text-muted-foreground hover:text-foreground p-2 rounded-xl border border-mk-glass-border bg-white/5"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                Welcome back
              </span>
              <h2 className="text-lg font-bold text-foreground">
                {profile?.displayName || user?.displayName || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Valued User'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Action Bar / Status Indicators */}
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {isOnline ? 'Cloud Sync Active' : 'Offline Mode (Local Sync)'}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  hapticService.lightImpact();
                  setShowNotifications(!showNotifications);
                }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                  showNotifications
                    ? 'border-mk-silver/40 bg-white/10 text-mk-white'
                    : 'border-mk-glass-border bg-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bell size={18} />
                {totalNotifications > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-mk-black"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop layer */}
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setShowNotifications(false)}
                  />

                  {/* Dropdown panel */}
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-mk-dark border border-mk-glass-border shadow-silver p-4 z-50 animate-fade-in max-h-[360px] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-mk-glass-border/40 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-mk-white">
                        Milestone Alerts ({totalNotifications})
                      </span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-mk-silver hover:text-mk-white p-1 rounded-lg border border-mk-glass-border hover:bg-white/5 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {totalNotifications === 0 ? (
                        <div className="text-center py-6 text-xs text-mk-silver">
                          No active notifications
                        </div>
                      ) : (
                        <>
                          {/* Today's Events */}
                          {todayNotifications.map((e) => {
                            const person = getPersonForEvent(e);
                            const initials = person ? (person.nickname || person.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '';
                            
                            let formattedTitle = e.title;
                            if (person && person.nickname && person.name) {
                              const nameRegex = new RegExp(person.name, 'gi');
                              formattedTitle = e.title.replace(nameRegex, person.nickname);
                            }

                            return (
                              <div
                                key={e.id}
                                className="flex items-start gap-2.5 p-2 rounded-xl bg-mk-accent/10 border border-mk-accent/20 cursor-pointer hover:bg-mk-accent/15 transition-all"
                                onClick={() => {
                                  setShowNotifications(false);
                                  navigate('/');
                                }}
                              >
                                {person ? (
                                  person.photoUrl ? (
                                    <img
                                      src={person.photoUrl}
                                      alt={person.name}
                                      className="h-7 w-7 rounded-lg object-cover border border-mk-accent/20 shrink-0"
                                    />
                                  ) : (
                                    <div className="h-7 w-7 rounded-lg bg-mk-accent/20 border border-mk-accent/30 text-mk-accent text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                                      {initials}
                                    </div>
                                  )
                                ) : (
                                  <div className="h-7 w-7 rounded-lg bg-mk-accent flex items-center justify-center text-sm shrink-0">
                                    {CATEGORY_EMOJIS[e.category] || '🎂'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="block text-xs font-bold text-mk-white leading-tight">
                                    {formattedTitle} is today!
                                  </span>
                                  <span className="block text-[10px] text-mk-accent font-semibold uppercase tracking-wider mt-0.5">
                                    Today's Milestone
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Upcoming Events */}
                          {upcomingNotifications.map((e) => {
                            const days = getDaysUntilEvent(e.date, e.isRecurring);
                            const person = getPersonForEvent(e);
                            const initials = person ? (person.nickname || person.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '';
                            
                            let formattedTitle = e.title;
                            if (person && person.nickname && person.name) {
                              const nameRegex = new RegExp(person.name, 'gi');
                              formattedTitle = e.title.replace(nameRegex, person.nickname);
                            }

                            return (
                              <div
                                key={e.id}
                                className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-mk-glass-border/40 cursor-pointer hover:bg-white/5 transition-all"
                                onClick={() => {
                                  setShowNotifications(false);
                                  navigate('/events');
                                }}
                              >
                                {person ? (
                                  person.photoUrl ? (
                                    <img
                                      src={person.photoUrl}
                                      alt={person.name}
                                      className="h-7 w-7 rounded-lg object-cover border border-mk-glass-border/40 shrink-0"
                                    />
                                  ) : (
                                    <div className="h-7 w-7 rounded-lg bg-white/5 border border-mk-glass-border/40 text-mk-silver text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                                      {initials}
                                    </div>
                                  )
                                ) : (
                                  <div className="h-7 w-7 rounded-lg bg-white/5 border border-mk-glass-border flex items-center justify-center text-xs shrink-0">
                                    {CATEGORY_EMOJIS[e.category] || '🔔'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="block text-xs font-semibold text-mk-white leading-tight">
                                    {formattedTitle}
                                  </span>
                                  <span className="block text-[10px] text-mk-silver mt-0.5">
                                    Milestone coming up in {days} days
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-mk-glass-border/40 flex justify-between gap-2">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/settings');
                        }}
                        className="w-full text-center py-2 rounded-lg bg-white/5 border border-mk-glass-border text-[10px] font-bold uppercase tracking-wider text-mk-silver hover:text-mk-white hover:bg-white/10 transition-all"
                      >
                        Notification Settings
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

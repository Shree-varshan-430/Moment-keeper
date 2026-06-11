// ─── DashboardPage Component ──────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { EventCard } from '@/components/events/EventCard';
import { EventFormModal } from '@/components/events/EventFormModal';
import { Plus, UserPlus, Gift, Calendar, Award, Star } from 'lucide-react';
import { getDaysUntilEvent, formatCountdown, formatDateShort } from '@/lib/utils';
import { MKEvent, Person } from '@/types';
import { LiveCountdown } from '@/components/events/LiveCountdown';

// Helper to get closest upcoming event for a person
const getNextEventForPerson = (person: Person, allEvents: MKEvent[]) => {
  const personEvents = allEvents.filter(e => 
    e.personId === person.id || 
    (!e.personId && e.personName && e.personName.toLowerCase() === person.name.toLowerCase())
  );
  if (personEvents.length === 0) return null;
  
  const upcoming = personEvents
    .map(e => ({ event: e, days: getDaysUntilEvent(e.date, e.isRecurring) }))
    .filter(x => x.days >= 0)
    .sort((a, b) => a.days - b.days);
    
  return upcoming.length > 0 ? upcoming[0] : null;
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { events, persons, fetchEventsAndPersons, getStats } = useEventStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MKEvent | null>(null);

  useEffect(() => {
    if (user) {
      const unsub = fetchEventsAndPersons(user.uid);
      return () => {
        unsub.then((cleanup) => cleanup());
      };
    }
  }, [user, fetchEventsAndPersons]);

  const handleEditTrigger = (event: MKEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const stats = getStats();
  const favoritePeople = persons.filter((p) => p.isFavorite);
  const todayEvents = events.filter((e) => getDaysUntilEvent(e.date, e.isRecurring) === 0);
  const upcomingEvents = [...events]
    .filter((e) => getDaysUntilEvent(e.date, e.isRecurring) > 0)
    .sort((a, b) => getDaysUntilEvent(a.date, a.isRecurring) - getDaysUntilEvent(b.date, b.isRecurring))
    .slice(0, 5); // display top 5 upcoming events sorted by date ascending

  const allUpcomingAndToday = [...events]
    .map(e => ({ event: e, days: getDaysUntilEvent(e.date, e.isRecurring) }))
    .filter(x => x.days >= 0)
    .sort((a, b) => a.days - b.days);

  const closestEventObj = allUpcomingAndToday.length > 0 ? allUpcomingAndToday[0] : null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Premium Favorites Row */}
      {favoritePeople.length > 0 && (
        <div className="glass border border-mk-glass-border/40 rounded-2xl p-6 shadow-silver-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight text-mk-white flex items-center gap-2">
              <span className="text-yellow-400 animate-pulse">⭐</span>
              <span>Premium Favorites</span>
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/95 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full">
              Special Inner Circle
            </span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {favoritePeople.map((person) => {
              const nextEventObj = getNextEventForPerson(person, events);
              const initials = (person.nickname || person.name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              
              return (
                <div
                  key={person.id}
                  onClick={() => navigate('/people', { state: { selectedPersonId: person.id } })}
                  className="flex-shrink-0 w-44 rounded-xl p-4 bg-white/5 hover:bg-white/10 border border-mk-glass-border hover:border-amber-400/30 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group relative overflow-hidden animate-scale-up"
                >
                  {/* Subtle golden background glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-400/0 via-amber-400/0 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Avatar with Gold Ring */}
                  <div className="relative mb-3">
                    {person.photoUrl ? (
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-400/80 ring-offset-2 ring-offset-mk-black shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold text-lg ring-2 ring-amber-400/80 ring-offset-2 ring-offset-mk-black shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-transform duration-300 group-hover:scale-105">
                        {initials}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-amber-400 text-mk-black rounded-full p-1 border border-mk-black text-[9px] font-bold shadow-md">
                      👑
                    </span>
                  </div>

                  {/* Nickname and Full Name */}
                  <h3 className="font-bold text-mk-white text-sm truncate w-full group-hover:text-amber-300 transition-colors">
                    {person.nickname || person.name}
                  </h3>
                  {person.nickname && (
                    <p className="text-[10px] text-mk-silver truncate w-full mt-0.5">
                      {person.name}
                    </p>
                  )}

                  {/* Countdown Badge */}
                  <div className="mt-3 w-full">
                    {nextEventObj ? (
                      <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 py-1.5 px-2 text-[10px] font-medium text-amber-300">
                        <div className="font-bold truncate" title={nextEventObj.event.title}>
                          {nextEventObj.event.title}
                        </div>
                        <div className="text-[9px] opacity-80 mt-0.5">
                          {formatCountdown(nextEventObj.days)}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-white/5 border border-white/5 py-1.5 px-2 text-[10px] font-medium text-mk-silver">
                        No upcoming events
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestone Spotlight Panel */}
        <div className="lg:col-span-2 rounded-2xl p-6 sm:p-8 glass border border-mk-glass-border shadow-silver flex flex-col justify-between relative overflow-hidden group min-h-[280px] sm:min-h-[350px]">
          {/* Subtle decorative glowing mesh behind */}
          <div className="absolute -top-1/4 -right-1/4 h-[300px] w-[300px] rounded-full bg-mk-silver/5 blur-[80px] pointer-events-none group-hover:bg-mk-silver/10 transition-colors duration-500" />
          
          {closestEventObj ? (
            <div className="h-full flex flex-col justify-between gap-6 z-10 w-full">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2.5 rounded-xl bg-white/5 border border-mk-glass-border/40 shrink-0">
                    {closestEventObj.event.category === 'birthday' ? '🎂' :
                     closestEventObj.event.category === 'anniversary' ? '💍' :
                     closestEventObj.event.category === 'wedding' ? '💒' :
                     closestEventObj.event.category === 'family' ? '👨‍👩‍👧' :
                     closestEventObj.event.category === 'personal' ? '⭐' :
                     closestEventObj.event.category === 'holiday' ? '🏖️' :
                     closestEventObj.event.category === 'business' ? '💼' : '📅'}
                  </span>
                  <div>
                    <span className="inline-block text-[9px] uppercase font-bold tracking-widest text-mk-silver bg-white/5 px-2 py-0.5 rounded border border-mk-glass-border/30 mb-1">
                      Upcoming Milestone Spotlight
                    </span>
                    <h2 className="text-xl font-bold text-mk-white font-display leading-tight">
                      {closestEventObj.event.title}
                    </h2>
                  </div>
                </div>

                <div className="glass-sm border border-mk-glass-border/40 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-mk-white">
                  <span className={`h-2 w-2 rounded-full ${closestEventObj.days === 0 ? 'bg-rose-500 animate-ping' : 'bg-mk-accent'}`} />
                  <LiveCountdown dateStr={closestEventObj.event.date} isRecurring={closestEventObj.event.isRecurring} />
                </div>
              </div>

              {/* Middle Section: Countdown and Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-auto">
                <div className="flex items-center gap-4 bg-white/[0.01] border border-mk-glass-border/30 p-4 rounded-xl">
                  {/* giant days counter */}
                  {/* giant days counter / live countdown */}
                  <div className="text-center shrink-0 min-w-[80px]">
                    {closestEventObj.days === 0 || closestEventObj.days === 1 ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="block font-display text-2xl sm:text-3xl font-extrabold text-mk-white tracking-tighter">
                          <LiveCountdown dateStr={closestEventObj.event.date} isRecurring={closestEventObj.event.isRecurring} />
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-mk-silver mt-1">
                          Time Left
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <span className="block font-display text-4xl sm:text-5xl font-extrabold text-mk-white tracking-tighter">
                          {closestEventObj.days.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-mk-silver">
                          Days Left
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-l border-mk-glass-border/40 pl-4 py-1 min-w-0 flex-1">
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-mk-silver mb-1">Linked Person</span>
                    {(() => {
                      const matchedPerson = persons.find(p => p.id === closestEventObj.event.personId);
                      if (matchedPerson) {
                        return (
                          <div className="flex items-center gap-2 min-w-0">
                            {matchedPerson.photoUrl ? (
                              <img src={matchedPerson.photoUrl} className="h-6 w-6 rounded-full object-cover border border-mk-glass-border" alt="" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-white/5 border border-mk-glass-border flex items-center justify-center text-[10px] font-bold text-mk-silver uppercase">
                                {(matchedPerson.nickname || matchedPerson.name).substring(0, 2)}
                              </div>
                            )}
                            <span className="font-semibold text-xs text-mk-white truncate">
                              {matchedPerson.nickname || matchedPerson.name}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <span className="text-xs text-mk-silver italic truncate block">
                          {closestEventObj.event.personName || 'No Person Profile Linked'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col justify-center bg-white/[0.01] border border-mk-glass-border/30 p-4 rounded-xl min-w-0">
                  <span className="block text-[8px] font-bold uppercase tracking-wider text-mk-silver mb-1">
                    Description & Notes
                  </span>
                  <p className="text-xs text-mk-silver/95 leading-relaxed italic truncate">
                    {closestEventObj.event.description || closestEventObj.event.notes || 'No custom notes logged.'}
                  </p>
                </div>
              </div>

              {/* Bottom: Progress Bar & Direct Action */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-mk-silver font-bold uppercase tracking-wider">Milestone Preparation</span>
                  <span className="font-mono text-mk-white font-bold">{Math.round((1 - Math.min(closestEventObj.days, 365) / 365) * 100)}% Ready</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-mk-glass-border/30">
                  <div
                    className="h-full bg-gradient-silver transition-all duration-500 rounded-full"
                    style={{ width: `${Math.round((1 - Math.min(closestEventObj.days, 365) / 365) * 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-mk-silver/80">Event Date: {formatDateShort(closestEventObj.event.date)}</span>
                  <button
                    onClick={() => handleEditTrigger(closestEventObj.event)}
                    className="text-xs font-bold text-mk-accent hover:text-mk-white hover:underline transition-colors flex items-center gap-1 pointer-events-auto"
                  >
                    <span>Manage Reminder</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between gap-6 z-10 w-full">
              <div>
                <span className="inline-block text-[9px] uppercase font-bold tracking-widest text-mk-silver bg-white/5 px-2 py-0.5 rounded border border-mk-glass-border/30 mb-2">
                  Welcome to MomentKeeper
                </span>
                <h2 className="text-2xl font-bold text-mk-white font-display leading-tight">
                  No active reminders scheduled
                </h2>
                <p className="text-sm text-mk-silver mt-2 max-w-md leading-relaxed">
                  Start tracking important events, birthdays, anniversaries, and personal gift ideas by adding your first reminder.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCreateNew}
                  className="btn-premium px-5 py-2.5 text-xs font-bold"
                >
                  Create Your First Reminder
                </button>
                <button
                  onClick={() => navigate('/people')}
                  className="rounded-xl border border-mk-glass-border bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-mk-white transition-all"
                >
                  Add People Profiles
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-2xl p-6 glass border border-mk-glass-border flex flex-col justify-between shadow-silver">
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight text-mk-white mb-2">
              Memory Companion
            </h3>
            <p className="text-sm text-mk-silver leading-relaxed">
              Create premium digital reminders and manage personal notes of friends & family.
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center justify-center gap-2 btn-premium py-3"
            >
              <Plus size={18} />
              <span>New Reminder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total, icon: Calendar, color: 'text-mk-silver' },
          { label: 'Today', value: stats.todayCount, icon: Gift, color: 'text-rose-400' },
          { label: 'Next 30 Days', value: stats.upcoming30Days, icon: Award, color: 'text-mk-accent' },
          { label: 'Favorites', value: stats.favorites, icon: Star, color: 'text-yellow-400' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl p-4 glass-sm border border-mk-glass-border flex items-center gap-4 hover:border-mk-silver/20 transition-all duration-300"
            >
              <div className={`p-2.5 rounded-lg bg-white/5 border border-mk-glass-border ${s.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-wider text-mk-silver leading-none mb-1">
                  {s.label}
                </span>
                <span className="text-xl font-bold text-mk-white leading-none">
                  {s.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Lists Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Today's Events */}
        <div>
          <h2 className="section-title mb-4 flex items-center gap-2">
            <span>🎉 Today's Milestones</span>
            {todayEvents.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </h2>

          {todayEvents.length === 0 ? (
            <div className="rounded-2xl p-8 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[220px]">
              <span className="text-4xl mb-3 select-none">📅</span>
              <p className="text-sm font-semibold text-mk-white">No milestones today</p>
              <p className="text-xs text-mk-silver mt-1">Everything is quiet. Enjoy your day!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayEvents.map((e) => (
                <EventCard key={e.id} event={e} onEdit={handleEditTrigger} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div>
          <h2 className="section-title mb-4">🌟 Upcoming Milestones</h2>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-2xl p-8 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[220px]">
              <span className="text-4xl mb-3 select-none">🎁</span>
              <p className="text-sm font-semibold text-mk-white">No upcoming events</p>
              <p className="text-xs text-mk-silver mt-1">Get started by creating a new reminder!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((e) => (
                <EventCard key={e.id} event={e} onEdit={handleEditTrigger} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal dialog */}
      <EventFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
      />
    </div>
  );
};

// ─── CalendarPage Component ───────────────────────────────────

import React, { useEffect, useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { EventFormModal } from '@/components/events/EventFormModal';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from 'lucide-react';
import { CATEGORY_EMOJIS, MKEvent, Person } from '@/types';
import { getCategoryColor } from '@/lib/utils';

const getSuggestionsForYear = (year: number) => {
  const getFirstSundayOfAugustStr = () => {
    const d = new Date(year, 7, 1);
    const day = d.getDay();
    const diff = (7 - day) % 7;
    d.setDate(1 + diff);
    return `${year}-08-${String(d.getDate()).padStart(2, '0')}`;
  };

  return [
    {
      id: 'sugg-roseday',
      title: "🌹 Rose Day",
      description: "The first day of Valentine's week, when you present roses to your loved ones.",
      category: 'holiday' as const,
      date: `${year}-02-07`,
      isRecurring: true,
      tags: ['couple', 'love'],
      isSuggestion: true,
    },
    {
      id: 'sugg-proposeday',
      title: "💍 Propose Day",
      description: "The second day of Valentine's week, perfect for confessing your feelings or proposing.",
      category: 'holiday' as const,
      date: `${year}-02-08`,
      isRecurring: true,
      tags: ['couple', 'love'],
      isSuggestion: true,
    },
    {
      id: 'sugg-chocolateday',
      title: "🍫 Chocolate Day",
      description: "The third day of Valentine's week, celebrate by sharing sweet chocolates.",
      category: 'holiday' as const,
      date: `${year}-02-09`,
      isRecurring: true,
      tags: ['couple', 'love', 'friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-teddyday',
      title: "🧸 Teddy Day",
      description: "The fourth day of Valentine's week, gift a soft teddy bear as a symbol of care.",
      category: 'holiday' as const,
      date: `${year}-02-10`,
      isRecurring: true,
      tags: ['couple', 'friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-promiseday',
      title: "🤝 Promise Day",
      description: "The fifth day of Valentine's week, make lasting promises to support and love each other.",
      category: 'holiday' as const,
      date: `${year}-02-11`,
      isRecurring: true,
      tags: ['couple', 'friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-hugday',
      title: "🤗 Hug Day",
      description: "The sixth day of Valentine's week, share a warm hug with those who matter most.",
      category: 'holiday' as const,
      date: `${year}-02-12`,
      isRecurring: true,
      tags: ['couple', 'friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-kissday',
      title: "💋 Kiss Day",
      description: "The seventh day of Valentine's week, a day to express love through a kiss.",
      category: 'holiday' as const,
      date: `${year}-02-13`,
      isRecurring: true,
      tags: ['couple'],
      isSuggestion: true,
    },
    {
      id: 'sugg-valentines',
      title: "💖 Valentine's Day",
      description: "The international day of celebrating love and couples.",
      category: 'holiday' as const,
      date: `${year}-02-14`,
      isRecurring: true,
      tags: ['couple', 'love'],
      isSuggestion: true,
    },
    {
      id: 'sugg-galentines',
      title: "👯 Galentine's Day",
      description: "Celebrate the love and support of your closest female friends.",
      category: 'holiday' as const,
      date: `${year}-02-13`,
      isRecurring: true,
      tags: ['friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-whiteday',
      title: "🍬 White Day",
      description: "A day to return gifts to those who gave them on Valentine's Day.",
      category: 'holiday' as const,
      date: `${year}-03-14`,
      isRecurring: true,
      tags: ['couple'],
      isSuggestion: true,
    },
    {
      id: 'sugg-bestfriends',
      title: "🤗 National Best Friends Day",
      description: "Time to honor your best friends and show your appreciation.",
      category: 'holiday' as const,
      date: `${year}-06-08`,
      isRecurring: true,
      tags: ['friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-couplesday',
      title: "💑 National Couples Day",
      description: "A day dedicated to celebrating your partnership and love.",
      category: 'holiday' as const,
      date: `${year}-08-18`,
      isRecurring: true,
      tags: ['couple'],
      isSuggestion: true,
    },
    {
      id: 'sugg-friendship',
      title: "🤝 International Friendship Day",
      description: "A global day to cherish and appreciate the friends in your life.",
      category: 'holiday' as const,
      date: `${year}-07-30`,
      isRecurring: true,
      tags: ['friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-friendship-india',
      title: "🤝 Friendship Day (India)",
      description: "Celebrated on the first Sunday of August to honor friends.",
      category: 'holiday' as const,
      date: getFirstSundayOfAugustStr(),
      isRecurring: true,
      tags: ['friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-sweetest',
      title: "🍭 Sweetest Day",
      description: "Show romantic partners and friends how sweet they are with cards and treats.",
      category: 'holiday' as const,
      date: `${year}-10-17`,
      isRecurring: true,
      tags: ['couple', 'friends'],
      isSuggestion: true,
    },
    {
      id: 'sugg-spousesday',
      title: "💍 National Spouses Day",
      description: "A quiet day to express gratitude and celebrate your spouse.",
      category: 'holiday' as const,
      date: `${year}-01-26`,
      isRecurring: true,
      tags: ['couple'],
      isSuggestion: true,
    },
  ];
};

export const CalendarPage: React.FC = () => {
  const { user } = useAuthStore();
  const { events, persons, fetchEventsAndPersons } = useEventStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalOpen, setModalOpen] = useState(false);

  // Helper to retrieve associated person profile
  const getPersonForEvent = (event: any): Person | null => {
    if (!event || 'isSuggestion' in event) return null;
    if (event.personId) {
      return persons.find(p => p.id === event.personId) || null;
    }
    if (event.personName) {
      return persons.find(p => p.name.toLowerCase() === event.personName!.toLowerCase()) || null;
    }
    return null;
  };

  useEffect(() => {
    if (user) {
      const unsub = fetchEventsAndPersons(user.uid);
      return () => {
        unsub.then((cleanup) => cleanup());
      };
    }
  }, [user, fetchEventsAndPersons]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Calendar logic intervals
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Get active day event triggers
  const getDayEvents = (day: Date) => {
    const userDayEvents = events.filter((e) => {
      const eDate = parseISO(e.date);
      // Compare month and day directly (recurring anniversaries/birthdays)
      if (e.isRecurring) {
        return eDate.getMonth() === day.getMonth() && eDate.getDate() === day.getDate();
      }
      return isSameDay(eDate, day);
    });

    const suggestions = getSuggestionsForYear(day.getFullYear());
    const standardSuggestedEvents = suggestions.filter((s) => {
      const sDate = parseISO(s.date);
      return sDate.getMonth() === day.getMonth() && sDate.getDate() === day.getDate();
    });

    return [...userDayEvents, ...standardSuggestedEvents];
  };

  const selectedDayEvents = selectedDate ? getDayEvents(selectedDate) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl">Memory Calendar</h1>
          <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
            Map out milestones and filter agendas
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-premium flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Main Grid Calendar & Selected Agenda details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Box */}
        <div className="lg:col-span-2 rounded-2xl p-6 glass border border-mk-glass-border shadow-silver">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-mk-white font-display">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-mk-glass-border bg-white/5 hover:bg-white/10 text-mk-silver hover:text-mk-white transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-mk-glass-border bg-white/5 hover:bg-white/10 text-mk-silver hover:text-mk-white transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday titles */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-mk-silver uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid cells */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayEvents = getDayEvents(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[85px] p-2 rounded-xl border cursor-pointer flex flex-col justify-between transition-all select-none relative ${
                    isSelected
                      ? 'bg-gradient-silver border-white text-mk-black shadow-silver'
                      : isDayToday
                      ? 'border-mk-accent bg-mk-accent/5 text-mk-white'
                      : 'border-mk-glass-border/40 bg-white/[0.02] text-mk-white hover:bg-white/5'
                  } ${!isCurrentMonth && 'opacity-30'}`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-mk-black' : 'text-mk-silver'}`}>
                    {format(day, 'd')}
                  </span>

                  {/* Emojis & Avatars indicators inside day cell */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 max-h-[40px] overflow-hidden items-center">
                      {dayEvents.slice(0, 3).map((e) => {
                        const person = getPersonForEvent(e);
                        if (person) {
                          return person.photoUrl ? (
                            <img
                              key={e.id}
                              src={person.photoUrl}
                              alt={person.nickname || person.name}
                              title={`${e.title} - ${person.nickname || person.name}`}
                              className="h-4 w-4 rounded-full object-cover border border-white/20 shrink-0"
                            />
                          ) : (
                            <div
                              key={e.id}
                              title={`${e.title} - ${person.nickname || person.name}`}
                              className="h-4 w-4 rounded-full bg-white/10 text-[6px] font-extrabold text-mk-silver flex items-center justify-center uppercase border border-white/15 shrink-0"
                            >
                              {(person.nickname || person.name).substring(0, 2).toUpperCase()}
                            </div>
                          );
                        }
                        return (
                          <span
                            key={e.id}
                            className="text-[10px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0"
                            title={e.title}
                          >
                            {CATEGORY_EMOJIS[e.category] || '📅'}
                          </span>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] font-bold text-mk-silver leading-none mt-1">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Agenda list panel */}
        <div className="rounded-2xl p-6 glass border border-mk-glass-border flex flex-col justify-between shadow-silver">
          <div>
            <h2 className="text-lg font-bold text-mk-white font-display mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-mk-silver" />
              <span>Agenda: {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'No Date'}</span>
            </h2>

            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center justify-center">
                <span className="text-4xl mb-2 select-none">🕊️</span>
                <p className="text-sm font-semibold text-mk-silver">No reminders scheduled</p>
                <p className="text-[11px] text-mk-silver/70 mt-0.5">Keep track of milestones</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {selectedDayEvents.map((e) => {
                  const isSuggestion = 'isSuggestion' in e;
                  const person = isSuggestion ? null : getPersonForEvent(e);
                  return (
                    <div
                      key={e.id}
                      className={`p-3 rounded-xl border transition-colors flex items-start gap-3 ${
                        isSuggestion
                           ? 'border-mk-accent/30 bg-mk-accent/5 hover:bg-mk-accent/10'
                           : 'border-mk-glass-border/60 bg-white/[0.02] hover:bg-white/5'
                      }`}
                    >
                      <span className="text-2xl mt-0.5">
                        {isSuggestion ? '✨' : (CATEGORY_EMOJIS[e.category] || '📅')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-mk-white line-clamp-1">{e.title}</h4>
                          {isSuggestion && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-mk-accent/25 text-mk-accent uppercase tracking-wider whitespace-nowrap">
                              Suggested
                            </span>
                          )}
                        </div>
                        {!isSuggestion && person ? (
                          <div className="flex items-center gap-2 mt-1.5 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg">
                            {person.photoUrl ? (
                              <img
                                src={person.photoUrl}
                                alt={person.name}
                                className="h-5 w-5 rounded-full object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-white/15 text-[8px] font-bold flex items-center justify-center text-mk-silver uppercase border border-white/10 shrink-0">
                                {(person.nickname || person.name).substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs text-mk-silver truncate">
                              For <span className="font-semibold text-mk-white">{person.nickname || person.name}</span>
                              {person.nickname && <span className="text-[10px] opacity-75 ml-1">({person.name})</span>}
                            </span>
                          </div>
                        ) : (
                          'personName' in e && (e as any).personName && (
                            <p className="text-xs text-mk-silver mt-1.5">For {(e as any).personName}</p>
                          )
                        )}
                        {e.description && (
                          <p className="text-[11px] text-mk-silver/80 mt-1.5 line-clamp-2">{e.description}</p>
                        )}
                        {isSuggestion && e.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {e.tags.map((t) => (
                              <span key={t} className="text-[8px] font-bold uppercase tracking-wider text-mk-silver bg-white/5 border border-mk-glass-border px-1.5 py-0.5 rounded-full">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <EventFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingEvent={null}
      />
    </div>
  );
};

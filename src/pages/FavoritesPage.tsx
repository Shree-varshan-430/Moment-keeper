// ─── FavoritesPage Component ──────────────────────────────────

import React, { useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { EventCard } from '@/components/events/EventCard';
import { Heart, Star, Users, Calendar } from 'lucide-react';

export const FavoritesPage: React.FC = () => {
  const { user } = useAuthStore();
  const { events, persons, fetchEventsAndPersons } = useEventStore();

  useEffect(() => {
    if (user) {
      const unsub = fetchEventsAndPersons(user.uid);
      return () => {
        unsub.then((cleanup) => cleanup());
      };
    }
  }, [user, fetchEventsAndPersons]);

  const favoriteEvents = events.filter((e) => e.isFavorite);
  const favoritePersons = persons.filter((p) => p.isFavorite);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="section-title text-3xl">Premium Favorites</h1>
        <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
          Quick access to your most important people and dates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Favorite Events */}
        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-mk-accent" />
            <span>Important Milestones</span>
          </h2>

          {favoriteEvents.length === 0 ? (
            <div className="rounded-2xl p-8 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[220px]">
              <Heart size={32} className="text-mk-dark-3 mb-2" />
              <p className="text-sm font-semibold text-mk-silver">No favorite events marked</p>
              <p className="text-xs text-mk-silver/70 mt-0.5">Click the star button on any reminder card.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteEvents.map((e) => (
                <EventCard key={e.id} event={e} onEdit={() => {}} />
              ))}
            </div>
          )}
        </div>

        {/* Favorite People */}
        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-4 flex items-center gap-2">
            <Users size={18} className="text-mk-accent" />
            <span>Key Profiles</span>
          </h2>

          {favoritePersons.length === 0 ? (
            <div className="rounded-2xl p-8 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[220px]">
              <Heart size={32} className="text-mk-dark-3 mb-2" />
              <p className="text-sm font-semibold text-mk-silver">No key profiles marked</p>
              <p className="text-xs text-mk-silver/70 mt-0.5">Toggle star badges on personal memory details.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {favoritePersons.map((p) => (
                <div key={p.id} className="p-4 rounded-xl glass-sm border border-mk-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-silver text-mk-black flex items-center justify-center font-bold">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-mk-white">{p.name}</h4>
                      <p className="text-xs text-mk-silver">{p.relationship || 'Friend'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

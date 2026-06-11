// ─── Celebration Experience Screen Component ──────────────────

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useEventStore } from '@/store/eventStore';
import { Sparkles, X, Heart } from 'lucide-react';
import { hapticService } from '@/services/hapticService';
import { audioService } from '@/services/audioService';

export const CelebrationScreen: React.FC = () => {
  const { celebrationEventId, triggerCelebration } = useUIStore();
  const { events } = useEventStore();
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [decorations, setDecorations] = useState<Array<{ id: number; x: number; y: number; delay: number; scale: number; rotation: number }>>([]);

  useEffect(() => {
    if (celebrationEventId) {
      const matched = events.find((e) => e.id === celebrationEventId);
      setActiveEvent(matched || null);
      if (matched) {
        hapticService.startHeartbeat();
        audioService.playCategorySound(matched.category);
      }

      // Generate random floating particle positions
      const items = Array.from({ length: 25 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage width
        y: Math.random() * 50 + 100, // start below viewport
        delay: Math.random() * 1.5,
        scale: Math.random() * 0.8 + 0.6,
        rotation: Math.random() * 360,
      }));
      setDecorations(items);
    } else {
      setActiveEvent(null);
    }
  }, [celebrationEventId, events]);

  const getSpotifyEmbedUrl = (url?: string) => {
    if (!url) return null;
    const match = url.match(/(track|album|playlist)[/:]([a-zA-Z0-9]+)/);
    if (match && match[1] && match[2]) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
    }
    return null;
  };

  if (!activeEvent) return null;

  const isBirthday = activeEvent.category === 'birthday';
  const isAnniversary = activeEvent.category === 'anniversary';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-mk-black overflow-hidden select-none"
      >
        {/* Floating Celebrations Overlay Elements */}
        {decorations.map((d) => (
          <motion.div
            key={d.id}
            initial={{ y: '110vh', rotate: d.rotation, opacity: 0 }}
            animate={{
              y: '-20vh',
              rotate: d.rotation + 360,
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{
              duration: 6,
              delay: d.delay,
              ease: 'linear',
              repeat: Infinity,
            }}
            style={{
              left: `${d.x}%`,
              scale: d.scale,
            }}
            className="absolute top-0 pointer-events-none text-3xl"
          >
            {isBirthday && (
              <span className="filter drop-shadow-[0_4px_10px_rgba(236,72,153,0.4)]">
                {d.id % 3 === 0 ? '🎈' : d.id % 3 === 1 ? '✨' : '🎂'}
              </span>
            )}
            {isAnniversary && (
              <Heart
                size={28}
                className="text-purple-400 fill-current opacity-80 filter drop-shadow-[0_4px_10px_rgba(168,85,247,0.4)]"
              />
            )}
            {!isBirthday && !isAnniversary && (
              <span className="filter drop-shadow-[0_4px_10px_rgba(192,192,192,0.4)]">
                {d.id % 2 === 0 ? '🎉' : '✨'}
              </span>
            )}
          </motion.div>
        ))}

        {/* Centerpiece Display Panel */}
        <motion.div
          initial={{ scale: 0.8, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative max-w-lg w-full mx-4 rounded-3xl p-8 glass text-center border border-mk-glass-border shadow-silver"
        >
          {/* Close Action */}
          <button
            onClick={() => triggerCelebration(null)}
            className="absolute top-4 right-4 text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>

          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-silver text-mk-black text-4xl shadow-silver animate-bounce">
              {isBirthday ? '🎂' : isAnniversary ? '💍' : '🎉'}
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-mk-accent mb-2">
            <Sparkles size={12} />
            <span>Today's Milestone</span>
          </span>

          <h2 className="font-display text-4xl font-bold tracking-tight text-mk-white mb-2">
            {activeEvent.title}
          </h2>

          {activeEvent.personName && (
            <p className="text-lg font-semibold text-gradient mb-4">
              Celebrating {activeEvent.personName}!
            </p>
          )}

          {activeEvent.description && (
            <p className="text-sm text-mk-silver leading-relaxed mb-6">
              {activeEvent.description}
            </p>
          )}

          {activeEvent.spotifyUrl && getSpotifyEmbedUrl(activeEvent.spotifyUrl) && (
            <div className="mb-6 rounded-xl overflow-hidden border border-mk-glass-border shadow-elevation-1 bg-black/40">
              <iframe
                src={getSpotifyEmbedUrl(activeEvent.spotifyUrl)!}
                width="100%"
                height="80"
                frameBorder="0"
                allowFullScreen={false}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Spotify Alarm Player"
                className="w-full border-none"
              ></iframe>
            </div>
          )}

          <button
            onClick={() => triggerCelebration(null)}
            className="btn-premium px-8 py-3 rounded-xl font-bold shadow-glow"
          >
            Send Best Wishes 🎉
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

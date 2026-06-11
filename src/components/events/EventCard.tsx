// ─── Premium EventCard Component with 3D Hover Tilt ───────────

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getDaysUntilEvent, getCategoryColor, getCategoryGradient, formatCountdown, getProgressPercent, formatDateShort } from '@/lib/utils';
import { useEventStore } from '@/store/eventStore';
import { useUIStore } from '@/store/uiStore';
import { Heart, Edit, Lock, Unlock, Calendar, Star, Trash2, RefreshCw } from 'lucide-react';
import { CATEGORY_EMOJIS, MKEvent } from '@/types';
import toast from 'react-hot-toast';
import { hapticService } from '@/services/hapticService';
import { LiveCountdown } from './LiveCountdown';

interface EventCardProps {
  event: MKEvent;
  onEdit?: (event: MKEvent) => void;
  isArchivedCard?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onEdit, isArchivedCard = false }) => {
  const { toggleFavoriteEvent, archiveExistingEvent, restoreArchivedEvent, removeEvent, persons } = useEventStore();
  const { triggerCelebration } = useUIStore();

  const person = event.personId
    ? persons.find((p) => p.id === event.personId)
    : event.personName
    ? persons.find((p) => p.name.toLowerCase() === event.personName?.toLowerCase())
    : null;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const days = getDaysUntilEvent(event.date, event.isRecurring);
  const percent = getProgressPercent(days);
  const categoryColor = getCategoryColor(event.category);
  const bgGradient = getCategoryGradient(event.category);

  // Framer Motion 3D Hover Spring Setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { damping: 25, stiffness: 200 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { damping: 25, stiffness: 200 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      hapticService.lightImpact();
      await toggleFavoriteEvent(event.id, event.isFavorite);
      toast.success(event.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      hapticService.error();
      toast.error('Failed to update favorite status.');
    }
  };

  const handleArchiveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      hapticService.mediumImpact();
      await archiveExistingEvent(event.id);
      toast.success('Event moved to Private.');
    } catch (err) {
      hapticService.error();
      toast.error('Failed to move event to Private.');
    }
  };

  const handleRestoreClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      hapticService.mediumImpact();
      await restoreArchivedEvent(event.id);
      toast.success('Event made Public.');
      hapticService.success();
    } catch (err) {
      hapticService.error();
      toast.error('Failed to make event Public.');
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this event? This action is irreversible.')) {
      try {
        hapticService.heavyImpact();
        await removeEvent(event.id);
        toast.success('Event permanently deleted.');
      } catch (err) {
        hapticService.error();
        toast.error('Failed to delete event.');
      }
    }
  };

  const handleTriggerCelebration = () => {
    if (days === 0) {
      hapticService.lightImpact();
      triggerCelebration(event.id);
    }
  };

  // Circular SVG ring properties
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={() => setIsHovered(true)}
      onClick={handleTriggerCelebration}
      style={{
        rotateX: rotateX,
        rotateY: rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`group relative rounded-2xl p-6 glass border border-mk-glass-border shadow-elevation-2 cursor-pointer transition-all duration-300 hover:shadow-silver hover:border-mk-silver/30 overflow-hidden select-none ${
        isArchivedCard ? 'opacity-75' : ''
      }`}
    >
      {/* Category Accent Gradient Mesh overlay */}
      <div className={`absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br ${bgGradient} blur-2xl opacity-60 group-hover:scale-125 transition-transform duration-500 pointer-events-none`}></div>

      {/* Interactive Shine Reflection effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}

      {/* Card Info Content */}
      <div className="flex justify-between items-start mb-4" style={{ transform: 'translateZ(20px)' }}>
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-mk-silver mb-1.5">
            <span>{CATEGORY_EMOJIS[event.category]}</span>
            <span>{event.category}</span>
          </span>
          <h3 className="text-xl font-bold tracking-tight text-mk-white group-hover:text-gradient transition-colors">
            {event.title}
          </h3>
          {(person || event.personName) && (
            <div className="flex items-center gap-2 mt-1.5">
              {person?.photoUrl ? (
                <img
                  src={person.photoUrl}
                  className="h-6 w-6 rounded-full object-cover border border-mk-glass-border shadow-sm shrink-0"
                  alt={person.name}
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-white/5 border border-mk-glass-border flex items-center justify-center text-[9px] font-bold text-mk-silver shrink-0 uppercase">
                  {((person?.nickname || person?.name || event.personName || 'P').substring(0, 2))}
                </div>
              )}
              <span className="text-xs font-semibold text-mk-silver truncate">
                For {person ? (person.nickname ? `${person.nickname} (${person.name})` : person.name) : event.personName}
              </span>
            </div>
          )}
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative h-18 w-18 flex items-center justify-center">
          <svg className="h-16 w-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-mk-dark-3 fill-transparent"
              strokeWidth="4"
            />
            <motion.circle
              cx="32"
              cy="32"
              r={radius}
              className="fill-transparent stroke-mk-silver transition-all duration-500 ease-out"
              strokeWidth="4"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              style={{ stroke: categoryColor }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center w-full px-1">
            {days === 0 || days === 1 ? (
              <span className="text-[8px] font-bold text-mk-white leading-none tracking-tighter whitespace-nowrap">
                <LiveCountdown dateStr={event.date} isRecurring={event.isRecurring} shortFormat={true} />
              </span>
            ) : (
              <>
                <span className="text-[10px] font-bold text-mk-white leading-none">
                  {days}
                </span>
                <span className="text-[8px] font-medium text-mk-silver uppercase leading-none mt-0.5">
                  Days
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description / Notes snippet */}
      {event.description && (
        <p className="text-xs text-mk-silver/80 line-clamp-2 mb-4" style={{ transform: 'translateZ(10px)' }}>
          {event.description}
        </p>
      )}

      {/* Tags section */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5" style={{ transform: 'translateZ(10px)' }}>
          {event.tags.map((t) => (
            <span key={t} className="text-[9px] font-semibold bg-white/5 border border-mk-glass-border text-mk-silver px-2 py-0.5 rounded-full">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Actions and Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-mk-glass-border/60" style={{ transform: 'translateZ(15px)' }}>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-mk-silver">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDateShort(event.date)}</span>
          </div>
          {event.spotifyUrl && (
            <div className="flex items-center gap-1 text-[#1DB954]" title="Spotify Alarm Synchronized">
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-1.026-.33.076-.66-.135-.736-.465-.075-.33.136-.66.465-.736 3.854-.88 7.15-.502 9.816 1.13.295.18.387.563.207.86zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.243-.574 11.35 1.34.368.225.488.707.262 1.076zm.106-2.833C14.39 8.71 8.57 8.52 5.176 9.553c-.53.16-1.09-.14-1.25-.67-.16-.53.14-1.09.67-1.25 3.9-1.185 10.33-.966 14.35 1.42.477.283.633.9.35 1.378-.282.478-.9.634-1.378.352z"/>
              </svg>
              <span>Synced</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isArchivedCard ? (
            <>
              {/* Make Public Button */}
              <button
                onClick={handleRestoreClick}
                className="p-1.5 rounded-lg border border-mk-glass-border bg-white/5 text-mk-silver hover:text-mk-white hover:bg-white/10 transition-all"
                title="Make Public"
              >
                <Unlock size={14} />
              </button>
              
              {/* Delete Permanently Button */}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg border border-mk-glass-border bg-white/5 text-mk-silver hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Delete Permanently"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded-lg border transition-all ${
                  event.isFavorite
                    ? 'bg-mk-accent/15 border-mk-accent/30 text-mk-accent'
                    : 'border-mk-glass-border bg-white/5 text-mk-silver hover:text-mk-white'
                }`}
                title={event.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
              >
                <Star size={14} className={event.isFavorite ? 'fill-current' : ''} />
              </button>

              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(event);
                }}
                className="p-1.5 rounded-lg border border-mk-glass-border bg-white/5 text-mk-silver hover:text-mk-white transition-all"
                title="Edit Event"
              >
                <Edit size={14} />
              </button>

              {/* Move to Private Button */}
              <button
                onClick={handleArchiveClick}
                className="p-1.5 rounded-lg border border-mk-glass-border bg-white/5 text-mk-silver hover:text-mk-white hover:bg-white/10 transition-all"
                title="Move to Private"
              >
                <Lock size={14} />
              </button>

              {/* Delete Button */}
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg border border-mk-glass-border bg-white/5 text-mk-silver hover:text-destructive hover:bg-destructive/10 transition-all"
                title="Delete Event"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

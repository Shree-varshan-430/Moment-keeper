// ─── Custom EventFormModal Dialog Component ───────────────────

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { X, Plus, Trash, UserPlus, Camera, Upload } from 'lucide-react';
import { MKEvent, EventCategory, PriorityLevel, NotificationTiming } from '@/types';
import toast from 'react-hot-toast';
import { hapticService } from '@/services/hapticService';
import { PremiumDatePicker } from './PremiumDatePicker';
import { CameraCaptureModal } from '@/components/people/CameraCaptureModal';

const eventSchema = zod.object({
  title: zod.string().min(2, 'Title must be at least 2 characters'),
  personId: zod.string().optional(),
  newPersonName: zod.string().optional(),
  newPersonNickname: zod.string().optional(),
  newPersonRelationship: zod.string().optional(),
  newPersonTags: zod.string().optional(),
  description: zod.string().optional(),
  date: zod.string().min(1, 'Date is required'),
  time: zod.string().optional(),
  category: zod.enum(['birthday', 'anniversary', 'wedding', 'family', 'personal', 'holiday', 'business', 'custom'] as const),
  priority: zod.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
  tagsInput: zod.string().optional(),
  notes: zod.string().optional(),
  spotifyUrl: zod.string().optional(),
  groupId: zod.string().optional(),
});

type EventFormInputs = zod.infer<typeof eventSchema>;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: MKEvent | null;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, editingEvent }) => {
  const { addEvent, editEvent, groups, persons, addPerson, uploadPersonPicture } = useEventStore();
  const { user } = useAuthStore();

  // Photo Capture/Upload State for Quick Create Person
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [selectedPhotoBlob, setSelectedPhotoBlob] = useState<Blob | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhotoBlob(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormInputs>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      category: 'birthday',
      priority: 'medium',
      newPersonRelationship: 'friend',
    },
  });

  const selectedDate = watch('date');
  const selectedPersonId = watch('personId');

  useEffect(() => {
    setPhotoPreviewUrl(null);
    setSelectedPhotoBlob(null);
    setCameraOpen(false);

    if (editingEvent) {
      const matchingPerson = persons.find(p => p.name.toLowerCase() === editingEvent.personName?.toLowerCase());
      reset({
        title: editingEvent.title,
        personId: editingEvent.personId || matchingPerson?.id || '',
        newPersonName: '',
        newPersonNickname: '',
        newPersonRelationship: 'friend',
        newPersonTags: '',
        description: editingEvent.description || '',
        date: editingEvent.date,
        time: editingEvent.time || '',
        category: editingEvent.category,
        priority: editingEvent.priority,
        tagsInput: editingEvent.tags?.join(', ') || '',
        notes: editingEvent.notes || '',
        spotifyUrl: editingEvent.spotifyUrl || '',
        groupId: editingEvent.groupId || '',
      });
    } else {
      reset({
        title: '',
        personId: '',
        newPersonName: '',
        newPersonNickname: '',
        newPersonRelationship: 'friend',
        newPersonTags: '',
        description: '',
        date: '',
        time: '',
        category: 'birthday',
        priority: 'medium',
        tagsInput: '',
        notes: '',
        spotifyUrl: '',
        groupId: '',
      });
    }
  }, [editingEvent, isOpen, reset, persons]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: EventFormInputs) => {
    if (!user) return;

    let finalPersonId = data.personId || '';
    let finalPersonName = '';

    // If "Create New Person" is selected
    if (data.personId === 'new') {
      if (!data.newPersonName?.trim()) {
        toast.error('Full Name is required for creating a new person.');
        return;
      }
      try {
        const newPersonId = await addPerson({
          userId: user.uid,
          name: data.newPersonName.trim(),
          nickname: data.newPersonNickname?.trim() || undefined,
          relationship: data.newPersonRelationship || 'friend',
          favoriteColor: '#C0C0C0',
          favoriteFood: '',
          giftIdeas: [],
          previousGifts: [],
          tags: data.newPersonTags ? data.newPersonTags.split(',').map((t) => t.trim()).filter((t) => t.length > 0) : [],
          isFavorite: false,
        }, selectedPhotoBlob);

        finalPersonId = newPersonId;
        finalPersonName = data.newPersonName.trim();
      } catch (err) {
        toast.error('Failed to create new person profile.');
        return;
      }
    } else if (finalPersonId) {
      const selectedPerson = persons.find(p => p.id === finalPersonId);
      finalPersonName = selectedPerson ? selectedPerson.name : '';
    }

    const tags = data.tagsInput
      ? data.tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    const eventPayload = {
      title: data.title,
      personId: finalPersonId || undefined,
      personName: finalPersonName || undefined,
      description: data.description || '',
      date: data.date,
      time: data.time || '',
      category: data.category as EventCategory,
      priority: (data.priority || 'medium') as PriorityLevel,
      tags: tags,
      notes: data.notes || '',
      spotifyUrl: data.spotifyUrl || '',
      isFavorite: editingEvent ? editingEvent.isFavorite : false,
      isArchived: editingEvent ? editingEvent.isArchived : false,
      isRecurring: ['birthday', 'anniversary'].includes(data.category),
      notificationTimings: ['7d', '3d', '1d', 'same_day'] as NotificationTiming[],
      userId: user.uid,
      groupId: data.groupId || undefined,
    };

    console.log("SUBMITTING EVENT PAYLOAD TO ZUSTAND:", eventPayload);

    hapticService.success();

    if (editingEvent) {
      editEvent(editingEvent.id, eventPayload).catch((err: any) => {
        console.error('Failed to save event:', err);
        hapticService.error();
        toast.error(`Failed to save event: ${err?.message || err}`);
      });
      toast.success('Event updated successfully!');
    } else {
      addEvent(eventPayload).catch((err: any) => {
        console.error('Failed to save event:', err);
        hapticService.error();
        toast.error(`Failed to save event: ${err?.message || err}`);
      });
      toast.success('Event created successfully!');
    }

    // Defer onClose slightly to allow React Hook Form to complete its submit cycle cleanly
    setTimeout(() => {
      onClose();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl glass p-6 sm:p-8 border border-mk-glass-border shadow-silver my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <h2 className="font-display text-2xl font-bold tracking-tight text-mk-white mb-6">
          {editingEvent ? 'Edit Event Details' : 'Create New Reminder'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                {...register('title')}
                className="input-premium"
                placeholder="e.g. John's Birthday"
              />
              {errors.title && (
                <span className="text-xs text-destructive mt-1 block">{errors.title.message}</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Link to Person Profile
              </label>
              <select {...register('personId')} className="input-premium bg-mk-dark text-mk-white">
                <option value="">🔒 No Person Linked / Personal Event</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    👤 {p.nickname ? `${p.nickname} (${p.name})` : p.name}
                  </option>
                ))}
                <option value="new">➕ Create New Person...</option>
              </select>
            </div>
          </div>

          {/* Quick Create Person Sub-form */}
          {selectedPersonId === 'new' && (
            <div className="rounded-2xl border border-mk-glass-border bg-white/[0.02] p-5 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-mk-white uppercase tracking-wider mb-2 border-b border-mk-glass-border/40 pb-2">
                <UserPlus size={14} className="text-mk-silver" />
                <span>Quick Create Person Profile</span>
              </div>

              {/* Photo Upload / Camera Capture Inline */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-4 rounded-xl border border-mk-glass-border/30 mb-2">
                <div className="relative shrink-0">
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt="Preview"
                      className="h-14 w-14 rounded-full object-cover border border-mk-glass-border shadow-silver-sm"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-white/5 border border-mk-glass-border text-mk-silver flex items-center justify-center font-bold text-[9px] uppercase text-center leading-none">
                      No Photo
                    </div>
                  )}
                  {photoPreviewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreviewUrl(null);
                        setSelectedPhotoBlob(null);
                      }}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 border border-mk-black text-[8px]"
                    >
                      <X size={8} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mk-silver">
                    Profile Picture
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="rounded-lg bg-white/5 hover:bg-white/10 border border-mk-glass-border px-3 py-1.5 text-xs font-semibold text-mk-white flex items-center gap-1.5 transition-all"
                    >
                      <Camera size={12} />
                      <span>Take Photo</span>
                    </button>

                    <label className="rounded-lg bg-white/5 hover:bg-white/10 border border-mk-glass-border px-3 py-1.5 text-xs font-semibold text-mk-white flex items-center gap-1.5 cursor-pointer transition-all">
                      <Upload size={12} />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('newPersonName')}
                    className="input-premium"
                    placeholder="e.g. Jonathan Smith"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('newPersonNickname')}
                    className="input-premium"
                    placeholder="e.g. Johnny"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Relationship
                  </label>
                  <select {...register('newPersonRelationship')} className="input-premium bg-mk-dark text-mk-white">
                    <option value="friend">Friend 👥</option>
                    <option value="family">Family 👨‍👩‍👧</option>
                    <option value="spouse">Spouse 💍</option>
                    <option value="partner">Partner 💑</option>
                    <option value="colleague">Colleague 💼</option>
                    <option value="relative">Relative 👪</option>
                    <option value="client">Client 🏢</option>
                    <option value="other">Other 👤</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    {...register('newPersonTags')}
                    className="input-premium"
                    placeholder="College, Cousin, VIP"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Category
              </label>
              <select {...register('category')} className="input-premium bg-mk-dark text-mk-white">
                <option value="birthday">🎂 Birthday</option>
                <option value="anniversary">💍 Anniversary</option>
                <option value="wedding">💒 Wedding</option>
                <option value="family">👨‍👩‍👧 Family Event</option>
                <option value="personal">⭐ Personal Event</option>
                <option value="holiday">🏖️ Holiday</option>
                <option value="business">💼 Business Event</option>
                <option value="custom">📅 Custom Reminder</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Share to Group
              </label>
              <select {...register('groupId')} className="input-premium bg-mk-dark text-mk-white">
                <option value="">🔒 Personal (Only Me)</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    👥 {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Date *
              </label>
              <PremiumDatePicker
                value={selectedDate || ''}
                onChange={(dateStr) => setValue('date', dateStr, { shouldValidate: true })}
              />
              {errors.date && (
                <span className="text-xs text-destructive mt-1 block">{errors.date.message}</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Time (Optional)
              </label>
              <input
                type="time"
                {...register('time')}
                className="input-premium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
              Brief Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="input-premium resize-none"
              placeholder="e.g. Planning a surprise party at the beach club..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                {...register('tagsInput')}
                className="input-premium"
                placeholder="gift, party, surprise"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                Gift / Notes Reminder
              </label>
              <input
                type="text"
                {...register('notes')}
                className="input-premium"
                placeholder="Buy chocolates, fav brand: Lindt"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.892-1.026-.33.076-.66-.135-.736-.465-.075-.33.136-.66.465-.736 3.854-.88 7.15-.502 9.816 1.13.295.18.387.563.207.86zm1.224-2.723c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.082-1.182-.413.125-.85-.107-.975-.52-.125-.413.107-.85.52-.975 3.678-1.117 8.243-.574 11.35 1.34.368.225.488.707.262 1.076zm.106-2.833C14.39 8.71 8.57 8.52 5.176 9.553c-.53.16-1.09-.14-1.25-.67-.16-.53.14-1.09.67-1.25 3.9-1.185 10.33-.966 14.35 1.42.477.283.633.9.35 1.378-.282.478-.9.634-1.378.352z"/>
              </svg>
              <span>Sync Spotify Alarm (Song Link / URI)</span>
            </label>
            <input
              type="text"
              {...register('spotifyUrl')}
              className="input-premium"
              placeholder="e.g. https://open.spotify.com/track/4PTG3Z6ehGkBF3zI7YQ5sI"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-mk-glass-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-mk-glass-border bg-white/5 py-3 text-sm font-semibold hover:bg-white/10 transition-all text-mk-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-premium py-3 text-sm font-bold"
            >
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(blob) => {
          setSelectedPhotoBlob(blob);
          setPhotoPreviewUrl(URL.createObjectURL(blob));
        }}
      />
    </div>
  );
};

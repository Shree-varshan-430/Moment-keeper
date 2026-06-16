// ─── Custom EventFormModal Dialog Component ───────────────────

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { X, Plus, Trash, UserPlus, Camera, Upload, Dices } from 'lucide-react';
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
  const selectedCategory = watch('category');

  const handleShuffleDescription = () => {
    const list = CATEGORY_SUGGESTIONS[selectedCategory || 'custom'] || CATEGORY_SUGGESTIONS.custom;
    const randomIndex = Math.floor(Math.random() * list.length);
    setValue('description', list[randomIndex].description);
    hapticService.lightImpact();
  };

  const handleShuffleNotes = () => {
    const list = CATEGORY_SUGGESTIONS[selectedCategory || 'custom'] || CATEGORY_SUGGESTIONS.custom;
    const randomIndex = Math.floor(Math.random() * list.length);
    setValue('notes', list[randomIndex].notes);
    hapticService.lightImpact();
  };

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver">
                Brief Description
              </label>
              <button
                type="button"
                onClick={handleShuffleDescription}
                className="text-mk-silver hover:text-mk-white transition-all flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider hover:scale-105 border border-mk-glass-border rounded-lg px-2 py-0.5 bg-white/5 active:scale-95 cursor-pointer"
                title="Roll Suggestion"
              >
                <Dices size={10} className="text-mk-silver group-hover:text-mk-white" />
                <span>Suggest 🎲</span>
              </button>
            </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver">
                  Gift / Notes Reminder
                </label>
                <button
                  type="button"
                  onClick={handleShuffleNotes}
                  className="text-mk-silver hover:text-mk-white transition-all flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider hover:scale-105 border border-mk-glass-border rounded-lg px-2 py-0.5 bg-white/5 active:scale-95 cursor-pointer"
                  title="Roll Suggestion"
                >
                  <Dices size={10} className="text-mk-silver group-hover:text-mk-white" />
                  <span>Suggest 🎲</span>
                </button>
              </div>
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

const CATEGORY_SUGGESTIONS: Record<
  EventCategory,
  Array<{ description: string; notes: string }>
> = {
  birthday: [
    { description: "Planning a surprise birthday party at their favorite restaurant with close friends.", notes: "Order custom red velvet cake from local bakery 3 days in advance." },
    { description: "Intimate birthday dinner at home with homemade cake and decorations.", notes: "Buy leather wallet or cardholder (favorite color: dark brown)." },
    { description: "Weekend getaway trip to celebrate their special day in nature.", notes: "Gift idea: Premium noise-cancelling headphones." },
    { description: "Organizing a theme party (retro/favorite movie) with custom playlist.", notes: "Prepare handmade birthday card with letters from friends." },
    { description: "Sending a surprise gift delivery to their office in the morning.", notes: "Order fresh bouquet of lilies and card online." },
    { description: "Quiet breakfast in bed followed by a relaxing spa day.", notes: "Buy voucher for a full body massage at local wellness spa." },
    { description: "Birthday picnic in the park with board games and acoustic guitar.", notes: "Purchase gourmet chocolate box and a bottle of fine red wine." },
    { description: "Milestone celebration event renting a local venue for family reunion.", notes: "Gift idea: Instax mini camera with extra film packs." },
    { description: "Hosting a movie night with their favorite snacks and desserts.", notes: "Rent a high-quality projector for the backyard movie night setup." },
    { description: "Surprising them with tickets to a concert or sporting event they love.", notes: "Buy concert tickets on ticket portal before they sell out." }
  ],
  anniversary: [
    { description: "Romantic candlelit dinner at the restaurant where we had our first date.", notes: "Book reservation at the restaurant 2 weeks in advance." },
    { description: "Recreating our first vacation destination for a weekend road trip.", notes: "Order custom engraved silver jewelry or ring." },
    { description: "Exchanging custom anniversary gifts and reading letters to each other.", notes: "Gift idea: Smart digital photo frame pre-loaded with memories." },
    { description: "Booking a couples cooking class to learn making gourmet pasta.", notes: "Buy a bottle of vintage champagne from local winery." },
    { description: "Quiet evening watching our wedding/relationship videos with champagne.", notes: "Get custom illustration portrait framed of us." },
    { description: "Outdoor photoshoot session at the botanical garden at sunset.", notes: "Hire professional local photographer for 1-hour session." },
    { description: "Surprise sunset cruise with live violin music on the lake.", notes: "Book tickets for the evening sunset boat cruise." },
    { description: "Exchanging handmade memory scrapbook of the past year.", notes: "Collect photos from past trips and print them for scrapbook." },
    { description: "Stargazing night with cozy blankets and hot chocolate on the balcony.", notes: "Buy telescope or stargazing sky map book." },
    { description: "Attending a theater play followed by a late-night dessert date.", notes: "Book front row tickets for the drama play." }
  ],
  wedding: [
    { description: "Attending the wedding ceremony followed by a grand reception dinner.", notes: "Dress code: Black-tie formal. Get suit/dress dry-cleaned." },
    { description: "Sending a wedding gift registry item with a heartfelt card.", notes: "Buy custom ceramic dining set from the couple's gift registry." },
    { description: "Helping the bride/groom prepare for the big day morning setup.", notes: "Coordinate timing with bridesmaids/groomsmen group chat." },
    { description: "Joining the pre-wedding cocktail party and rehearsal dinner.", notes: "Prepare RSVP card and mail it back before the deadline." },
    { description: "Organizing a bridal shower or bachelor party celebration.", notes: "Book accommodation at the wedding resort 1 month early." },
    { description: "Quiet wedding anniversary celebration recalling the vows.", notes: "Buy card and place cash gift in a premium silver envelope." },
    { description: "Writing a speech/toast to present at the wedding reception.", notes: "Rehearse speech notes in front of mirror for confidence." },
    { description: "Gifting a custom hand-painted portrait of the couple.", notes: "Order the hand-painted portrait from local artist." },
    { description: "Hosting a post-wedding brunch for out-of-town guests.", notes: "Confirm guest count and catering menu with coordinator." },
    { description: "Attending the destination wedding weekend beach party.", notes: "Prepare travel bags, sunglasses, and beachwear." }
  ],
  family: [
    { description: "Hosting a large family barbecue in the backyard this Sunday.", notes: "Buy fresh burgers, sausages, and premium charcoal for BBQ." },
    { description: "Weekend family reunion at a cozy mountain cabin.", notes: "Book the mountain cabin rental 2 months in advance." },
    { description: "Organizing a family game night with classics like Monopoly and Taboo.", notes: "Buy new board game expansion set to surprise the kids." },
    { description: "Celebrating Mother's/Father's Day with a special family lunch.", notes: "Order custom personalized family calendar as a gift." },
    { description: "Annual family photo session at the local park in autumn colors.", notes: "Coordinate dress code colors for the photo session." },
    { description: "Visiting grandparents for a weekend brunch and sharing old stories.", notes: "Buy a box of premium herbal tea and soft blanket for grandparents." },
    { description: "Family movie marathon day with homemade popcorn and snacks.", notes: "Get Netflix subscription or buy classic family movie DVD." },
    { description: "Planning a surprise retirement party for parents with relatives.", notes: "Prepare secret slide show presentation of old family photos." },
    { description: "Baking traditional holiday cookies together in the kitchen.", notes: "Buy baking ingredients: flour, chocolate chips, vanilla." },
    { description: "One-day family road trip to visit a scenic lake or nature park.", notes: "Clean the family car and prepare playlist of classic road songs." }
  ],
  personal: [
    { description: "Setting aside a day for deep self-care, meditation, and reading.", notes: "Buy a new hardcover leather journal and premium gel pen." },
    { description: "Tracking progress of personal fitness goals and running a 5k.", notes: "Charge fitness smartwatch and prepare running shoes." },
    { description: "Beginning a new online skill course on programming/art.", notes: "Dedicate 1 hour every evening for course video lectures." },
    { description: "Decluttering and organizing the bedroom and desk workspace.", notes: "Prepare storage boxes and labels for organization." },
    { description: "Writing in my personal journal and setting goals for the next month.", notes: "Review personal goals spreadsheet on Google Sheets." },
    { description: "Going on a solo museum visit and enjoying a quiet coffee.", notes: "Buy museum ticket online to skip the morning queue." },
    { description: "Creating a budget plan and reviewing monthly saving progress.", notes: "Update expense tracking app with latest receipts." },
    { description: "Spending the evening painting or practicing a musical instrument.", notes: "Buy watercolor paint set and high-quality art pad." },
    { description: "Waking up early to watch the sunrise at the scenic viewpoint.", notes: "Set alarm for 5:00 AM and check weather report tonight." },
    { description: "Trying out a brand new complex recipe for a gourmet dinner.", notes: "Buy fresh herbs, garlic, and high-quality olive oil." }
  ],
  holiday: [
    { description: "Planning a 7-day tropical beach vacation to relax under palm trees.", notes: "Renew passport and confirm hotel booking confirmation." },
    { description: "Exploring a historic European city's culture and museums.", notes: "Book city tour guide and museum tickets in advance." },
    { description: "Cozy winter ski trip in the mountains with snowboarding.", notes: "Rent ski gear and buy high-quality winter thermal clothes." },
    { description: "Long weekend camping trip in the national forest with hiking.", notes: "Prepare camping tent, sleeping bags, and insect spray." },
    { description: "Celebrating the national holiday with fireworks and local parade.", notes: "Check local city event calendar for parade start times." },
    { description: "Attending a vibrant summer music festival with friends.", notes: "Buy festival passes and secure festival earplugs." },
    { description: "Relaxing staycation at a local luxury hotel with pool access.", notes: "Pack swimwear, sunscreen, and polarized sunglasses." },
    { description: "Road trip along the scenic coastal highway with scenic stops.", notes: "Download offline navigation maps on Google Maps." },
    { description: "Exploring local historic sites and castles in the countryside.", notes: "Charge camera batteries and prepare extra memory cards." },
    { description: "Visiting a famous theme park for rollercoasters and shows.", notes: "Buy fast-pass theme park tickets to skip the lines." }
  ],
  business: [
    { description: "Attending a major industry networking conference in the city.", notes: "Print 50 copies of updated professional business cards." },
    { description: "Preparing presentation slides for the quarterly sales pitch.", notes: "Rehearse presentation timing to fit within 15 minutes." },
    { description: "Hosting an elegant dinner with key business clients.", notes: "Book reservation at the quiet business lounge restaurant." },
    { description: "Reviewing and signing the partnership contract details.", notes: "Read contract legal terms carefully with legal counsel." },
    { description: "Organizing a team-building lunch or activity for employees.", notes: "Order catering service or book escape room group slots." },
    { description: "Conducting annual performance reviews with team members.", notes: "Prepare performance review feedback template sheets." },
    { description: "Launching the new product version with a webinar event.", notes: "Test webinar mic, camera, and screen share connection." },
    { description: "Setting up a professional headshot photo session.", notes: "Iron formal suit jacket and clean dress shoes." },
    { description: "Brainstorming session for the next marketing campaign.", notes: "Bring whiteboard markers and post-it notes." },
    { description: "Attending a professional skill-building workshop.", notes: "Print workshop handouts and prepare notebook." }
  ],
  custom: [
    { description: "Annual dental health checkup and teeth cleaning visit.", notes: "Bring medical insurance card and avoid coffee before visit." },
    { description: "Renewing vehicle insurance and scheduling car maintenance.", notes: "Collect car registration documents and check engine oil." },
    { description: "Hosting a casual housewarming party for neighbors.", notes: "Buy paper plates, disposable cups, and party snacks." },
    { description: "Attending a local community volunteer cleanup event.", notes: "Pack gardening gloves, heavy boots, and trash bags." },
    { description: "Seasonal garden planting of fresh flowers and herbs.", notes: "Buy organic soil, tomato seeds, and flower pots." },
    { description: "Scheduling a home maintenance service (HVAC/plumbing).", notes: "Clean up the basement area before the technicians arrive." },
    { description: "Visiting the local pet shelter to donate pet food.", notes: "Buy 10 bags of dog food and cat toys for donation." },
    { description: "Hosting a book club discussion on the latest novel.", notes: "Prepare cheese platter, wine, and discussion questions." },
    { description: "Organizing a neighborhood garage sale event.", notes: "Label pricing on old books, clothes, and electronics." },
    { description: "Visiting a local gallery art exhibition opening night.", notes: "Dress code: Smart casual. Confirm gallery entry ticket." }
  ]
};

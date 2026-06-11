// ─── People, Notes & Group Sharing Page Component ───────────────

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventStore } from '@/store/eventStore';
import { useAuthStore } from '@/store/authStore';
import { Plus, User, Trash2, Edit2, Tag, Gift, Award, Star, Download, Mail, X, Camera, ChevronRight, Check } from 'lucide-react';
import { Person, Group, RelationshipType, MKEvent } from '@/types';
import toast from 'react-hot-toast';
import { ContactImportModal } from '@/components/contacts/ContactImportModal';
import { CameraCaptureModal } from '@/components/people/CameraCaptureModal';
import { hapticService } from '@/services/hapticService';
import { formatCountdown, formatDateShort, getDaysUntilEvent } from '@/lib/utils';

export const PeoplePage: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const {
    persons,
    groups,
    events,
    memberProfiles,
    fetchEventsAndPersons,
    addPerson,
    editPerson,
    removePerson,
    createGroup,
    inviteMemberToGroup,
    leaveGroup
  } = useEventStore();

  const [activeTab, setActiveTab] = useState<'directory' | 'groups'>('directory');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);

  // Form Fields State for Person
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType | string>('friend');
  const [color, setColor] = useState('');
  const [food, setFood] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [selectedPhotoBlob, setSelectedPhotoBlob] = useState<Blob | null>(null);

  // Form Fields State for Group Creation
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<Group['type']>('family');
  const [groupDesc, setGroupDesc] = useState('');

  // Invite Member State
  const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  // Detail View State
  const [detailTab, setDetailTab] = useState<'timeline' | 'gifts' | 'details'>('timeline');
  const [newGiftIdea, setNewGiftIdea] = useState('');
  const [newPrevGift, setNewPrevGift] = useState('');

  useEffect(() => {
    if (user) {
      const unsub = fetchEventsAndPersons(user.uid);
      return () => {
        unsub.then((cleanup) => cleanup());
      };
    }
  }, [user, fetchEventsAndPersons]);

  // Keep viewingPerson in sync with react-time store changes
  useEffect(() => {
    if (viewingPerson) {
      const updated = persons.find(p => p.id === viewingPerson.id);
      if (updated) {
        setViewingPerson(updated);
      }
    }
  }, [persons, viewingPerson?.id]);

  // Listen for navigation state with a pre-selected person ID
  useEffect(() => {
    if (location.state?.selectedPersonId) {
      const p = persons.find(x => x.id === location.state.selectedPersonId);
      if (p) {
        setViewingPerson(p);
        setDetailTab('timeline');
      }
    }
  }, [location.state?.selectedPersonId, persons]);

  // Disable body scroll when any modal or details drawer is open
  const isAnyModalOrDrawerOpen = modalOpen || importOpen || cameraOpen || groupModalOpen || !!viewingPerson;
  useEffect(() => {
    if (isAnyModalOrDrawerOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isAnyModalOrDrawerOpen]);

  // ─── Person CRUD Handlers ──────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingPerson(null);
    setName('');
    setNickname('');
    setGender('');
    setRelationship('friend');
    setTagsInput('');
    setColor('');
    setFood('');
    setGiftInput('');
    setNotes('');
    setPhotoUrl('');
    setPhotoPreviewUrl(null);
    setSelectedPhotoBlob(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Person) => {
    setEditingPerson(p);
    setName(p.name);
    setNickname(p.nickname || '');
    setGender(p.gender || '');
    setRelationship(p.relationship || 'friend');
    setTagsInput(p.tags?.join(', ') || '');
    setColor(p.favoriteColor || '');
    setFood(p.favoriteFood || '');
    setGiftInput(p.giftIdeas?.join(', ') || '');
    setNotes(p.notes || '');
    setPhotoUrl(p.photoUrl || '');
    setPhotoPreviewUrl(p.photoUrl || null);
    setSelectedPhotoBlob(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast.error('Name field is required');
      return;
    }

    const gifts = giftInput
      ? giftInput.split(',').map((g) => g.trim()).filter((g) => g.length > 0)
      : [];

    const tags = tagsInput
      ? tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : [];

    let finalPhotoUrl = photoUrl;

    try {
      let personId = editingPerson?.id;

      const payload: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user.uid,
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        gender: gender || undefined,
        relationship: relationship || 'friend',
        photoUrl: finalPhotoUrl || undefined,
        favoriteColor: color || undefined,
        favoriteFood: food || undefined,
        giftIdeas: gifts,
        previousGifts: editingPerson ? editingPerson.previousGifts : [],
        notes: notes || undefined,
        tags: tags,
        isFavorite: editingPerson ? editingPerson.isFavorite : false,
      };

      if (editingPerson) {
        await editPerson(editingPerson.id, payload, selectedPhotoBlob);
      } else {
        personId = await addPerson(payload, selectedPhotoBlob);
      }

      toast.success(editingPerson ? 'Profile updated successfully!' : 'Profile created successfully!');
      setModalOpen(false);
    } catch (err) {
      toast.error('Failed to save profile.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this person profile? All saved memories for them will be removed.')) {
      try {
        await removePerson(id);
        toast.success('Profile deleted.');
        if (viewingPerson?.id === id) {
          setViewingPerson(null);
        }
      } catch (err) {
        toast.error('Failed to delete profile.');
      }
    }
  };

  const handleToggleFavoritePerson = async (p: Person, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      hapticService.lightImpact();
      await editPerson(p.id, { isFavorite: !p.isFavorite });
      toast.success(p.isFavorite ? 'Removed from Favorites' : 'Marked as Favorite');
    } catch (err) {
      toast.error('Failed to toggle favorite status.');
    }
  };

  // ─── Gift Management ──────────────────────────────────────────────
  const handleAddGiftIdea = async () => {
    if (!viewingPerson || !newGiftIdea.trim()) return;
    const updatedIdeas = [...(viewingPerson.giftIdeas || []), newGiftIdea.trim()];
    try {
      await editPerson(viewingPerson.id, { giftIdeas: updatedIdeas });
      setNewGiftIdea('');
      toast.success('Gift idea added!');
    } catch (err) {
      toast.error('Failed to update ideas.');
    }
  };

  const handlePurchaseGift = async (idea: string) => {
    if (!viewingPerson) return;
    const updatedIdeas = (viewingPerson.giftIdeas || []).filter((g) => g !== idea);
    const updatedPrevious = [...(viewingPerson.previousGifts || []), idea];
    try {
      await editPerson(viewingPerson.id, { giftIdeas: updatedIdeas, previousGifts: updatedPrevious });
      toast.success('Marked as purchased!');
    } catch (err) {
      toast.error('Failed to update gifts.');
    }
  };

  const handleAddPrevGift = async () => {
    if (!viewingPerson || !newPrevGift.trim()) return;
    const updatedPrevious = [...(viewingPerson.previousGifts || []), newPrevGift.trim()];
    try {
      await editPerson(viewingPerson.id, { previousGifts: updatedPrevious });
      setNewPrevGift('');
      toast.success('Gift added to history!');
    } catch (err) {
      toast.error('Failed to update history.');
    }
  };

  // ─── Group Handlers ────────────────────────────────────────────────
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      await createGroup(groupName, groupType, groupDesc);
      toast.success('Group created successfully!');
      setGroupModalOpen(false);
      setGroupName('');
      setGroupDesc('');
    } catch (err: any) {
      toast.error(`Failed to create group: ${err.message || err}`);
    }
  };

  const handleInviteMember = async (groupId: string) => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      const memberName = await inviteMemberToGroup(groupId, inviteEmail);
      toast.success(`Successfully invited ${memberName} to the group!`);
      setInviteEmail('');
      setInvitingGroupId(null);
    } catch (err: any) {
      toast.error(`Invitation failed: ${err.message || err}`);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (window.confirm('Are you sure you want to leave this group? You will lose access to all shared calendar events.')) {
      try {
        await leaveGroup(groupId);
        toast.success('Successfully left the group.');
      } catch (err: any) {
        toast.error(`Failed to leave group: ${err.message || err}`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title text-3xl">Memory & Sharing Directory</h1>
          <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
            Manage profiles and create groups for shared events
          </p>
        </div>

        {activeTab === 'directory' ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setImportOpen(true)}
              className="rounded-xl border border-mk-glass-border bg-white/5 px-4 py-2.5 text-xs font-semibold hover:bg-white/10 hover:border-mk-silver/20 transition-all text-mk-white flex items-center gap-2 shadow-glass hover:shadow-silver-sm"
            >
              <Download size={14} />
              <span>Import Contacts</span>
            </button>
            
            <button onClick={handleOpenAdd} className="btn-premium flex items-center justify-center gap-2">
              <Plus size={18} />
              <span>Add Profile</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setGroupModalOpen(true)}
            className="btn-premium flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Create Group</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mk-glass-border/30 bg-mk-black/10 rounded-xl overflow-hidden p-0.5 max-w-sm">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === 'directory'
              ? 'bg-gradient-silver text-mk-black font-extrabold shadow-silver-sm'
              : 'text-mk-silver hover:text-mk-white hover:bg-white/5'
          }`}
        >
          Memory Directory
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg ${
            activeTab === 'groups'
              ? 'bg-gradient-silver text-mk-black font-extrabold shadow-silver-sm'
              : 'text-mk-silver hover:text-mk-white hover:bg-white/5'
          }`}
        >
          Sharing Groups
        </button>
      </div>

      {/* Directory Tab Content */}
      {activeTab === 'directory' ? (
        persons.length === 0 ? (
          <div className="rounded-2xl p-12 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-5xl mb-4 select-none">👥</span>
            <h3 className="text-lg font-bold text-mk-white">No memory profiles yet</h3>
            <p className="text-xs text-mk-silver max-w-sm mt-1.5 leading-relaxed">
              Create profiles to track gift ideas, favorite colors, favorite foods, and personal notes for friends & family.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {persons.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  hapticService.lightImpact();
                  setViewingPerson(p);
                  setDetailTab('timeline');
                }}
                className="rounded-2xl p-6 glass border border-mk-glass-border flex flex-col justify-between shadow-glass hover:shadow-silver hover:border-mk-silver/20 transition-all duration-300 relative group overflow-hidden cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          className="h-12 w-12 rounded-full object-cover border border-mk-glass-border shadow-silver-sm shrink-0"
                          alt={p.name}
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-mk-glass-border text-mk-silver text-sm font-bold shrink-0 uppercase">
                          {((p.nickname || p.name).substring(0, 2))}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-mk-white leading-tight flex items-center gap-1.5">
                          {p.nickname ? `${p.nickname}` : p.name}
                        </h3>
                        {p.nickname && (
                          <span className="text-xs text-mk-silver leading-none block">{p.name}</span>
                        )}
                        <span className="inline-block text-[9px] font-bold tracking-wider uppercase bg-white/5 border border-mk-glass-border/40 px-2 py-0.5 rounded mt-1.5 text-mk-silver">
                          {p.relationship}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavoritePerson(p, e)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        p.isFavorite
                          ? 'bg-mk-accent/15 border-mk-accent/30 text-mk-accent'
                          : 'border-mk-glass-border bg-white/5 text-mk-silver hover:text-mk-white'
                      }`}
                      title={p.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                    >
                      <Star size={14} className={p.isFavorite ? 'fill-current' : ''} />
                    </button>
                  </div>

                  <div className="space-y-2 mt-4 border-t border-mk-glass-border/60 pt-4">
                    {p.gender && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-mk-silver">Gender:</span>
                        <span className="font-semibold text-mk-white capitalize">{p.gender}</span>
                      </div>
                    )}

                    {p.favoriteColor && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-mk-silver">Fav Color:</span>
                        <span className="font-semibold text-mk-white flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 rounded-full border border-white/20 inline-block"
                            style={{ backgroundColor: p.favoriteColor }}
                          ></span>
                          {p.favoriteColor}
                        </span>
                      </div>
                    )}

                    {p.favoriteFood && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-mk-silver">Fav Food:</span>
                        <span className="font-semibold text-mk-white">{p.favoriteFood}</span>
                      </div>
                    )}

                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="bg-white/5 border border-mk-glass-border text-mk-silver px-2 py-0.5 rounded-lg text-[9px]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {p.notes && (
                      <div className="text-xs pt-1.5">
                        <p className="text-mk-silver/80 italic mt-0.5 line-clamp-2">{p.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3.5 mt-6 border-t border-mk-glass-border pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(p);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-mk-glass-border bg-white/5 py-2 text-xs font-bold text-mk-white hover:bg-white/10 transition-all"
                  >
                    <Edit2 size={12} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="p-2 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Groups Tab Content */
        groups.length === 0 ? (
          <div className="rounded-2xl p-12 glass border border-mk-glass-border text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="text-5xl mb-4 select-none">👥</span>
            <h3 className="text-lg font-bold text-mk-white">No sharing groups yet</h3>
            <p className="text-xs text-mk-silver max-w-sm mt-1.5 leading-relaxed">
              Create a group for Family, Friends, or Office to share calendar reminders and notifications in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {groups.map((group) => {
              const isOwner = group.ownerId === user?.uid;
              const groupTypeLabels = {
                family: 'Family 👨‍👩‍👧',
                friends: 'Friends 👥',
                office: 'Office 💼',
                custom: 'Custom 📅'
              };

              return (
                <div
                  key={group.id}
                  className="rounded-2xl p-6 glass border border-mk-glass-border flex flex-col justify-between shadow-glass hover:shadow-silver hover:border-mk-silver/20 transition-all duration-300 relative group overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h3 className="text-lg font-bold text-mk-white leading-none">
                        {group.name}
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-full border border-mk-glass-border text-mk-silver">
                        {groupTypeLabels[group.type]}
                      </span>
                    </div>
                    
                    {group.description && (
                      <p className="text-xs text-mk-silver leading-relaxed mb-4">
                        {group.description}
                      </p>
                    )}

                    {/* Group Members List */}
                    <div className="space-y-2 border-t border-mk-glass-border/60 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mk-silver block mb-2">
                        Group Members ({group.memberIds.length})
                      </span>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {group.memberIds.map(memberId => {
                          const memberProfile = memberProfiles[memberId];
                          const isMemberOwner = group.ownerId === memberId;
                          
                          return (
                            <div key={memberId} className="flex items-center justify-between gap-3 bg-white/[0.01] border border-mk-glass-border/40 p-2 rounded-xl text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                {memberProfile?.photoURL ? (
                                  <img src={memberProfile.photoURL} className="h-6 w-6 rounded-full object-cover shrink-0" alt="" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-white/5 border border-mk-glass-border flex items-center justify-center text-[10px] font-bold text-mk-silver shrink-0">
                                    {(memberProfile?.displayName || 'U').substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-semibold text-mk-white block truncate">
                                    {memberProfile?.displayName || 'Loading...'}
                                  </span>
                                  <span className="text-[9px] text-mk-silver block truncate">
                                    {memberProfile?.email || 'Checking...'}
                                  </span>
                                </div>
                              </div>
                              {isMemberOwner && (
                                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-mk-accent/15 text-mk-accent border border-mk-accent/20 shrink-0">
                                  Owner
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Invite Section */}
                    <div className="mt-4 border-t border-mk-glass-border/60 pt-4">
                      {invitingGroupId === group.id ? (
                        <div className="space-y-2 animate-fade-in">
                          <input
                             type="email"
                             value={inviteEmail}
                             onChange={(e) => setInviteEmail(e.target.value)}
                             placeholder="member@example.com"
                             className="input-premium py-2 text-xs"
                           />
                           <div className="flex gap-2">
                             <button
                               onClick={() => setInvitingGroupId(null)}
                               className="flex-1 py-1.5 border border-mk-glass-border rounded-lg text-[10px] text-mk-white hover:bg-white/5"
                             >
                               Cancel
                             </button>
                             <button
                               onClick={() => handleInviteMember(group.id)}
                               className="flex-1 py-1.5 btn-premium font-bold text-[10px] text-center"
                             >
                               Send Invite
                             </button>
                           </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setInviteEmail('');
                            setInvitingGroupId(group.id);
                          }}
                          className="w-full py-2 border border-dashed border-mk-glass-border rounded-xl text-xs text-mk-silver hover:text-mk-white hover:bg-white/[0.02] flex items-center justify-center gap-1.5"
                        >
                          <Mail size={12} />
                          <span>Invite Group Member</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Leave Group Footer Action */}
                  <div className="mt-6 border-t border-mk-glass-border pt-4">
                    <button
                      onClick={() => handleLeaveGroup(group.id)}
                      className="w-full py-2 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Leave Group</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* dialog overlay form for Person profile details creation/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl glass p-6 sm:p-8 border border-mk-glass-border shadow-silver my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl font-bold tracking-tight text-mk-white mb-6">
              {editingPerson ? 'Modify Profile' : 'New Memory Profile'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Photo selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border border-mk-glass-border bg-white/5 flex items-center justify-center relative shrink-0">
                    {photoPreviewUrl ? (
                      <img src={photoPreviewUrl} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <User size={24} className="text-mk-silver" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="rounded-xl border border-mk-glass-border bg-white/5 px-3 py-2 text-xs font-bold text-mk-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                    >
                      <Camera size={14} />
                      <span>Camera</span>
                    </button>
                    <label className="rounded-xl border border-mk-glass-border bg-white/5 px-3 py-2 text-xs font-bold text-mk-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer">
                      <span>Gallery</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedPhotoBlob(file);
                            setPhotoPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-premium"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="input-premium"
                    placeholder="e.g. Jenny"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="input-premium bg-mk-dark text-mk-white"
                  >
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
                    Gender (Optional)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="input-premium bg-mk-dark text-mk-white"
                  >
                    <option value="">Unspecified</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-Binary</option>
                    <option value="other">Other / Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Favorite Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="input-premium"
                    placeholder="e.g. #3b82f6 or blue"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Favorite Food
                  </label>
                  <input
                    type="text"
                    value={food}
                    onChange={(e) => setFood(e.target.value)}
                    className="input-premium"
                    placeholder="e.g. Sushi, Pizza"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                  Gift Ideas (Comma separated)
                </label>
                <input
                  type="text"
                  value={giftInput}
                  onChange={(e) => setGiftInput(e.target.value)}
                  className="input-premium"
                  placeholder="e.g. Silk Scarf, Leather Bag, Chocolates"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                  Custom Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="input-premium"
                  placeholder="Best Friend, School, VIP"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                  General Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input-premium resize-none"
                  placeholder="e.g. Likes reading thrillers, allergic to peanuts..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-mk-glass-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-mk-glass-border bg-white/5 py-3 text-sm font-semibold hover:bg-white/10 transition-all text-mk-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-premium py-3 text-sm font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Viewing Person Detailed Profile Modal / Drawer ─── */}
      {viewingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl glass p-6 sm:p-8 border border-mk-glass-border shadow-silver my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingPerson(null)}
              className="absolute top-4 right-4 text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            {/* Profile Overview Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-mk-glass-border/40">
              {viewingPerson.photoUrl ? (
                <img
                  src={viewingPerson.photoUrl}
                  className="h-24 w-24 rounded-full object-cover border-2 border-mk-glass-border shadow-silver shrink-0"
                  alt={viewingPerson.name}
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white/5 border-2 border-mk-glass-border flex items-center justify-center text-mk-silver text-3xl font-bold shrink-0 uppercase">
                  {((viewingPerson.nickname || viewingPerson.name).substring(0, 2))}
                </div>
              )}
              
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-2xl font-bold text-mk-white font-display">
                    {viewingPerson.nickname || viewingPerson.name}
                  </h2>
                  <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded bg-mk-accent/20 text-mk-accent border border-mk-accent/20 max-w-fit mx-auto sm:mx-0">
                    {viewingPerson.relationship}
                  </span>
                </div>
                {viewingPerson.nickname && (
                  <p className="text-sm text-mk-silver mt-1">{viewingPerson.name}</p>
                )}
                {viewingPerson.gender && (
                  <p className="text-xs text-mk-silver/80 mt-1 capitalize">Gender: {viewingPerson.gender}</p>
                )}
                {viewingPerson.tags && viewingPerson.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center sm:justify-start mt-3">
                    {viewingPerson.tags.map((t) => (
                      <span key={t} className="text-[9px] font-bold bg-white/5 border border-mk-glass-border text-mk-silver px-2 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabbed view */}
            <div className="flex border-b border-mk-glass-border/30 bg-mk-black/10 rounded-xl overflow-hidden p-0.5 my-6 max-w-md">
              {[
                { id: 'timeline', label: 'Timeline & Memories' },
                { id: 'gifts', label: 'Gift History' },
                { id: 'details', label: 'Details & Notes' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id as any)}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-lg ${
                    detailTab === tab.id
                      ? 'bg-gradient-silver text-mk-black font-extrabold shadow-silver-sm'
                      : 'text-mk-silver hover:text-mk-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-4 min-h-[250px]">
              {detailTab === 'timeline' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-mk-white border-b border-mk-glass-border/40 pb-2">
                    Memory Timeline History
                  </h3>
                  
                  {/* Resolve events for this person */}
                  {(() => {
                    const linked = events.filter(e => e.personId === viewingPerson.id || e.personName?.toLowerCase() === viewingPerson.name.toLowerCase());
                    if (linked.length === 0) {
                      return (
                        <div className="text-center py-8 text-xs text-mk-silver">
                          No calendar events linked to this profile. Link events from the Event Catalogue!
                        </div>
                      );
                    }

                    // Sort chronologically (newest to oldest or upcoming first)
                    const sorted = [...linked].sort((a, b) => a.date.localeCompare(b.date));

                    return (
                      <div className="relative border-l-2 border-mk-glass-border/60 ml-4 pl-6 space-y-6">
                        {sorted.map((event) => {
                          const days = getDaysUntilEvent(event.date, event.isRecurring);
                          const isPast = days < 0;

                          return (
                            <div key={event.id} className="relative group/item">
                              {/* Timeline dot */}
                              <div className={`absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full border-2 border-mk-black ${
                                days === 0
                                  ? 'bg-rose-500 animate-pulse'
                                  : isPast
                                  ? 'bg-mk-glass-border'
                                  : 'bg-mk-accent'
                              }`} />

                              <div className="p-3 rounded-xl border border-mk-glass-border bg-white/[0.02] hover:bg-white/5 transition-all">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <span className="text-[10px] font-bold text-mk-silver uppercase tracking-wider">
                                    {formatDateShort(event.date)}
                                  </span>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    isPast ? 'bg-white/5 text-mk-silver' : 'bg-mk-accent/20 text-mk-accent'
                                  }`}>
                                    {isPast ? 'Past Event' : days === 0 ? 'Today 🎉' : `In ${days} days`}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-mk-white mt-1.5">{event.title}</h4>
                                {event.description && (
                                  <p className="text-xs text-mk-silver mt-1">{event.description}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {detailTab === 'gifts' && (
                <div className="space-y-6">
                  {/* Gift Ideas list */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-mk-white flex items-center gap-2">
                      <Gift size={16} className="text-mk-accent" />
                      <span>Gift Ideas & Wishes</span>
                    </h3>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGiftIdea}
                        onChange={(e) => setNewGiftIdea(e.target.value)}
                        placeholder="e.g. Leather watch, box of chocolates..."
                        className="input-premium py-2 text-xs flex-1"
                      />
                      <button
                        onClick={handleAddGiftIdea}
                        className="btn-premium px-4 py-2 text-xs font-bold shrink-0"
                      >
                        Add Idea
                      </button>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {(!viewingPerson.giftIdeas || viewingPerson.giftIdeas.length === 0) ? (
                        <p className="text-xs text-mk-silver/60 italic py-2">No gift ideas recorded.</p>
                      ) : (
                        viewingPerson.giftIdeas.map((idea) => (
                          <div key={idea} className="flex items-center justify-between gap-3 bg-white/[0.02] border border-mk-glass-border/40 p-2.5 rounded-xl text-xs">
                            <span className="text-mk-white">{idea}</span>
                            <button
                              onClick={() => handlePurchaseGift(idea)}
                              className="px-2 py-1 rounded bg-mk-accent/20 text-mk-accent hover:bg-mk-accent/30 text-[9px] font-bold uppercase flex items-center gap-1"
                            >
                              <Check size={10} />
                              <span>Mark Purchased</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Previous gifts history */}
                  <div className="space-y-3 pt-4 border-t border-mk-glass-border/40">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-mk-white flex items-center gap-2">
                      <Award size={16} className="text-mk-silver" />
                      <span>Previous Gifts & History</span>
                    </h3>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPrevGift}
                        onChange={(e) => setNewPrevGift(e.target.value)}
                        placeholder="e.g. Scarf (2025 Birthday)"
                        className="input-premium py-2 text-xs flex-1"
                      />
                      <button
                        onClick={handleAddPrevGift}
                        className="btn-premium px-4 py-2 text-xs font-bold shrink-0"
                      >
                        Log Gift
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {(!viewingPerson.previousGifts || viewingPerson.previousGifts.length === 0) ? (
                        <p className="text-xs text-mk-silver/60 italic py-2">No gift history logged.</p>
                      ) : (
                        viewingPerson.previousGifts.map((gift) => (
                          <span
                            key={gift}
                            className="bg-white/5 border border-mk-glass-border text-mk-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
                          >
                            🎁 {gift}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'details' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mk-silver block mb-1">
                        Favorite Color
                      </span>
                      {viewingPerson.favoriteColor ? (
                        <div className="flex items-center gap-2 bg-white/[0.02] border border-mk-glass-border/40 p-2.5 rounded-xl text-xs">
                          <span
                            className="h-4 w-4 rounded-full border border-white/20 inline-block shrink-0"
                            style={{ backgroundColor: viewingPerson.favoriteColor }}
                          ></span>
                          <span className="text-mk-white font-mono">{viewingPerson.favoriteColor}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-mk-silver/60 block italic">Not set</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mk-silver block mb-1">
                        Favorite Food
                      </span>
                      {viewingPerson.favoriteFood ? (
                        <div className="bg-white/[0.02] border border-mk-glass-border/40 p-2.5 rounded-xl text-xs text-mk-white">
                          🍕 {viewingPerson.favoriteFood}
                        </div>
                      ) : (
                        <span className="text-xs text-mk-silver/60 block italic">Not set</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-mk-silver block mb-1">
                      General Notes
                    </span>
                    {viewingPerson.notes ? (
                      <div className="bg-white/[0.02] border border-mk-glass-border/40 p-3 rounded-xl text-xs text-mk-silver/95 leading-relaxed whitespace-pre-wrap">
                        {viewingPerson.notes}
                      </div>
                    ) : (
                      <span className="text-xs text-mk-silver/60 block italic">No notes written.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-mk-glass-border/40 mt-6 justify-end">
              <button
                type="button"
                onClick={() => setViewingPerson(null)}
                className="btn-premium px-6 py-2.5 text-xs font-bold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture Profile Picture Modal */}
      <CameraCaptureModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(blob) => {
          setSelectedPhotoBlob(blob);
          setPhotoPreviewUrl(URL.createObjectURL(blob));
          toast.success('Snapshot captured! Click Save to apply.');
        }}
      />

      <ContactImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
      <GroupModal formOpen={groupModalOpen} setFormOpen={setGroupModalOpen} handleSave={handleSaveGroup} groupName={groupName} setGroupName={setGroupName} groupType={groupType} setGroupType={setGroupType} groupDesc={groupDesc} setGroupDesc={setGroupDesc} />
    </div>
  );
};

// Internal subcomponents
interface GroupModalProps {
  formOpen: boolean;
  setFormOpen: (open: boolean) => void;
  handleSave: (e: React.FormEvent) => void;
  groupName: string;
  setGroupName: (val: string) => void;
  groupType: Group['type'];
  setGroupType: (val: Group['type']) => void;
  groupDesc: string;
  setGroupDesc: (val: string) => void;
}

const GroupModal: React.FC<GroupModalProps> = ({
  formOpen,
  setFormOpen,
  handleSave,
  groupName,
  setGroupName,
  groupType,
  setGroupType,
  groupDesc,
  setGroupDesc
}) => {
  if (!formOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl glass p-6 sm:p-8 border border-mk-glass-border shadow-silver my-8">
        <button
          onClick={() => setFormOpen(false)}
          className="absolute top-4 right-4 text-mk-silver hover:text-mk-white p-2 rounded-full border border-mk-glass-border hover:bg-white/5 transition-all"
        >
          <X size={18} />
        </button>

        <h2 className="font-display text-2xl font-bold tracking-tight text-mk-white mb-6">
          Create Sharing Group
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input-premium"
              placeholder="e.g. Stark Family"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
              Group Type
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as Group['type'])}
              className="input-premium bg-mk-dark text-mk-white"
            >
              <option value="family">Family 👨‍👩‍👧</option>
              <option value="friends">Friends 👥</option>
              <option value="office">Office 💼</option>
              <option value="custom">Custom 📅</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
              Description
            </label>
            <textarea
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              rows={3}
              className="input-premium resize-none"
              placeholder="Share details or purposes of this group..."
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-mk-glass-border">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="flex-1 rounded-xl border border-mk-glass-border bg-white/5 py-3 text-sm font-semibold hover:bg-white/10 transition-all text-mk-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-premium py-3 text-sm font-bold"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

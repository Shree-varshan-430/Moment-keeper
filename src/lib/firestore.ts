// ─── Firestore Typed CRUD Helpers ────────────────────────────

import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, onSnapshot,
  serverTimestamp, Timestamp, writeBatch, QueryConstraint,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { MKEvent, Person, Group, UserProfile } from '@/types';

// ── Collection References ─────────────────────────────────────
export const COLLECTIONS = {
  users:      'users',
  events:     'events',
  persons:    'persons',
  groups:     'groups',
} as const;

// Helper function to strip undefined keys from payloads before writing to Firestore
export const cleanPayload = (obj: any) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// ── User Profile ──────────────────────────────────────────────
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const createUserProfile = async (profile: UserProfile) => {
  await setDoc(doc(db, COLLECTIONS.users, profile.uid), {
    ...cleanPayload(profile),
    createdAt: serverTimestamp(),
  });
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  await updateDoc(doc(db, COLLECTIONS.users, uid), { ...cleanPayload(data), updatedAt: serverTimestamp() });
};

// ── Events ────────────────────────────────────────────────────
export const getEvents = async (userId: string): Promise<MKEvent[]> => {
  const q = query(
    collection(db, COLLECTIONS.events),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('date', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent));
};

export const getArchivedEvents = async (userId: string): Promise<MKEvent[]> => {
  const q = query(
    collection(db, COLLECTIONS.events),
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent));
};

export const subscribeToEvents = (
  userId: string,
  callback: (events: MKEvent[]) => void,
) => {
  const q = query(
    collection(db, COLLECTIONS.events),
    where('userId', '==', userId),
    where('isArchived', '==', false),
    orderBy('date', 'asc'),
  );
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent)));
  });
};

export const createEvent = async (event: Omit<MKEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
  const finalPayload = {
    ...cleanPayload(event),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  console.log("FIRESTORE addDoc calling with payload:", finalPayload);
  const ref = await addDoc(collection(db, COLLECTIONS.events), finalPayload);
  return ref.id;
};

export const updateEvent = async (id: string, data: Partial<MKEvent>) => {
  await updateDoc(doc(db, COLLECTIONS.events, id), {
    ...cleanPayload(data),
    updatedAt: serverTimestamp(),
  });
};

export const deleteEvent = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.events, id));
};

export const archiveEvent = async (id: string) => {
  await updateDoc(doc(db, COLLECTIONS.events, id), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
};

export const restoreEvent = async (id: string) => {
  await updateDoc(doc(db, COLLECTIONS.events, id), {
    isArchived: false,
    updatedAt: serverTimestamp(),
  });
};

export const toggleFavorite = async (id: string, current: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.events, id), {
    isFavorite: !current,
    updatedAt: serverTimestamp(),
  });
};

// ── Persons ───────────────────────────────────────────────────
export const getPersons = async (userId: string): Promise<Person[]> => {
  const q = query(
    collection(db, COLLECTIONS.persons),
    where('userId', '==', userId),
    orderBy('name', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Person));
};

export const createPerson = async (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.persons), {
    ...cleanPayload(person),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updatePerson = async (id: string, data: Partial<Person>) => {
  await updateDoc(doc(db, COLLECTIONS.persons, id), {
    ...cleanPayload(data),
    updatedAt: serverTimestamp(),
  });
};

export const deletePerson = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.persons, id));
};

export const uploadPersonPhoto = async (userId: string, personId: string, blob: Blob): Promise<string> => {
  const path = `users/${userId}/persons/${personId}/${Date.now()}_photo.jpg`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(fileRef);
  return downloadUrl;
};

// ── Groups ────────────────────────────────────────────────────
export const getGroups = async (userId: string): Promise<Group[]> => {
  const q = query(
    collection(db, COLLECTIONS.groups),
    where('memberIds', 'array-contains', userId),
    orderBy('name', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
};

export const createGroup = async (group: Omit<Group, 'id' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, COLLECTIONS.groups), {
    ...cleanPayload(group),
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getUserProfiles = async (uids: string[]): Promise<UserProfile[]> => {
  if (uids.length === 0) return [];
  const q = query(
    collection(db, COLLECTIONS.users),
    where('uid', 'in', uids)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
};

export const subscribeToGroups = (
  userId: string,
  callback: (groups: Group[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.groups),
    where('memberIds', 'array-contains', userId)
  );
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
    list.sort((a, b) => a.name.localeCompare(b.name));
    callback(list);
  });
};

export const addMemberToGroupByEmail = async (groupId: string, email: string): Promise<string> => {
  // 1. Find user profile by email
  const q = query(collection(db, COLLECTIONS.users), where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error(`User with email ${email} not found.`);
  }
  const userDoc = snap.docs[0];
  const userId = userDoc.id;

  // 2. Add to group memberIds
  const groupRef = doc(db, COLLECTIONS.groups, groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) {
    throw new Error('Group not found.');
  }
  const groupData = groupSnap.data() as Group;
  if (groupData.memberIds.includes(userId)) {
    throw new Error('User is already a member of this group.');
  }

  const updatedMembers = [...groupData.memberIds, userId];
  await updateDoc(groupRef, {
    memberIds: updatedMembers
  });

  return userDoc.data().displayName || email;
};

export const leaveGroup = async (groupId: string, userId: string) => {
  const groupRef = doc(db, COLLECTIONS.groups, groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) return;
  const data = snap.data() as Group;
  const updatedMembers = data.memberIds.filter(id => id !== userId);
  
  if (updatedMembers.length === 0) {
    await deleteDoc(groupRef);
  } else {
    await updateDoc(groupRef, {
      memberIds: updatedMembers,
      ownerId: data.ownerId === userId ? updatedMembers[0] : data.ownerId
    });
  }
};

export const subscribeToVisibleEvents = (
  userId: string,
  groupIds: string[],
  callback: (events: MKEvent[]) => void
) => {
  // Query 1: Personal events
  const qPersonal = query(
    collection(db, COLLECTIONS.events),
    where('userId', '==', userId),
    where('isArchived', '==', false)
  );

  // If user is in no groups, just subscribe to personal events
  if (groupIds.length === 0) {
    return onSnapshot(qPersonal, snap => {
      const personal = snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent));
      personal.sort((a, b) => a.date.localeCompare(b.date));
      callback(personal);
    });
  }

  // Query 2: Group events (events that belong to the groups user is in)
  const qGroup = query(
    collection(db, COLLECTIONS.events),
    where('groupId', 'in', groupIds),
    where('isArchived', '==', false)
  );

  let personalEvents: MKEvent[] = [];
  let groupEvents: MKEvent[] = [];

  const updateCombined = () => {
    const combined = [...personalEvents];
    groupEvents.forEach(ge => {
      if (!combined.some(pe => pe.id === ge.id)) {
        combined.push(ge);
      }
    });
    // Sort by date asc
    combined.sort((a, b) => a.date.localeCompare(b.date));
    callback(combined);
  };

  const unsubPersonal = onSnapshot(qPersonal, snap => {
    personalEvents = snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent));
    updateCombined();
  });

  const unsubGroup = onSnapshot(qGroup, snap => {
    groupEvents = snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent));
    updateCombined();
  });

  return () => {
    unsubPersonal();
    unsubGroup();
  };
};

export const subscribeToUserProfile = (
  uid: string,
  callback: (profile: UserProfile | null) => void
) => {
  return onSnapshot(doc(db, COLLECTIONS.users, uid), (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null);
  });
};

export const subscribeToPersons = (
  userId: string,
  callback: (persons: Person[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.persons),
    where('userId', '==', userId),
    orderBy('name', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Person)));
  });
};

export const subscribeToArchivedEvents = (
  userId: string,
  callback: (events: MKEvent[]) => void
) => {
  const q = query(
    collection(db, COLLECTIONS.events),
    where('userId', '==', userId),
    where('isArchived', '==', true),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as MKEvent)));
  });
};

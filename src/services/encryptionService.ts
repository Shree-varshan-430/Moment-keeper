// ─── Web Crypto API Client-Side Encryption Service ──────────────

import { MKEvent } from '@/types';

// Derives a cryptographic key using PBKDF2 with user UID as salt
async function deriveKey(passkey: string, uid: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passkey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Use user uid as salt for personalization
  const saltBytes = enc.encode(uid.slice(0, 16));

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 50000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypts text using AES-256-GCM
async function encryptText(text: string, key: CryptoKey): Promise<string> {
  if (!text) return '';
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes IV is standard for AES-GCM
  
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    enc.encode(text)
  );

  // Combine IV and Ciphertext for database storage
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  // Return base64 representation
  return btoa(String.fromCharCode(...combined));
}

// Decrypts text using AES-256-GCM
async function decryptText(base64Str: string, key: CryptoKey): Promise<string> {
  if (!base64Str) return '';
  const dec = new TextDecoder();
  
  // Convert base64 back to Uint8Array
  const binaryStr = atob(base64Str);
  const combined = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    combined[i] = binaryStr.charCodeAt(i);
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    ciphertext
  );

  return dec.decode(decrypted);
}

class EncryptionService {
  /**
   * Encrypts private event fields before saving to DB
   */
  async encryptEvent(
    event: Partial<MKEvent>,
    passkey: string,
    uid: string
  ): Promise<Partial<MKEvent>> {
    try {
      const key = await deriveKey(passkey, uid);
      const encryptedEvent = { ...event };

      if (event.title) {
        encryptedEvent.title = await encryptText(event.title, key);
      }
      if (event.description) {
        encryptedEvent.description = await encryptText(event.description, key);
      }
      if (event.notes) {
        encryptedEvent.notes = await encryptText(event.notes, key);
      }
      if (event.personName) {
        encryptedEvent.personName = await encryptText(event.personName, key);
      }

      // Add metadata flag indicating it is application-level encrypted
      (encryptedEvent as any).isEncrypted = true;
      return encryptedEvent;
    } catch (err) {
      console.error('Failed to client-encrypt event:', err);
      return event;
    }
  }

  /**
   * Decrypts a single private event's fields
   */
  async decryptEvent(
    event: MKEvent,
    passkey: string,
    uid: string
  ): Promise<MKEvent> {
    // If the event is not flagged as encrypted, return as is
    if (!(event as any).isEncrypted) {
      return event;
    }

    try {
      const key = await deriveKey(passkey, uid);
      const decryptedEvent = { ...event };

      if (event.title) {
        decryptedEvent.title = await decryptText(event.title, key);
      }
      if (event.description) {
        decryptedEvent.description = await decryptText(event.description, key);
      }
      if (event.notes) {
        decryptedEvent.notes = await decryptText(event.notes, key);
      }
      if (event.personName) {
        decryptedEvent.personName = await decryptText(event.personName, key);
      }

      return decryptedEvent;
    } catch (err) {
      console.warn('Failed to decrypt event. Old passkey or plaintext fallback:', err);
      // Fallback: return unchanged event to avoid breaking the interface
      return event;
    }
  }

  /**
   * Batch decrypts an array of events
   */
  async decryptEvents(
    events: MKEvent[],
    passkey: string,
    uid: string
  ): Promise<MKEvent[]> {
    if (!passkey || !uid || events.length === 0) return events;
    try {
      const decrypted = await Promise.all(
        events.map(event => this.decryptEvent(event, passkey, uid))
      );
      return decrypted;
    } catch (err) {
      console.warn('Decryption batch failed:', err);
      return events;
    }
  }
}

export const encryptionService = new EncryptionService();

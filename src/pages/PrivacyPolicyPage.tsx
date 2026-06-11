// ─── PrivacyPolicyPage Component ──────────────────────────────

import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-mk-white">
      <div>
        <h1 className="section-title text-3xl">Privacy Policy</h1>
        <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
          How we handle, secure, and manage your data
        </p>
      </div>

      <div className="rounded-2xl p-6 sm:p-8 glass border border-mk-glass-border shadow-silver space-y-6 text-sm text-mk-silver leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">1. Data We Collect</h2>
          <p>
            We collect the information you explicitly provide when creating profiles and events. This includes names, dates, descriptions, categories, favorite colors, favorite food items, and gift ideas.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">2. Data Encryption Standards</h2>
          <p className="mb-2">
            To ensure the absolute privacy and security of your personal memories, we enforce high-end encryption standards:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-mk-silver">
            <li>
              <strong className="text-mk-white">Data in Transit:</strong> All data transmitted between the client app (on your browser or device) and the cloud database is encrypted in transit using industry-standard <span className="text-mk-white font-mono">TLS 1.2</span> and <span className="text-mk-white font-mono">TLS 1.3</span> protocols (HTTPS).
            </li>
            <li>
              <strong className="text-mk-white">Data at Rest:</strong> All database records and files uploaded to our cloud host are encrypted at rest using server-side <span className="text-mk-white font-mono">AES-256</span> (Advanced Encryption Standard).
            </li>
            <li>
              <strong className="text-mk-white">Client-Side Private Encryption:</strong> When you mark an event as Private, its sensitive text fields (title, description, linked notes, and names) are encrypted client-side using Web Cryptography's native <span className="text-mk-white">AES-256-GCM</span> algorithm before being written to the database. The decryption key is derived using <span className="text-mk-white font-mono">PBKDF2</span> (50,000 iterations) locally on your device, meaning only you can unlock and read your Private memories with your 4-digit passkey.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">3. Secure Hosting</h2>
          <p>
            Your information is stored securely on servers provided by Google Firebase. We implement user-based security access rules to ensure that only you can write, edit, or read your personal database.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">4. Storage Deletion</h2>
          <p>
            If you delete an event or a person profile, the data is removed from Firebase immediately. You have complete rights to request account closure or delete your data at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

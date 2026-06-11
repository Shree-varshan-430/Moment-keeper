// ─── TermsPage Component ──────────────────────────────────────

import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-mk-white">
      <div>
        <h1 className="section-title text-3xl">Terms & Conditions</h1>
        <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
          General rules and guidelines for app usage
        </p>
      </div>

      <div className="rounded-2xl p-6 sm:p-8 glass border border-mk-glass-border shadow-silver space-y-6 text-sm text-mk-silver leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">1. Use License</h2>
          <p>
            You are granted a personal license to download and run MomentKeeper for individual uses on your personal devices. Re-selling or distributing source components is prohibited.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">2. Dynamic Reminders</h2>
          <p>
            While our notification systems are designed to schedule local alert items with high fidelity, users are recommended to ensure backup calendars for high priority, critical business dates.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-mk-white font-display mb-2">3. Updates</h2>
          <p>
            MomentKeeper may publish updates to styling details, performance packages, or security policies over time. These updates are deployed automatically for web and packaged stores.
          </p>
        </div>
      </div>
    </div>
  );
};

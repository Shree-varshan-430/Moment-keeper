// ─── AboutPage Component ──────────────────────────────────────

import React from 'react';
import { ShieldAlert, BookOpen, UserCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-mk-white">
      <div>
        <h1 className="section-title text-3xl">About MomentKeeper</h1>
        <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
          Learn about our values and core purpose
        </p>
      </div>

      <div className="rounded-2xl p-6 sm:p-8 glass border border-mk-glass-border shadow-silver space-y-6">
        <div>
          <h2 className="text-xl font-bold font-display mb-2">Our Vision</h2>
          <p className="text-sm text-mk-silver leading-relaxed">
            MomentKeeper is your personal life-event companion designed to help you remember birthdays, anniversaries, family occasions, milestones, and special moments. Keep closer connections to the people who matter most through smart reminders, elegant countdowns, beautiful calendars, and personalized memory notes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-mk-glass-border/40">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-mk-glass-border/60">
            <BookOpen size={20} className="text-mk-accent mb-2" />
            <h3 className="text-sm font-bold mb-1">Simple Layouts</h3>
            <p className="text-xs text-mk-silver leading-relaxed">Quickly view upcoming anniversaries and milestone countdowns from clean interfaces.</p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-mk-glass-border/60">
            <ShieldAlert size={20} className="text-mk-accent mb-2" />
            <h3 className="text-sm font-bold mb-1">Private Sync</h3>
            <p className="text-xs text-mk-silver leading-relaxed">Secure data storage in the cloud with complete user ownership and private databases.</p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-mk-glass-border/60">
            <UserCheck size={20} className="text-mk-accent mb-2" />
            <h3 className="text-sm font-bold mb-1">Memory Notes</h3>
            <p className="text-xs text-mk-silver leading-relaxed">Store gift ideas, favorite food items, or color details about your family & friends.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-mk-glass-border/40 flex items-center justify-between text-xs text-mk-silver">
          <span>App Version: 1.0.0 (Gold Release)</span>
          <span>Designed with silver luxury styling</span>
        </div>
      </div>
    </div>
  );
};

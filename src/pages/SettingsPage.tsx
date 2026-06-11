// ─── SettingsPage Component ───────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Bell, Shield, Volume2, Monitor, HelpCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { audioService } from '@/services/audioService';
import { hapticService } from '@/services/hapticService';
import { Capacitor, registerPlugin } from '@capacitor/core';



export const SettingsPage: React.FC = () => {
  const { profile, user, updateProfileInfo, updateNotificationPrefs, updateThemePreference, updateReduceMotionPreference, updatePrivatePasskey } = useAuthStore();

  const [name, setName] = useState(profile?.displayName || user?.displayName || profile?.email?.split('@')[0] || user?.email?.split('@')[0] || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPasskey, setCurrentPasskey] = useState('');
  const [passkey, setPasskey] = useState('');
  const [savingPasskey, setSavingPasskey] = useState(false);



  const handlePasskeySave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const correctPasskey = String(profile?.privatePasskey || '1234');
    if (currentPasskey !== correctPasskey) {
      toast.error('Incorrect current passkey.');
      hapticService.error();
      return;
    }

    if (!/^\d{4}$/.test(passkey)) {
      toast.error('New passkey must be exactly 4 digits (0-9).');
      hapticService.error();
      return;
    }

    if (currentPasskey === passkey) {
      toast.error('New passkey must be different from current passkey.');
      hapticService.error();
      return;
    }

    setSavingPasskey(true);
    try {
      hapticService.mediumImpact();
      await updatePrivatePasskey(passkey);
      toast.success('Private passkey updated successfully!');
      
      // Clear session unlock state for security so they must enter the new passcode to re-enter
      sessionStorage.removeItem('isPrivateUnlocked');
      
      setPasskey('');
      setCurrentPasskey('');
      hapticService.success();
    } catch (err) {
      toast.error('Failed to update passkey.');
      hapticService.error();
    } finally {
      setSavingPasskey(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfileInfo(name);
      toast.success('Profile details updated!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };


  const handleTogglePrefs = async (field: 'enabled' | 'sound' | 'vibration') => {
    if (!profile) return;
    const prefs = profile.notificationPreferences || { enabled: true, sound: true, vibration: true };
    const current = prefs[field];
    try {
      await updateNotificationPrefs({ [field]: !current });
      toast.success('Notification preferences updated!');
      if (field === 'sound' && !current) {
        audioService.playSatinBell();
      }
      if (field === 'vibration' && !current) {
        hapticService.success();
      }
    } catch (err) {
      toast.error('Failed to save preferences.');
    }
  };

  const handleToggleReduceMotion = () => {
    if (!profile) return;
    updateReduceMotionPreference(!profile.reduceMotion);
    toast.success(profile.reduceMotion ? 'Animations restored.' : 'Motion effects reduced.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="section-title text-3xl">System Settings</h1>
        <p className="text-xs text-mk-silver tracking-widest uppercase mt-1">
          Customize notifications, profile preferences, themes, and access policies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Update Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Card */}
          <div className="rounded-2xl p-6 glass border border-mk-glass-border shadow-silver">
            <h2 className="text-lg font-bold text-mk-white font-display mb-4">
              Profile Management
            </h2>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                  placeholder="Your Name"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full btn-premium py-3 font-semibold disabled:opacity-50"
              >
                {savingProfile ? 'Saving Details...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Private Passkey Locker */}
          <div className="rounded-2xl p-6 glass border border-mk-glass-border shadow-silver">
            <h2 className="text-lg font-bold text-mk-white font-display mb-4 flex items-center gap-2">
              <Shield size={18} className="text-mk-silver" />
              Private Passkey Lock
            </h2>
            <p className="text-xs text-mk-silver mb-4">
              Secure your private moments by defining a custom 4-digit security code. This code locks your Private tab and restricts access to unauthorized viewers.
            </p>

            <form onSubmit={handlePasskeySave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    Current 4-Digit Passkey
                  </label>
                  <input
                    type="password"
                    pattern="\d*"
                    maxLength={4}
                    value={currentPasskey}
                    onChange={(e) => setCurrentPasskey(e.target.value.replace(/\D/g, ''))}
                    className="input-premium tracking-widest text-center text-lg font-mono"
                    placeholder="••••"
                  />
                  <p className="text-[10px] text-mk-silver mt-1.5">
                    Enter your existing passkey. Default is <span className="font-mono text-mk-white">1234</span>.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-mk-silver mb-1.5">
                    New 4-Digit Passkey
                  </label>
                  <input
                    type="password"
                    pattern="\d*"
                    maxLength={4}
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value.replace(/\D/g, ''))}
                    className="input-premium tracking-widest text-center text-lg font-mono"
                    placeholder="••••"
                  />
                  <p className="text-[10px] text-mk-silver mt-1.5">
                    Enter exactly 4 numeric digits for your new passkey.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPasskey}
                className="w-full btn-premium py-3 font-semibold disabled:opacity-50"
              >
                {savingPasskey ? 'Updating Passkey...' : 'Update Private Passkey'}
              </button>
            </form>
          </div>


          {/* System preferences & Audio */}
          <div className="rounded-2xl p-6 glass border border-mk-glass-border shadow-silver space-y-5">
            <h2 className="text-lg font-bold text-mk-white font-display">
              System Customization
            </h2>


            {/* Audio Alerts */}
            <div className="flex items-center justify-between py-2 border-b border-mk-glass-border/40">
              <div>
                <span className="text-sm font-semibold text-mk-white block">Audio Notifications</span>
                <span className="text-xs text-mk-silver">Play sound reminders when alerts arrive.</span>
              </div>
              <button
                onClick={() => handleTogglePrefs('sound')}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  profile?.notificationPreferences?.sound ? 'bg-gradient-silver' : 'bg-white/5 border border-mk-glass-border'
                }`}
              >
                <div
                  className={`h-4.5 w-4.5 rounded-full shadow-md transform duration-300 ${
                    profile?.notificationPreferences?.sound ? 'translate-x-6 bg-mk-black' : 'bg-mk-silver'
                  }`}
                />
              </button>
            </div>

            {profile?.notificationPreferences?.sound && (
              <div className="py-2 border-b border-mk-glass-border/40 space-y-2.5 animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Preview Notification Sound
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => audioService.playSound('bell')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-mk-glass-border hover:border-muted-foreground/30 text-foreground bg-white/5 transition-all"
                  >
                    🔔 Satin Bell
                  </button>
                  <button
                    onClick={() => audioService.playSound('chime')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-mk-glass-border hover:border-muted-foreground/30 text-foreground bg-white/5 transition-all"
                  >
                    ✨ Luxury Chime
                  </button>
                  <button
                    onClick={() => audioService.playSound('digital')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-mk-glass-border hover:border-muted-foreground/30 text-foreground bg-white/5 transition-all"
                  >
                    🔊 Digital Alert
                  </button>
                </div>
              </div>
            )}


            {/* Vibrations Alert */}
            <div className="flex items-center justify-between py-2 border-b border-mk-glass-border/40">
              <div>
                <span className="text-sm font-semibold text-mk-white block">Haptic Vibrations</span>
                <span className="text-xs text-mk-silver">Trigger haptic vibration alerts on devices.</span>
              </div>
              <button
                onClick={() => handleTogglePrefs('vibration')}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  profile?.notificationPreferences?.vibration ? 'bg-gradient-silver' : 'bg-white/5 border border-mk-glass-border'
                }`}
              >
                <div
                  className={`h-4.5 w-4.5 rounded-full shadow-md transform duration-300 ${
                    profile?.notificationPreferences?.vibration ? 'translate-x-6 bg-mk-black' : 'bg-mk-silver'
                  }`}
                />
              </button>
            </div>

            {profile?.notificationPreferences?.vibration && (
              <div className="py-2 border-b border-mk-glass-border/40 space-y-2.5 animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Preview Haptic Feedback
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => hapticService.lightImpact()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-mk-glass-border hover:border-muted-foreground/30 text-foreground bg-white/5 transition-all"
                  >
                    📳 Click Tap
                  </button>
                  <button
                    onClick={() => hapticService.success()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-mk-glass-border hover:border-muted-foreground/30 text-foreground bg-white/5 transition-all"
                  >
                    ✔️ Success Vibe
                  </button>
                  <button
                    onClick={() => hapticService.startHeartbeat()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-mk-glass-border hover:border-muted-foreground/30 text-foreground bg-white/5 transition-all"
                  >
                    💓 Alarm Beat
                  </button>
                </div>
              </div>
            )}

            {/* Reduce Motion */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-semibold text-mk-white block">Reduce Motion</span>
                <span className="text-xs text-mk-silver">Minimize dashboard animations and 3D scenes.</span>
              </div>
              <button
                onClick={handleToggleReduceMotion}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  profile?.reduceMotion ? 'bg-gradient-silver' : 'bg-white/5 border border-mk-glass-border'
                }`}
              >
                <div
                  className={`h-4.5 w-4.5 rounded-full shadow-md transform duration-300 ${
                    profile?.reduceMotion ? 'translate-x-6 bg-mk-black' : 'bg-mk-silver'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Legal policy quick-links column */}
        <div className="space-y-6">
          <div className="rounded-2xl p-6 glass border border-mk-glass-border shadow-silver space-y-4">
            <h2 className="text-lg font-bold text-mk-white font-display">
              Policy & Support
            </h2>

            <div className="space-y-2">
              <Link
                to="/about"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-mk-glass-border/40 bg-white/[0.02] hover:bg-white/5 text-sm font-semibold text-mk-white transition-colors"
              >
                <HelpCircle size={16} className="text-mk-silver" />
                <span>About MomentKeeper</span>
              </Link>

              <Link
                to="/privacy"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-mk-glass-border/40 bg-white/[0.02] hover:bg-white/5 text-sm font-semibold text-mk-white transition-colors"
              >
                <Shield size={16} className="text-mk-silver" />
                <span>Privacy Policies</span>
              </Link>

              <Link
                to="/terms"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-mk-glass-border/40 bg-white/[0.02] hover:bg-white/5 text-sm font-semibold text-mk-white transition-colors"
              >
                <Shield size={16} className="text-mk-silver" />
                <span>Terms & Conditions</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

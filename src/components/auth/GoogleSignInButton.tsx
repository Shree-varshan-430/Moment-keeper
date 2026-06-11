// ─── Google Sign-In Button Component ────────────────────────

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import toast from 'react-hot-toast';

export const GoogleSignInButton: React.FC = () => {
  const { logInWithGoogle, loading } = useAuthStore();
  const { isOnline } = useUIStore();

  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      toast.error('Google Sign-In is unavailable offline.');
      return;
    }
    try {
      await logInWithGoogle();
      toast.success('Signed in successfully! Welcome to MomentKeeper.');
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-In failed.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading || !isOnline}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-mk-glass-border bg-white/5 py-3 px-4 font-semibold text-mk-white transition-all duration-300 hover:bg-white/10 hover:shadow-silver-sm active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-white/5 disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>Continue with Google</span>
    </button>
  );
};

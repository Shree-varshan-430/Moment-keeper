// ─── Protected Route HOC ─────────────────────────────────────

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading && !user) {
      navigate('/login');
    }
  }, [user, loading, initialized, navigate]);

  if (!initialized || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-mk-black text-mk-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-mk-silver border-t-transparent"></div>
          <span className="font-display text-sm tracking-widest text-mk-silver uppercase animate-pulse">
            MomentKeeper
          </span>
        </div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};

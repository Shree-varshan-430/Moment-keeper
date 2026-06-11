// ─── LoginPage Component ─────────────────────────────────────

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useUIStore } from '@/store/uiStore';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = zod.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { logIn, loading, error } = useAuthStore();
  const { isOnline } = useUIStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    if (!isOnline) {
      toast.error('Logging in requires an active internet connection.');
      return;
    }
    try {
      await logIn(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none opacity-40"></div>
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-mk-silver/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-mk-silver-2/5 blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="z-10 w-full max-w-md glass-card p-8 sm:p-10"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Never miss life's important moments.
          </p>
        </div>

        {!isOnline && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400 flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-amber-300">Offline Mode</span>
              You can still access your account and local data if you have logged in previously on this device. New sign-ins and registrations are disabled until connection is restored.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              className="input-premium"
              placeholder="name@example.com"
            />
            {errors.email && (
              <span className="mt-1 text-xs text-destructive">{errors.email.message}</span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              {...register('password')}
              className="input-premium"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="mt-1 text-xs text-destructive">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isOnline}
            className="w-full btn-premium py-3 font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between">
          <span className="h-[1px] w-full bg-mk-glass-border"></span>
          <span className="px-3 text-xs text-muted-foreground uppercase">or</span>
          <span className="h-[1px] w-full bg-mk-glass-border"></span>
        </div>

        <GoogleSignInButton />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to MomentKeeper?{' '}
          <Link
            to="/signup"
            className="font-semibold text-foreground hover:underline transition-all"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

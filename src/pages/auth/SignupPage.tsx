// ─── SignupPage Component ────────────────────────────────────

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

const signupSchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormInputs = zod.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const { signUp, loading, error } = useAuthStore();
  const { isOnline } = useUIStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormInputs) => {
    if (!isOnline) {
      toast.error('Creating an account requires an active internet connection.');
      return;
    }
    try {
      await signUp(data.email, data.password, data.name);
      toast.success('Account created successfully! Welcome.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
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
            Create Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Begin storing your luxury memories today.
          </p>
        </div>

        {!isOnline && (
          <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400 flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5 text-amber-300">Offline Mode</span>
              Creating a new account requires an active internet connection. Please check your network and try again.
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
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="input-premium"
              placeholder="John Doe"
            />
            {errors.name && (
              <span className="mt-1 text-xs text-destructive">{errors.name.message}</span>
            )}
          </div>

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
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Password
            </label>
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between">
          <span className="h-[1px] w-full bg-mk-glass-border"></span>
          <span className="px-3 text-xs text-muted-foreground uppercase">or</span>
          <span className="h-[1px] w-full bg-mk-glass-border"></span>
        </div>

        <GoogleSignInButton />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-foreground hover:underline transition-all"
          >
            Sign in instead
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

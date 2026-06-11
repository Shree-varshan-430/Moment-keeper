// ─── ForgotPasswordPage Component ─────────────────────────────

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const forgotSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
});

type ForgotFormInputs = zod.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword, loading, error } = useAuthStore();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormInputs>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormInputs) => {
    try {
      await resetPassword(data.email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground overflow-hidden transition-colors duration-300">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none opacity-40"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="z-10 w-full max-w-md glass-card p-8 sm:p-10"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Reset Password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent
              ? 'Check your inbox for a secure recovery link.'
              : 'Enter your email to receive recovery instructions.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/15 border border-destructive/20 p-3 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        {sent ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-mk-glass-border">
              <svg
                className="h-8 w-8 text-muted-foreground animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l8-4.666a2 2 0 012.22 0l8 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've sent a link to reset your password. If you don't receive it in a few minutes, check your spam folder.
            </p>
            <Link
              to="/login"
              className="block w-full btn-premium py-3 font-semibold"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-premium py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Recovery Link'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <Link
                to="/login"
                className="font-semibold text-foreground hover:underline transition-all"
              >
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

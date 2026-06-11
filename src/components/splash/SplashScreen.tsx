// ─── Premium Splash Screen Component ──────────────────────────

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';

export const SplashScreen: React.FC = () => {
  const { activeSplash, setSplashActive } = useUIStore();

  useEffect(() => {
    // 2.5 seconds auto dismiss
    const timer = setTimeout(() => {
      setSplashActive(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [setSplashActive]);

  return (
    <AnimatePresence>
      {activeSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-mk-black"
        >
          {/* Subtle Background Glowing Gradients */}
          <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mk-silver/10 blur-[80px] pointer-events-none animate-pulse-silver"></div>

          <div className="relative flex flex-col items-center">
            {/* Shimmering Metallic Logo Icon */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-32 w-32 items-center justify-center select-none cursor-default"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(255,255,255,0.18)]">
                <defs>
                  {/* Dark luxury box background gradient */}
                  <linearGradient id="boxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2E2E2E" />
                    <stop offset="50%" stopColor="#1E1E1E" />
                    <stop offset="100%" stopColor="#0F0F0F" />
                  </linearGradient>

                  {/* Metallic silver ribbon gradient */}
                  <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="40%" stopColor="#D1D5DB" />
                    <stop offset="70%" stopColor="#9CA3AF" />
                    <stop offset="100%" stopColor="#4B5563" />
                  </linearGradient>

                  {/* Embossed medallion background */}
                  <radialGradient id="medallionGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="70%" stopColor="#1F2937" />
                    <stop offset="100%" stopColor="#111827" />
                  </radialGradient>
                </defs>

                {/* Left Bow Loop */}
                <path d="M 50 26 C 28 8 22 25 47 27 Z" fill="url(#ribbonGradient)" />

                {/* Right Bow Loop */}
                <path d="M 50 26 C 72 8 78 25 53 27 Z" fill="url(#ribbonGradient)" />

                {/* Bow Tails */}
                <path d="M 46 26 C 36 34 32 45 30 52 C 34 48 42 38 46 28 Z" fill="url(#ribbonGradient)" opacity="0.8" />
                <path d="M 54 26 C 64 34 68 45 70 52 C 66 48 58 38 54 28 Z" fill="url(#ribbonGradient)" opacity="0.8" />

                {/* Main Box Body */}
                <rect x="18" y="36" width="64" height="52" rx="8" fill="url(#boxGradient)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.2" />

                {/* Box Lid */}
                <rect x="14" y="27" width="72" height="11" rx="3" fill="url(#boxGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" />

                {/* Vertical Ribbon */}
                <rect x="44" y="27" width="12" height="61" fill="url(#ribbonGradient)" />

                {/* Horizontal Ribbon */}
                <rect x="18" y="56" width="64" height="11" fill="url(#ribbonGradient)" />

                {/* Bow Knot */}
                <circle cx="50" cy="26" r="6" fill="url(#ribbonGradient)" />
                <circle cx="50" cy="26" r="4.5" fill="#FFFFFF" opacity="0.2" />

                {/* Central Medallion */}
                <circle cx="50" cy="62" r="17" fill="url(#medallionGradient)" stroke="url(#ribbonGradient)" strokeWidth="1.5" />
                <circle cx="50" cy="62" r="14.5" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

                {/* Embossed Letter 'M' */}
                <text x="50" y="68" textAnchor="middle" fontFamily="'Inter', system-ui, sans-serif" fontWeight="900" fontSize="17" fill="url(#ribbonGradient)" letterSpacing="0">
                  M
                </text>
              </svg>
            </motion.div>

            {/* Glowing shimmer particle ring */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: [0, 0.4, 0] }}
              transition={{ delay: 0.3, duration: 1.5, repeat: Infinity }}
              className="absolute -inset-4 rounded-full border border-mk-silver/30 pointer-events-none blur-[2px]"
            ></motion.div>

            {/* Title / Brand Name Reveal */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
              className="mt-8 font-display text-4xl font-bold tracking-widest text-mk-white text-gradient"
            >
              MOMENTKEEPER
            </motion.h1>

            {/* Premium Tagline */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="mt-3 text-xs tracking-[0.25em] text-mk-silver uppercase font-medium select-none"
            >
              "Never Miss Life's Important Moments"
            </motion.p>
          </div>

          {/* Loading status bar */}
          <div className="absolute bottom-12 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
              className="absolute w-2/3 h-full bg-gradient-silver"
            ></motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

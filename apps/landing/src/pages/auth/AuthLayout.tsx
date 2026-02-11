/**
 * Auth Layout Component
 *
 * Shared layout for authentication pages (login, register, forgot password)
 * Features:
 * - Gradient background with animated effects
 * - Responsive design (sidebar on desktop, full screen on mobile)
 * - CGraph branding throughout
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoIcon } from '../../components/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Left Panel - Branding (Desktop only) */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 xl:w-[45%]">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-[#0a0a0f] to-cyan-900/20" />

        {/* Animated Orbs */}
        <motion.div
          className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-12">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <LogoIcon size={40} showGlow={false} color="gradient" />
            <span className="text-2xl font-bold tracking-tight text-white">CGraph</span>
          </Link>

          {/* Main Message */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Connect, Share,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Build Community
              </span>
            </h1>
            <p className="max-w-md text-lg text-gray-400">
              Join a growing community on the most secure messaging platform. End-to-end encrypted.
              Privacy-first. Always free.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                🔒 E2E Encrypted
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                🌐 Web3 Ready
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                🎮 Gamification
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-gray-500">© 2026 CGraph. All rights reserved.</div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3">
              <LogoIcon size={36} showGlow color="gradient" />
              <span className="text-2xl font-bold text-white">CGraph</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <motion.h2
              className="text-3xl font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {title}
            </motion.h2>
            <motion.p
              className="mt-2 text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

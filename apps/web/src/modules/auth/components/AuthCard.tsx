/**
 * AuthCard Component
 *
 * Animated card container for auth pages.
 * Sub-components extracted to:
 *  - AuthLogo.tsx       – logo with size variants
 *  - AuthBackgrounds.tsx – gradient / particles / grid backgrounds
 *  - AuthCardHeader.tsx  – animated title + subtitle block
 */

import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { AuthLogo } from '@/modules/auth/components/AuthLogo';
import { AuthBackground } from '@/modules/auth/components/AuthBackgrounds';
import { AuthCardHeader } from '@/modules/auth/components/AuthCardHeader';
import type { LogoSize } from '@/modules/auth/components/AuthLogo';
import type { BackgroundEffect } from '@/modules/auth/components/AuthBackgrounds';
import { springs } from '@/lib/animation-presets/presets';

export interface AuthCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'compact' | 'split';
  showLogo?: boolean;
  logoSize?: LogoSize;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  backgroundEffect?: BackgroundEffect;
  className?: string;
}

function AnimatedFooter({
  children,
  className = 'mt-8',
}: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
    className={className}
  >
    {children}
  </motion.div>
);
}

/* ── Split variant ────────────────────────────────────────────── */

function SplitVariant({
  children,
  showLogo,
  logoSize = 'md',
  title,
  subtitle,
  footer,
  backgroundEffect = 'gradient',
  className = '',
}: Pick<
  AuthCardProps,
  | 'children'
  | 'showLogo'
  | 'logoSize'
  | 'title'
  | 'subtitle'
  | 'footer'
  | 'backgroundEffect'
  | 'className'
>): React.ReactElement {
  return (
  <div className={`flex min-h-screen ${className}`}>
    {/* Left side – branding */}
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative hidden flex-col justify-between bg-gradient-to-br from-primary-600 to-purple-700 p-12 lg:flex lg:w-1/2"
    >
      <AuthBackground effect={backgroundEffect} />
      <div className="relative">{showLogo && <AuthLogo size={logoSize} />}</div>
      <div className="relative space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-white"
        >
          Connect with your community
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-white/70"
        >
          Join millions of people sharing, learning, and building together.
        </motion.p>
      </div>
      <div className="relative text-sm text-white/50">
        © {new Date().getFullYear()} CGraph. All rights reserved.
      </div>
    </motion.div>

    {/* Right side – form */}
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-1 items-center justify-center bg-dark-900 p-8"
    >
      <div className="w-full max-w-md">
        {showLogo && (
          <div className="mb-8 text-center lg:hidden">
            <AuthLogo size={logoSize} />
          </div>
        )}
        <AuthCardHeader title={title} subtitle={subtitle} className="mb-8" />
        {children}
        {footer && <AnimatedFooter>{footer}</AnimatedFooter>}
      </div>
    </motion.div>
  </div>
  );
}

/* ── Compact variant ──────────────────────────────────────────── */

function CompactVariant({
  children,
  showLogo,
  title,
  subtitle,
  footer,
  backgroundEffect = 'gradient',
  className = '',
}: Pick<
  AuthCardProps,
  'children' | 'showLogo' | 'title' | 'subtitle' | 'footer' | 'backgroundEffect' | 'className'
>): React.ReactElement {
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`mx-auto w-full max-w-sm ${className}`}
  >
    <GlassCard variant="frosted" className="relative overflow-hidden p-6">
      <AuthBackground effect={backgroundEffect} />
      <div className="relative">
        {showLogo && (
          <div className="mb-6 text-center">
            <AuthLogo size="sm" />
          </div>
        )}
        <AuthCardHeader
          title={title}
          subtitle={subtitle}
          className="mb-6 text-center"
          animated={false}
        />
        {children}
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </GlassCard>
  </motion.div>
  );
}

/* ── Default variant ──────────────────────────────────────────── */

function DefaultVariant({
  children,
  showLogo,
  logoSize = 'md',
  title,
  subtitle,
  footer,
  backgroundEffect = 'gradient',
  className = '',
}: Pick<
  AuthCardProps,
  | 'children'
  | 'showLogo'
  | 'logoSize'
  | 'title'
  | 'subtitle'
  | 'footer'
  | 'backgroundEffect'
  | 'className'
>): React.ReactElement {
  return (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={springs.ultraSmooth}
    className={`mx-auto w-full max-w-md ${className}`}
  >
    <GlassCard variant="crystal" className="relative overflow-hidden p-8">
      {/* Animated border */}
      <motion.div
        animate={{
          background: [
            'linear-gradient(0deg, transparent, rgba(var(--color-primary-500), 0.5), transparent)',
            'linear-gradient(180deg, transparent, rgba(var(--color-primary-500), 0.5), transparent)',
            'linear-gradient(360deg, transparent, rgba(var(--color-primary-500), 0.5), transparent)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ padding: 1 }}
      />
      <AuthBackground effect={backgroundEffect} />
      <div className="relative">
        {showLogo && (
          <div className="mb-8 text-center">
            <AuthLogo size={logoSize} />
          </div>
        )}
        <AuthCardHeader title={title} subtitle={subtitle} />
        {children}
        {footer && (
          <AnimatedFooter className="mt-8 border-t border-white/10 pt-6">{footer}</AnimatedFooter>
        )}
      </div>
    </GlassCard>
  </motion.div>
  );
}

/* ── Main component ───────────────────────────────────────────── */

export function AuthCard(props: AuthCardProps): React.ReactElement {
  const { variant = 'default' } = props;

  if (variant === 'split') return <SplitVariant {...props} />;
  if (variant === 'compact') return <CompactVariant {...props} />;
  return <DefaultVariant {...props} />;
};

export default AuthCard;

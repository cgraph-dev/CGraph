/**
 * CGraph Logo - Clean SVG Icon Component
 *
 * A professional, scalable logo that works as an icon.
 * Designed for clarity at all sizes from 16px to 512px.
 */

import { motion } from 'framer-motion';

export interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: 'full' | 'icon' | 'monochrome';
  color?: 'default' | 'white' | 'dark';
}

// Pure SVG Logo Icon - No external dependencies, works everywhere
export function LogoIcon({
  size = 32,
  className = '',
  animated = false,
  variant: _variant = 'icon',
  color = 'default'
}: LogoProps) {
  // _variant is available for future use (full, icon, monochrome)
  const colors = {
    default: {
      primary: '#10b981',    // Emerald
      secondary: '#8b5cf6',  // Purple
      accent: '#06b6d4',     // Cyan
    },
    white: {
      primary: '#ffffff',
      secondary: '#ffffff',
      accent: '#ffffff',
    },
    dark: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#4b5563',
    },
  };

  const c = colors[color];

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main gradient */}
        <linearGradient id={`logo-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.primary} />
          <stop offset="50%" stopColor={c.accent} />
          <stop offset="100%" stopColor={c.secondary} />
        </linearGradient>

        {/* Glow effect */}
        <filter id={`logo-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hexagon outline */}
      <motion.path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        stroke={`url(#logo-gradient-${size})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
        initial={animated ? { pathLength: 0, opacity: 0 } : {}}
        animate={animated ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Inner hexagon fill */}
      <path
        d="M32 8L52 20V44L32 56L12 44V20L32 8Z"
        fill="rgba(17, 24, 39, 0.9)"
      />

      {/* C letter - graph node style */}
      <motion.g
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
      >
        {/* C shape */}
        <path
          d="M28 22C20 22 16 28 16 32C16 36 20 42 28 42"
          stroke={c.primary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Node at C top */}
        <circle cx="28" cy="22" r="3" fill={c.primary} />

        {/* Node at C bottom */}
        <circle cx="28" cy="42" r="3" fill={c.primary} />
      </motion.g>

      {/* G letter - graph node style */}
      <motion.g
        initial={animated ? { scale: 0, opacity: 0 } : {}}
        animate={animated ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
      >
        {/* G outer curve */}
        <path
          d="M36 22C44 22 48 28 48 32C48 36 44 42 36 42"
          stroke={c.secondary}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* G crossbar */}
        <path
          d="M40 32H48"
          stroke={c.secondary}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Node at G top */}
        <circle cx="36" cy="22" r="3" fill={c.secondary} />

        {/* Node at G bottom */}
        <circle cx="36" cy="42" r="3" fill={c.secondary} />

        {/* Node at G crossbar end */}
        <circle cx="48" cy="32" r="2.5" fill={c.accent} />
      </motion.g>

      {/* Central connecting node - the "Graph" element */}
      <motion.g
        initial={animated ? { scale: 0 } : {}}
        animate={animated ? { scale: 1 } : {}}
        transition={{ delay: 0.9, duration: 0.3, type: "spring" }}
      >
        <circle cx="32" cy="32" r="4" fill={c.accent} />

        {/* Connection lines */}
        <line x1="28" y1="22" x2="32" y2="32" stroke={c.primary} strokeWidth="1.5" opacity="0.6" />
        <line x1="28" y1="42" x2="32" y2="32" stroke={c.primary} strokeWidth="1.5" opacity="0.6" />
        <line x1="36" y1="22" x2="32" y2="32" stroke={c.secondary} strokeWidth="1.5" opacity="0.6" />
        <line x1="36" y1="42" x2="32" y2="32" stroke={c.secondary} strokeWidth="1.5" opacity="0.6" />
      </motion.g>

      {/* Decorative corner nodes */}
      {animated && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="32" cy="4" r="1.5" fill={c.accent} />
          <circle cx="56" cy="18" r="1.5" fill={c.primary} />
          <circle cx="56" cy="46" r="1.5" fill={c.secondary} />
          <circle cx="32" cy="60" r="1.5" fill={c.accent} />
          <circle cx="8" cy="46" r="1.5" fill={c.secondary} />
          <circle cx="8" cy="18" r="1.5" fill={c.primary} />
        </motion.g>
      )}
    </svg>
  );
}

// Logo with text
export function LogoWithText({
  size = 32,
  className = '',
  animated = false,
  textClassName = '',
}: LogoProps & { textClassName?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} animated={animated} />
      <motion.span
        className={`font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent ${textClassName}`}
        initial={animated ? { opacity: 0, x: -10 } : {}}
        animate={animated ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 1, duration: 0.5 }}
      >
        CGraph
      </motion.span>
    </div>
  );
}

// Animated logo for loading states
export function LogoLoader({ size = 48 }: { size?: number }) {
  return (
    <div className="relative">
      <LogoIcon size={size} animated />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
}

// Favicon-compatible simple version
export function LogoSimple({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#111827" />
      <path
        d="M24 20C18 20 14 26 14 32C14 38 18 44 24 44"
        stroke="#10b981"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M40 20C46 20 50 26 50 32C50 38 46 44 40 44"
        stroke="#8b5cf6"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M38 32H50" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill="#06b6d4" />
    </svg>
  );
}

export default LogoIcon;

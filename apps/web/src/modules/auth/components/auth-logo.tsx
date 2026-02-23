/**
 * Auth page logo component.
 * @module
 */
import React from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/logo';

export type LogoSize = 'sm' | 'md' | 'lg';

const LOGO_SIZES: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

const LOGO_TEXT_SIZES: Record<LogoSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function AuthLogo({ size }: { size: LogoSize }): React.ReactElement {
  return (
  <a href="https://www.cgraph.org" className="group inline-flex items-center gap-3">
    <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
      <LogoIcon size={LOGO_SIZES[size]} color="gradient" showGlow animated={false} />
    </motion.div>
    <span className={`font-bold text-white ${LOGO_TEXT_SIZES[size]}`}>CGraph</span>
  </a>
);
}

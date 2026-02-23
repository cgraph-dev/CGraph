/**
 * Authentication card header component.
 * @module
 */
import React from 'react';
import { motion } from 'framer-motion';

export interface AuthCardHeaderProps {
  title?: string;
  subtitle?: string;
  /** Extra Tailwind classes for the wrapper div */
  className?: string;
  /** Whether title/subtitle use motion animations */
  animated?: boolean;
}

export function AuthCardHeader({
  title,
  subtitle,
  className = 'mb-8 text-center',
  animated = true,
}: AuthCardHeaderProps): React.ReactElement | null {
  if (!title && !subtitle) return null;

  const TitleTag = animated ? motion.h2 : 'h2';
  const SubTag = animated ? motion.p : 'p';

  const titleMotion = animated
    ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
    : {};
  const subMotion = animated
    ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 } }
    : {};

  return (
    <div className={className}>
      {title && (
        <TitleTag {...titleMotion} className="text-2xl font-bold text-white">
          {title}
        </TitleTag>
      )}
      {subtitle && (
        <SubTag {...subMotion} className="mt-2 text-white/60">
          {subtitle}
        </SubTag>
      )}
    </div>
  );
};

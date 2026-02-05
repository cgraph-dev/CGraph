import { memo } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion, DEFAULT_COLOR, SECURITY_ICONS } from './constants';
import type { FloatingIconsProps } from './types';

/**
 * FloatingIcons Component
 *
 * Animated security icons floating in the background
 */
export const FloatingIcons = memo(function FloatingIcons({
  color = DEFAULT_COLOR,
}: FloatingIconsProps) {
  const icons = [
    <path key="shield" d={SECURITY_ICONS.shield} />,
    <path key="lock" d={SECURITY_ICONS.lock} />,
    <path key="key" d={SECURITY_ICONS.key} />,
    <path key="fingerprint" d={SECURITY_ICONS.fingerprint} />,
  ];

  if (prefersReducedMotion()) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {icons.map((icon, i) => (
        <motion.svg
          key={i}
          className="absolute"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            left: `${15 + i * 20}%`,
            top: `${20 + (i % 3) * 25}%`,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        >
          {icon}
        </motion.svg>
      ))}
    </div>
  );
});

export default FloatingIcons;

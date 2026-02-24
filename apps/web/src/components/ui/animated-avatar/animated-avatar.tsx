/**
 * AnimatedAvatar component
 * @module components/ui/animated-avatar
 */

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { AnimatedAvatarProps } from './types';
import { SIZE_CONFIG, STATUS_COLORS } from './constants';
import { useAvatarStyle } from './store';
import {
  getShapeStyles,
  getBorderGradient,
  getAnimationProps,
  getParticleEmoji,
} from './animations';
import { tweens, loop, springs } from '@/lib/animation-presets';

export default function AnimatedAvatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  customStyle,
  className = '',
  onClick,
  showStatus = false,
  statusType = 'offline',
  level,
  isPremium,
  isVerified,
  title,
}: AnimatedAvatarProps) {
  const { style: globalStyle } = useAvatarStyle();
  const style = useMemo(
    () => (customStyle ? { ...globalStyle, ...customStyle } : globalStyle),
    [globalStyle, customStyle]
  );

  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>(
    []
  );

  // Generate particles for effects
  useEffect(() => {
    if (style.particleEffect !== 'none') {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);
    }
  }, [style.particleEffect]);

  const shapeClass = getShapeStyles(style.shape);
  const borderGradient = getBorderGradient(style);
  const animationProps = getAnimationProps(style);
  const config = SIZE_CONFIG[size];
  const particleEmojis = getParticleEmoji(style.particleEffect);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Particle Effects */}
      <AnimatePresence>
        {style.particleEffect !== 'none' &&
          particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="pointer-events-none absolute z-20 text-xs"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 30],
                y: [0, -20 - Math.random() * 20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeOut',
              }}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
            >
              {particleEmojis[Math.floor(Math.random() * particleEmojis.length)]}
            </motion.span>
          ))}
      </AnimatePresence>

      {/* Main Avatar Container */}
      <motion.div
        className={`${config.container} ${shapeClass} relative overflow-visible`}
        style={{
          background: borderGradient,
          padding: style.borderStyle !== 'none' ? `${style.borderWidth}px` : 0,
        }}
        {...animationProps}
        onClick={onClick}
        whileHover={style.pulseOnHover || onClick ? { scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        {/* Inner Avatar */}
        <div className={`h-full w-full ${shapeClass} relative overflow-hidden bg-dark-800`}>
          {src ? (
            <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
              <span className="font-bold text-white" style={{ fontSize: config.text }}>
                {fallbackText || (alt ? alt.charAt(0).toUpperCase() : '?')}
              </span>
            </div>
          )}

          {/* Premium/Verified Badge Overlay */}
          {(isPremium || isVerified) && (
            <div className="absolute right-0 top-0 -translate-y-1 translate-x-1 transform">
              {isPremium && (
                <motion.div
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={loop(tweens.ambient)}
                >
                  <span className="text-[8px]">👑</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Level Badge */}
      {(style.showLevel || level) && level !== undefined && (
        <motion.div
          className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 transform rounded-full px-1.5 py-0.5 font-bold text-white"
          style={{
            fontSize: config.levelSize,
            background:
              style.levelBadgeStyle === 'ornate'
                ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                : style.levelBadgeStyle === 'cyber'
                  ? 'linear-gradient(135deg, #00ff00, #00ffff)'
                  : 'linear-gradient(135deg, #10b981, #8b5cf6)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {level}
        </motion.div>
      )}

      {/* Status Indicator */}
      {showStatus && (
        <AnimatePresence mode="wait">
          <motion.div
            key={statusType}
            className={`absolute bottom-0 right-0 ${config.badge} rounded-full ${STATUS_COLORS[statusType].bg} z-10 border-2 border-dark-900`}
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              boxShadow:
                statusType === 'online'
                  ? [`0 0 0 0 ${STATUS_COLORS[statusType].glow}`, `0 0 6px 2px ${STATUS_COLORS[statusType].glow}`, `0 0 0 0 ${STATUS_COLORS[statusType].glow}`]
                  : `0 0 0 0 transparent`,
            }}
            exit={{ scale: 0 }}
            transition={{
              scale: springs.superBouncy,
              boxShadow: statusType === 'online'
                ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.2 },
            }}
          />
        </AnimatePresence>
      )}

      {/* Title Display */}
      {title && (
        <motion.div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 transform whitespace-nowrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${title.color}40, ${title.color}20)`,
              color: title.color,
              textShadow: `0 0 8px ${title.color}60`,
            }}
          >
            {title.name}
          </span>
        </motion.div>
      )}
    </div>
  );
}

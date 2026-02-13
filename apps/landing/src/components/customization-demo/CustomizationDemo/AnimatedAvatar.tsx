/**
 * AnimatedAvatar Component
 *
 * Displays avatar with various animated border effects.
 *
 * @module components/landing/CustomizationDemo/AnimatedAvatar
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AnimatedAvatarProps } from './types';
import { themeColors } from './constants';

export const AnimatedAvatar = memo(function AnimatedAvatar({
  borderType,
  borderColor,
  speedMultiplier,
}: AnimatedAvatarProps) {
  const colors = themeColors[borderColor];
  const avatarSize = 64; // Fixed medium size
  const borderWidth = 3;

  const renderBorderEffect = () => {
    switch (borderType) {
      case 'none':
        return null;

      case 'static':
        return (
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: `${borderWidth}px solid ${colors.primary}` }}
          />
        );

      case 'glow':
        return (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `${borderWidth}px solid ${colors.primary}`,
              boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
            }}
            animate={{
              boxShadow: [
                `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
                `0 0 25px ${colors.glow}, 0 0 50px ${colors.glow}`,
                `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
              ],
            }}
            transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
          />
        );

      case 'pulse':
        return (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
              animate={{
                scale: [1, 1.3, 1.3],
                opacity: [0.8, 0, 0],
              }}
              transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.secondary}` }}
              animate={{
                scale: [1, 1.5, 1.5],
                opacity: [0.6, 0, 0],
              }}
              transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity, delay: 0.3 }}
            />
          </>
        );

      case 'rotate': // Orbit
        return (
          <>
            <motion.div
              className="absolute inset-[-4px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, transparent, ${colors.primary})`,
                padding: borderWidth,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            {/* Orbiting dots */}
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                style={{
                  background: i === 0 ? colors.primary : '#fff',
                  color: colors.glow,
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 3 * speedMultiplier,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.5,
                }}
              >
                <div
                  className="absolute h-full w-full rounded-full"
                  style={{ transform: `translate(${avatarSize / 2 + 4}px, 0)` }}
                />
              </motion.div>
            ))}
          </>
        );

      case 'fire': // Inferno
        return (
          <>
            {/* Base ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
              animate={{
                boxShadow: [
                  `0 0 10px ${colors.glow}`,
                  `0 0 20px ${colors.glow}`,
                  `0 0 10px ${colors.glow}`,
                ],
              }}
              transition={{ duration: 1.5 * speedMultiplier, repeat: Infinity }}
            />
            {/* Rising flames (particles) */}
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute bottom-0 w-2 rounded-full blur-[2px]"
                style={{
                  background:
                    i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : '#fbbf24', // yellow-400
                  height: Math.random() * 10 + 10,
                  left: `${(i / 16) * 100}%`,
                  transformOrigin: 'bottom center',
                }}
                animate={{
                  y: [0, -20 - Math.random() * 15],
                  scaleY: [1, 1.5, 0.5],
                  scaleX: [1, 0.5, 0],
                  opacity: [0.8, 1, 0],
                }}
                transition={{
                  duration: (0.8 + Math.random() * 0.5) * speedMultiplier,
                  repeat: Infinity,
                  delay: Math.random() * 1,
                  ease: 'easeOut',
                }}
              />
            ))}
            {/* Inner heat */}
            <motion.div
              className="absolute inset-0 rounded-full opacity-30 blur-md"
              style={{ background: `radial-gradient(circle, ${colors.primary}, transparent 70%)` }}
              animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
            />
          </>
        );

      case 'ice': // Frost
        return (
          <>
            {/* Icy Glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `${borderWidth}px solid ${colors.primary}`,
                boxShadow: `0 0 20px ${colors.glow}`,
              }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
            />
            {/* Rotating Crystal Shards */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute border border-white/40 bg-white/10 backdrop-blur-[1px]"
                style={{
                  width: 12, // Shard size
                  height: 12,
                  left: '50%',
                  top: '50%',
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond shape
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [0.8, 1.2, 0.8],
                  x: [
                    Math.cos((i / 6) * Math.PI * 2) * (avatarSize / 2 + 8),
                    Math.cos((i / 6) * Math.PI * 2 + Math.PI / 6) * (avatarSize / 2 + 12),
                    Math.cos((i / 6) * Math.PI * 2) * (avatarSize / 2 + 8),
                  ],
                  y: [
                    Math.sin((i / 6) * Math.PI * 2) * (avatarSize / 2 + 8),
                    Math.sin((i / 6) * Math.PI * 2 + Math.PI / 6) * (avatarSize / 2 + 12),
                    Math.sin((i / 6) * Math.PI * 2) * (avatarSize / 2 + 8),
                  ],
                }}
                transition={{
                  duration: (3 + Math.random()) * speedMultiplier,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  // delay: i * 0.2
                }}
              />
            ))}
            {/* Sparkles */}
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute rounded-full bg-white blur-[1px]"
                style={{ width: 3, height: 3, left: '50%', top: '50%' }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: Math.cos((i / 4) * Math.PI * 2) * (avatarSize / 2 + 5),
                  y: Math.sin((i / 4) * Math.PI * 2) * (avatarSize / 2 + 5),
                }}
                transition={{
                  duration: 1.5 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              />
            ))}
          </>
        );

      case 'electric': // Storm
        return (
          <>
            {/* Base pulsating ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
              animate={{
                boxShadow: [
                  `0 0 5px ${colors.glow}`,
                  `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
                  `0 0 5px ${colors.glow}`,
                ],
                borderColor: [colors.primary, '#fff', colors.primary],
              }}
              transition={{
                duration: 0.2 * speedMultiplier,
                repeat: Infinity,
                repeatDelay: 1 + Math.random(),
              }}
            />
            {/* Lightning Arcs (SVG) */}
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.svg
                key={i}
                className="pointer-events-none absolute"
                width={avatarSize + 40}
                height={avatarSize + 40}
                viewBox="0 0 100 100" // Abstract
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 90}deg)`,
                }}
              >
                <motion.path
                  d={`M50,10 Q${60 + Math.random() * 20},30 50,50`} // Simple arc towards center
                  fill="none"
                  stroke={colors.secondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1, 1, 1],
                    opacity: [0, 1, 0.5, 0],
                    strokeWidth: [2, 4, 1],
                  }}
                  transition={{
                    duration: 0.3 * speedMultiplier,
                    repeat: Infinity,
                    repeatDelay: 0.5 + Math.random() * 2,
                    delay: Math.random(),
                  }}
                />
                <motion.path
                  d={`M50,10 L${45 + Math.random() * 10},30 L50,50`} // Zigzag bolt
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 0.1 * speedMultiplier,
                    repeat: Infinity,
                    repeatDelay: 2 + Math.random() * 3,
                    delay: Math.random() + 1,
                  }}
                />
              </motion.svg>
            ))}
          </>
        );

      case 'legendary':
        return (
          <>
            {/* Rotating multi-color gradient ring */}
            <motion.div
              className="absolute inset-[-6px] rounded-full opacity-70 blur-[2px]"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, #fbbf24, ${colors.primary})`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-[-4px] rounded-full bg-gray-900" // Mask center
            />

            {/* Pulsing Aura */}
            <motion.div
              className="absolute inset-[-2px] rounded-full border border-white/20"
              style={{
                boxShadow: `0 0 20px ${colors.glow}, inset 0 0 10px ${colors.glow}`,
              }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
            />

            {/* Orbiting Runes/Particles */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-full w-full"
                style={{ top: 0, left: 0 }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: (6 + i * 2) * speedMultiplier,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i,
                }}
              >
                <motion.div
                  className="absolute rounded-full bg-white shadow-[0_0_10px_currentColor]"
                  style={{
                    width: 4,
                    height: 4,
                    top: 0,
                    left: '50%',
                    color: colors.secondary,
                    transform: 'translate(-50%, -10px)', // Orbit radius
                  }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.div>
            ))}
          </>
        );

      case 'mythic':
        return (
          <>
            {/* Reality distortion (Void) */}
            <motion.div
              className="absolute inset-[-10px] rounded-full opacity-50 blur-md"
              style={{
                background: `radial-gradient(circle, ${colors.glow}, transparent 60%)`,
              }}
              animate={{
                scale: [1, 1.3, 0.9, 1.1, 1],
                opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
              }}
              transition={{
                duration: 4 * speedMultiplier,
                repeat: Infinity,
                times: [0, 0.2, 0.5, 0.8, 1],
              }}
            />

            {/* Glitch Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-[-4px] rounded-full border border-white/30"
                style={{
                  borderColor: i === 0 ? colors.primary : i === 1 ? colors.secondary : '#fff',
                }}
                animate={{
                  rotate: [0, i % 2 === 0 ? 360 : -360],
                  scale: [1, 1.05 + i * 0.02, 1],
                  x: [0, (Math.random() - 0.5) * 4, 0], // Jitter
                  y: [0, (Math.random() - 0.5) * 4, 0],
                }}
                transition={{
                  rotate: { duration: (5 + i) * speedMultiplier, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2 * speedMultiplier, repeat: Infinity },
                  x: {
                    duration: 0.2,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    repeatDelay: Math.random() * 2,
                  },
                  y: {
                    duration: 0.2,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    repeatDelay: Math.random() * 2,
                  },
                }}
              />
            ))}

            {/* Dark Core Shadow */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_#000]" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: avatarSize + 24, height: avatarSize + 24 }}
    >
      {/* Border effects layer */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: avatarSize,
          height: avatarSize,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {renderBorderEffect()}
      </div>

      {/* Avatar image */}
      <div
        className="relative z-10 flex items-center justify-center rounded-full border border-white/5 bg-gradient-to-br from-gray-700 to-gray-800"
        style={{ width: avatarSize - 4, height: avatarSize - 4, overflow: 'hidden' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
        <span className="relative z-10 text-xl font-bold text-white">CG</span>
      </div>
    </div>
  );
});

export default AnimatedAvatar;

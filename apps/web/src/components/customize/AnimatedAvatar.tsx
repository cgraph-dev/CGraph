/**
 * Animated Avatar Component
 *
 * Renders avatar with various animated border effects.
 * Ported from CustomizationDemo with scalability optimizations.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { AvatarBorderType, ThemePreset } from '@/stores/customizationStoreV2';
import { themeColors } from '@/stores/customizationStoreV2';

interface AnimatedAvatarProps {
  borderType: AvatarBorderType;
  borderColor: ThemePreset;
  size: 'small' | 'medium' | 'large' | number;
  speedMultiplier?: number;
  src?: string;
  initials?: string;
}

const sizeMap = { small: 48, medium: 64, large: 80 };

export type BorderType = AvatarBorderType;

export const AnimatedAvatar = memo(function AnimatedAvatar({
  borderType,
  borderColor,
  size,
  speedMultiplier = 1,
  src,
  initials = 'CG',
}: AnimatedAvatarProps) {
  const colors = themeColors[borderColor];
  const avatarSize = typeof size === 'number' ? size : sizeMap[size];
  const effectiveSize =
    typeof size === 'number' ? (size <= 48 ? 'small' : size <= 64 ? 'medium' : 'large') : size;
  const borderWidth = effectiveSize === 'small' ? 2 : effectiveSize === 'medium' ? 3 : 4;

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

      case 'rotate':
        return (
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
        );

      case 'fire':
        return (
          <>
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
            />
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  width: 6,
                  height: 12,
                  background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary}, transparent)`,
                  borderRadius: '50%',
                  left: '50%',
                  top: '50%',
                  transformOrigin: `0 ${avatarSize / 2 + 4}px`,
                  rotate: `${i * 30}deg`,
                }}
                animate={{
                  scaleY: [0.5, 1.2, 0.5],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 0.4 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.05,
                }}
              />
            ))}
          </>
        );

      case 'ice':
        return (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                border: `${borderWidth}px solid ${colors.primary}`,
                boxShadow: `0 0 20px ${colors.glow}`,
              }}
            />
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-2 w-2"
                style={{
                  background: colors.secondary,
                  borderRadius: '2px',
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, Math.cos((i / 8) * Math.PI * 2) * (avatarSize / 2 + 10)],
                  y: [0, Math.sin((i / 8) * Math.PI * 2) * (avatarSize / 2 + 10)],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180],
                }}
                transition={{
                  duration: 2 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        );

      case 'electric':
        return (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `${borderWidth}px solid ${colors.primary}` }}
              animate={{
                boxShadow: [
                  `0 0 10px ${colors.glow}`,
                  `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
                  `0 0 10px ${colors.glow}`,
                ],
              }}
              transition={{ duration: 0.15 * speedMultiplier, repeat: Infinity, repeatDelay: 0.5 }}
            />
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.svg
                key={i}
                className="absolute"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 60}deg) translateY(-${avatarSize / 2 + 8}px)`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.3 * speedMultiplier,
                  repeat: Infinity,
                  repeatDelay: 1 + Math.random(),
                  delay: i * 0.2,
                }}
              >
                <path
                  d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
                  fill={colors.primary}
                />
              </motion.svg>
            ))}
          </>
        );

      case 'legendary':
        return (
          <>
            {/* Inner glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, transparent 60%, ${colors.glow} 100%)`,
              }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2 * speedMultiplier, repeat: Infinity }}
            />
            {/* Rotating outer ring */}
            <motion.div
              className="absolute inset-[-6px] rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, #fff, ${colors.primary})`,
                padding: borderWidth + 2,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            {/* Particle ring */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? colors.primary : colors.secondary,
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 6px ${colors.glow}`,
                }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * (avatarSize / 2 + 12),
                  y: Math.sin((i / 8) * Math.PI * 2) * (avatarSize / 2 + 12),
                  scale: [1, 1.5, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 1 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        );

      case 'mythic':
        return (
          <>
            {/* Void background */}
            <motion.div
              className="absolute inset-[-8px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3 * speedMultiplier, repeat: Infinity }}
            />
            {/* Multi-layer rotating rings */}
            <motion.div
              className="absolute inset-[-6px] rounded-full opacity-60"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, transparent, ${colors.secondary}, transparent, ${colors.primary})`,
                padding: borderWidth,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            <motion.div
              className="absolute inset-[-4px] rounded-full"
              style={{
                background: `conic-gradient(from 180deg, ${colors.secondary}, transparent, ${colors.primary}, transparent, ${colors.secondary})`,
                padding: borderWidth,
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 4 * speedMultiplier, repeat: Infinity, ease: 'linear' }}
            >
              <div className="h-full w-full rounded-full bg-gray-900" />
            </motion.div>
            {/* Orbiting particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full"
                style={{
                  background:
                    i % 3 === 0 ? '#fff' : i % 3 === 1 ? colors.primary : colors.secondary,
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 8px ${colors.glow}`,
                }}
                animate={{
                  x: [
                    Math.cos((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.cos(((i + 6) / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.cos((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                  ],
                  y: [
                    Math.sin((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.sin(((i + 6) / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                    Math.sin((i / 12) * Math.PI * 2) * (avatarSize / 2 + 15),
                  ],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 4 * speedMultiplier,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
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
        className="absolute"
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
        className="relative z-10 flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-700 to-gray-800"
        style={{ width: avatarSize - 4, height: avatarSize - 4 }}
      >
        {src ? (
          <img src={src} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-white">{initials}</span>
        )}
      </div>
    </div>
  );
});

export default AnimatedAvatar;

/**
 * ThemedBorderCard Component
 *
 * Border preview card with animated borders, corner brackets,
 * rarity badges, and lock indicators.
 *
 * @version 2.0.0 - Added all 21 animation types from borderCollections
 */

import { motion, type Transition } from 'framer-motion';
import { LockClosedIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { type BorderDefinition, RARITY_COLORS } from '@/data/borderCollections';

interface ThemedBorderCardProps {
  border: BorderDefinition;
  isSelected: boolean;
  onSelect: () => void;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowPreview?: boolean;
}

const sizeConfig = {
  sm: {
    container: 'w-20 h-20',
    avatar: 'w-12 h-12',
    text: 'text-[10px]',
    badge: 'text-[8px] px-1',
  },
  md: { container: 'w-28 h-28', avatar: 'w-16 h-16', text: 'text-xs', badge: 'text-[10px] px-1.5' },
  lg: { container: 'w-36 h-36', avatar: 'w-20 h-20', text: 'text-sm', badge: 'text-xs px-2' },
};

// Helper to create typed transitions
const createTransition = (
  duration: number,
  repeat: number,
  ease: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' = 'easeInOut',
  repeatDelay?: number
): Transition => ({
  duration,
  repeat,
  ease,
  ...(repeatDelay !== undefined && { repeatDelay }),
});

export default function ThemedBorderCard({
  border,
  isSelected,
  onSelect,
  showAnimation = true,
  size = 'md',
  allowPreview = true,
}: ThemedBorderCardProps) {
  const config = sizeConfig[size];
  const rarityColor = RARITY_COLORS[border.rarity];
  const isLocked = !border.unlocked && !allowPreview;
  const canInteract = !isLocked;

  // Get border animation styles - supports all 21 animation types
  const getBorderAnimation = () => {
    if (!showAnimation) return {};

    switch (border.animationType) {
      case 'none':
        return {};

      case 'pulse':
        return {
          animate: {
            boxShadow: [
              `0 0 10px ${border.colors[0]}40`,
              `0 0 25px ${border.colors[0]}80`,
              `0 0 10px ${border.colors[0]}40`,
            ],
          },
          transition: createTransition(2, Infinity, 'easeInOut'),
        };

      case 'glow':
        return {
          animate: {
            boxShadow: [
              `0 0 15px ${border.colors[0]}60`,
              `0 0 30px ${border.colors[0]}80`,
              `0 0 15px ${border.colors[0]}60`,
            ],
          },
          transition: createTransition(3, Infinity, 'easeInOut'),
        };

      case 'rotate':
        return {
          animate: { rotate: 360 },
          transition: createTransition(8, Infinity, 'linear'),
        };

      case 'shimmer':
        return {
          animate: {
            opacity: [0.7, 1, 0.7],
            scale: [0.98, 1, 0.98],
          },
          transition: createTransition(2.5, Infinity, 'easeInOut'),
        };

      case 'rainbow':
        return {
          animate: {
            background: [
              `linear-gradient(0deg, ${border.colors.join(', ')})`,
              `linear-gradient(90deg, ${border.colors.join(', ')})`,
              `linear-gradient(180deg, ${border.colors.join(', ')})`,
              `linear-gradient(270deg, ${border.colors.join(', ')})`,
              `linear-gradient(360deg, ${border.colors.join(', ')})`,
            ],
          },
          transition: createTransition(5, Infinity, 'linear'),
        };

      case 'fire':
        return {
          animate: {
            boxShadow: [
              `0 -5px 15px ${border.colors[0]}80, 0 0 20px ${border.colors[1] || border.colors[0]}60`,
              `0 -10px 25px ${border.colors[0]}90, 0 0 30px ${border.colors[1] || border.colors[0]}70`,
              `0 -5px 15px ${border.colors[0]}80, 0 0 20px ${border.colors[1] || border.colors[0]}60`,
            ],
            y: [0, -2, 0],
          },
          transition: createTransition(0.5, Infinity, 'easeInOut'),
        };

      case 'ice':
        return {
          animate: {
            boxShadow: [
              `0 0 15px ${border.colors[0]}60, inset 0 0 10px ${border.colors[1] || border.colors[0]}30`,
              `0 0 25px ${border.colors[0]}80, inset 0 0 15px ${border.colors[1] || border.colors[0]}40`,
              `0 0 15px ${border.colors[0]}60, inset 0 0 10px ${border.colors[1] || border.colors[0]}30`,
            ],
          },
          transition: createTransition(3, Infinity, 'easeInOut'),
        };

      case 'electric':
        return {
          animate: {
            boxShadow: [
              `0 0 5px ${border.colors[0]}`,
              `0 0 20px ${border.colors[0]}, 0 0 40px ${border.colors[1] || border.colors[0]}`,
              `0 0 5px ${border.colors[0]}`,
            ],
          },
          transition: createTransition(0.1, Infinity, 'linear', 0.5),
        };

      case 'void':
        return {
          animate: {
            boxShadow: [
              `inset 0 0 20px ${border.colors[0]}80`,
              `inset 0 0 40px ${border.colors[1] || border.colors[0]}60`,
              `inset 0 0 20px ${border.colors[0]}80`,
            ],
          },
          transition: createTransition(4, Infinity, 'easeInOut'),
        };

      case 'aurora':
        return {
          animate: {
            background: [
              `linear-gradient(45deg, ${border.colors.join(', ')})`,
              `linear-gradient(135deg, ${border.colors.join(', ')})`,
              `linear-gradient(225deg, ${border.colors.join(', ')})`,
              `linear-gradient(315deg, ${border.colors.join(', ')})`,
              `linear-gradient(405deg, ${border.colors.join(', ')})`,
            ],
          },
          transition: createTransition(6, Infinity, 'easeInOut'),
        };

      case 'galaxy':
        return {
          animate: {
            background: [
              `radial-gradient(circle at 30% 30%, ${border.colors[0]}, transparent 50%), radial-gradient(circle at 70% 70%, ${border.colors[1] || border.colors[0]}, transparent 50%)`,
              `radial-gradient(circle at 70% 30%, ${border.colors[0]}, transparent 50%), radial-gradient(circle at 30% 70%, ${border.colors[1] || border.colors[0]}, transparent 50%)`,
              `radial-gradient(circle at 30% 30%, ${border.colors[0]}, transparent 50%), radial-gradient(circle at 70% 70%, ${border.colors[1] || border.colors[0]}, transparent 50%)`,
            ],
            rotate: [0, 180, 360],
          },
          transition: createTransition(10, Infinity, 'linear'),
        };

      case 'holographic':
        return {
          animate: {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)'],
          },
          transition: createTransition(3, Infinity, 'linear'),
        };

      // ==================== NEW ANIMATIONS ====================

      case 'pixel-pulse':
        return {
          animate: {
            boxShadow: [
              `0 0 0 2px ${border.colors[0]}, 0 0 0 4px transparent`,
              `0 0 0 4px ${border.colors[0]}, 0 0 0 8px ${border.colors[1] || border.colors[0]}40`,
              `0 0 0 2px ${border.colors[0]}, 0 0 0 4px transparent`,
            ],
            scale: [1, 1.02, 1],
          },
          transition: createTransition(1.5, Infinity, 'easeInOut'),
        };

      case 'scan-line':
        return {
          animate: {
            backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'],
          },
          style: {
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${border.colors[0]}20 2px, ${border.colors[0]}20 4px)`,
            backgroundSize: '100% 200%',
          },
          transition: createTransition(2, Infinity, 'linear'),
        };

      case 'glitch':
        return {
          animate: {
            x: [0, -2, 2, -1, 1, 0],
            y: [0, 1, -1, 0.5, -0.5, 0],
            filter: [
              'none',
              `drop-shadow(2px 0 ${border.colors[0]}) drop-shadow(-2px 0 ${border.colors[1] || '#00ffff'})`,
              'none',
              `drop-shadow(-2px 0 ${border.colors[0]}) drop-shadow(2px 0 ${border.colors[2] || '#ff00ff'})`,
              'none',
            ],
          },
          transition: createTransition(0.5, Infinity, 'linear', 2),
        };

      case 'sakura-fall':
        return {
          animate: {
            boxShadow: [
              `0 -5px 15px ${border.colors[0]}60, 5px 0 15px ${border.colors[1] || border.colors[0]}40`,
              `5px 5px 15px ${border.colors[0]}40, -5px 5px 15px ${border.colors[1] || border.colors[0]}60`,
              `0 -5px 15px ${border.colors[0]}60, 5px 0 15px ${border.colors[1] || border.colors[0]}40`,
            ],
            rotate: [0, 5, -5, 0],
          },
          transition: createTransition(4, Infinity, 'easeInOut'),
        };

      case 'wave':
        return {
          animate: {
            boxShadow: [
              `0 5px 20px ${border.colors[0]}70`,
              `0 -5px 20px ${border.colors[1] || border.colors[0]}70`,
              `0 5px 20px ${border.colors[0]}70`,
            ],
            scaleY: [1, 1.02, 1, 0.98, 1],
          },
          transition: createTransition(3, Infinity, 'easeInOut'),
        };

      case 'energy-surge':
        return {
          animate: {
            boxShadow: [
              `0 0 10px ${border.colors[0]}40, 0 0 20px ${border.colors[1] || border.colors[0]}20`,
              `0 0 30px ${border.colors[0]}80, 0 0 60px ${border.colors[1] || border.colors[0]}40, 0 0 100px ${border.colors[2] || border.colors[0]}20`,
              `0 0 10px ${border.colors[0]}40, 0 0 20px ${border.colors[1] || border.colors[0]}20`,
            ],
            scale: [1, 1.05, 1],
          },
          transition: createTransition(2, Infinity, 'easeInOut'),
        };

      case 'smoke':
        return {
          animate: {
            opacity: [0.6, 0.9, 0.6],
            filter: [
              `blur(0px) drop-shadow(0 0 10px ${border.colors[0]}60)`,
              `blur(1px) drop-shadow(0 0 20px ${border.colors[0]}80)`,
              `blur(0px) drop-shadow(0 0 10px ${border.colors[0]}60)`,
            ],
          },
          transition: createTransition(4, Infinity, 'easeInOut'),
        };

      case 'neon-flicker':
        return {
          animate: {
            opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1],
            boxShadow: [
              `0 0 20px ${border.colors[0]}, 0 0 40px ${border.colors[0]}80`,
              `0 0 10px ${border.colors[0]}60, 0 0 20px ${border.colors[0]}40`,
              `0 0 25px ${border.colors[0]}, 0 0 50px ${border.colors[0]}90`,
              `0 0 15px ${border.colors[0]}80, 0 0 30px ${border.colors[0]}60`,
              `0 0 20px ${border.colors[0]}, 0 0 40px ${border.colors[0]}80`,
            ],
          },
          transition: createTransition(2, Infinity, 'linear'),
        };

      default:
        return {};
    }
  };

  const borderAnimation = getBorderAnimation();

  return (
    <motion.button
      onClick={() => canInteract && onSelect()}
      className={`relative ${config.container} group flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all duration-200 ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${isSelected ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/30'} border border-white/10 bg-dark-800/80`}
      whileHover={canInteract ? { scale: 1.05, y: -2 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
    >
      {/* Corner brackets for selection */}
      {isSelected && (
        <>
          <motion.div
            className="absolute left-0 top-0 h-3 w-3 rounded-tl-lg border-l-2 border-t-2"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          />
          <motion.div
            className="absolute right-0 top-0 h-3 w-3 rounded-tr-lg border-r-2 border-t-2"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 h-3 w-3 rounded-bl-lg border-b-2 border-l-2"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 h-3 w-3 rounded-br-lg border-b-2 border-r-2"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          />
        </>
      )}

      {/* Avatar preview with animated border */}
      <motion.div
        className={`${config.avatar} relative overflow-visible rounded-full`}
        style={{
          background: `linear-gradient(135deg, ${border.colors.join(', ')})`,
          padding: '3px',
        }}
        {...borderAnimation}
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-dark-900">
          <span className="text-2xl">👤</span>
        </div>

        {/* Particle effects for special borders */}
        {showAnimation &&
          ['fire', 'electric', 'legendary', 'mythic'].includes(border.animationType) && (
            <div className="pointer-events-none absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 rounded-full"
                  style={{
                    backgroundColor: border.colors[i % border.colors.length],
                    left: `${50 + Math.cos((i * Math.PI * 2) / 6) * 50}%`,
                    top: `${50 + Math.sin((i * Math.PI * 2) / 6) * 50}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          )}
      </motion.div>

      {/* Border name */}
      <span className={`${config.text} w-full truncate text-center font-medium text-gray-300`}>
        {border.name}
      </span>

      {/* Rarity badge */}
      <div
        className={` ${config.badge} rounded-full py-0.5 font-semibold uppercase tracking-wider ${rarityColor.bg} ${rarityColor.text} `}
      >
        {border.rarity}
      </div>

      {/* Lock overlay */}
      {!border.unlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 backdrop-blur-[1px]">
          <LockClosedIcon className="mb-1 h-6 w-6 text-white/70" />
          {border.unlockRequirement && (
            <span className="px-2 text-center text-[9px] leading-tight text-white/60">
              {border.unlockRequirement}
            </span>
          )}
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && border.unlocked && (
        <motion.div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: border.colors[0] }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckIcon className="h-3 w-3 text-white" />
        </motion.div>
      )}

      {/* Premium indicator */}
      {border.isPremium && border.unlocked && (
        <motion.div
          className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <SparklesIcon className="h-3 w-3 text-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

/**
 * Grid container for border cards
 */
export function BorderCardGrid({
  children,
  columns = 4,
  className = '',
}: {
  children: React.ReactNode;
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}) {
  const colClasses = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  return <div className={`grid ${colClasses[columns]} gap-3 ${className}`}>{children}</div>;
}

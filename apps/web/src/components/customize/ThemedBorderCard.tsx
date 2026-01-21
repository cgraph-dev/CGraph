/**
 * ThemedBorderCard Component
 * 
 * Border preview card with animated borders, corner brackets,
 * rarity badges, and lock indicators.
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
  sm: { container: 'w-20 h-20', avatar: 'w-12 h-12', text: 'text-[10px]', badge: 'text-[8px] px-1' },
  md: { container: 'w-28 h-28', avatar: 'w-16 h-16', text: 'text-xs', badge: 'text-[10px] px-1.5' },
  lg: { container: 'w-36 h-36', avatar: 'w-20 h-20', text: 'text-sm', badge: 'text-xs px-2' },
};

// Helper to create typed transitions
const createTransition = (duration: number, repeat: number, ease: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' = 'easeInOut', repeatDelay?: number): Transition => ({
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

  // Get border animation styles
  const getBorderAnimation = () => {
    if (!showAnimation) return {};
    
    switch (border.animationType) {
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
      case 'holographic':
        return {
          animate: {
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          },
          transition: createTransition(3, Infinity, 'linear'),
        };
      default:
        return {};
    }
  };

  const borderAnimation = getBorderAnimation();

  return (
    <motion.button
      onClick={() => canInteract && onSelect()}
      className={`
        relative ${config.container} rounded-xl p-2
        flex flex-col items-center justify-center gap-1
        transition-all duration-200 group
        ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
        ${isSelected ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/30'}
        bg-dark-800/80 border border-white/10
      `}
      whileHover={canInteract ? { scale: 1.05, y: -2 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
    >
      {/* Corner brackets for selection */}
      {isSelected && (
        <>
          <motion.div
            className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          />
          <motion.div
            className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg"
            style={{ borderColor: border.colors[0] }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          />
        </>
      )}

      {/* Avatar preview with animated border */}
      <motion.div
        className={`${config.avatar} rounded-full relative overflow-visible`}
        style={{
          background: `linear-gradient(135deg, ${border.colors.join(', ')})`,
          padding: '3px',
        }}
        {...borderAnimation}
      >
        <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center overflow-hidden">
          <span className="text-2xl">👤</span>
        </div>

        {/* Particle effects for special borders */}
        {showAnimation && ['fire', 'electric', 'legendary', 'mythic'].includes(border.animationType) && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
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
      <span className={`${config.text} text-gray-300 font-medium truncate w-full text-center`}>
        {border.name}
      </span>

      {/* Rarity badge */}
      <div
        className={`
          ${config.badge} py-0.5 rounded-full font-semibold uppercase tracking-wider
          ${rarityColor.bg} ${rarityColor.text}
        `}
      >
        {border.rarity}
      </div>

      {/* Lock overlay */}
      {!border.unlocked && (
        <div className="absolute inset-0 rounded-xl bg-black/50 flex flex-col items-center justify-center backdrop-blur-[1px]">
          <LockClosedIcon className="w-6 h-6 text-white/70 mb-1" />
          {border.unlockRequirement && (
            <span className="text-[9px] text-white/60 text-center px-2 leading-tight">
              {border.unlockRequirement}
            </span>
          )}
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && border.unlocked && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: border.colors[0] }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckIcon className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Premium indicator */}
      {border.isPremium && border.unlocked && (
        <motion.div
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <SparklesIcon className="w-3 h-3 text-white" />
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

  return (
    <div className={`grid ${colClasses[columns]} gap-3 ${className}`}>
      {children}
    </div>
  );
}

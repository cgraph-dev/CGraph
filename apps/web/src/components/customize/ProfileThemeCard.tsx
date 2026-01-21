/**
 * ProfileThemeCard Component
 * 
 * Profile theme preview card with animated backgrounds,
 * particles, tier badges, and holographic shine effects.
 */

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { LockClosedIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useState, useRef, useEffect } from 'react';
import { 
  type ProfileThemeConfig, 
  TIER_COLORS,
  BACKGROUND_ANIMATIONS,
  PARTICLE_CONFIGS,
} from '@/data/profileThemes';

interface ProfileThemeCardProps {
  theme: ProfileThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
  allowPreview?: boolean;
  showParticles?: boolean;
}

export default function ProfileThemeCard({
  theme,
  isSelected,
  onSelect,
  allowPreview = true,
  showParticles = true,
}: ProfileThemeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tierColor = TIER_COLORS[theme.tier];
  const isLocked = !theme.unlocked && !allowPreview;
  const canInteract = !isLocked;

  // Holographic shine effect based on mouse position
  const shineX = useTransform(mouseX, [0, 1], ['-100%', '200%']);
  const shineY = useTransform(mouseY, [0, 1], ['-100%', '200%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Generate particles
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    color: string;
  }>>([]);

  useEffect(() => {
    if (!showParticles || theme.particleType === 'none') {
      setParticles([]);
      return;
    }

    const particleConfig = PARTICLE_CONFIGS[theme.particleType];
    const count = theme.particleCount || 10;
    const colors = theme.particleColors || ['#ffffff'];

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: particleConfig.size.min + Math.random() * (particleConfig.size.max - particleConfig.size.min),
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
      color: colors[i % colors.length] || '#ffffff',
    }));

    setParticles(newParticles);
  }, [theme.particleType, theme.particleCount, theme.particleColors, showParticles]);

  // Get background animation props
  const getBackgroundAnimation = () => {
    if (!theme.backgroundAnimation || theme.backgroundAnimation === 'none') {
      return {};
    }

    const animation = BACKGROUND_ANIMATIONS[theme.backgroundAnimation];
    return {
      animate: animation,
      transition: {
        duration: theme.backgroundAnimationDuration || 5,
        repeat: Infinity,
        ease: 'linear' as const,
      },
    };
  };

  // Get overlay styles
  const getOverlayStyles = (): React.CSSProperties => {
    switch (theme.overlayType) {
      case 'scanlines':
        return {
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,${theme.overlayOpacity || 0.1}) 2px,
            rgba(0,0,0,${theme.overlayOpacity || 0.1}) 4px
          )`,
        };
      case 'holographic':
        return {
          background: `linear-gradient(
            135deg,
            rgba(255,0,255,${theme.overlayOpacity || 0.1}),
            rgba(0,255,255,${theme.overlayOpacity || 0.1}),
            rgba(255,255,0,${theme.overlayOpacity || 0.1})
          )`,
          mixBlendMode: 'overlay' as const,
        };
      case 'grid':
        return {
          backgroundImage: `
            linear-gradient(rgba(255,255,255,${theme.overlayOpacity || 0.05}) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,${theme.overlayOpacity || 0.05}) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        };
      case 'vignette':
        return {
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,${theme.overlayOpacity || 0.3}) 100%)`,
        };
      case 'noise':
        return {
          opacity: theme.overlayOpacity || 0.05,
          filter: 'url(#noise)',
        };
      case 'rays':
        return {
          background: `conic-gradient(from 0deg at 50% 50%, transparent, rgba(255,255,255,${theme.overlayOpacity || 0.1}), transparent)`,
        };
      default:
        return {};
    }
  };

  // Particle animation based on type
  const getParticleAnimation = (_particle: typeof particles[0]) => {
    const config = PARTICLE_CONFIGS[theme.particleType];
    const baseY = config.velocity.y.min < 0 ? -30 : 30;
    
    return {
      y: [0, baseY, 0],
      x: [0, (Math.random() - 0.5) * 20, 0],
      opacity: [config.opacity.min, config.opacity.max, config.opacity.min],
      scale: config.rotation ? [1, 1.2, 1] : undefined,
      rotate: config.rotation ? [0, 360] : undefined,
    };
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={() => canInteract && onSelect()}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={canInteract ? 0 : -1}
      onKeyDown={(e) => e.key === 'Enter' && canInteract && onSelect()}
      className={`
        relative w-full aspect-[3/4] rounded-2xl overflow-hidden
        transition-all duration-300 group
        ${canInteract ? 'cursor-pointer' : 'cursor-not-allowed'}
        ${isSelected ? 'ring-2 ring-white shadow-2xl' : 'hover:ring-1 hover:ring-white/30'}
      `}
      whileHover={canInteract ? { scale: 1.02, y: -4 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
      style={{
        boxShadow: isSelected && theme.glowEnabled
          ? `0 0 30px ${theme.glowColor}60`
          : undefined,
      }}
    >
      {/* Background gradient with animation */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`,
          backgroundSize: '400% 400%',
        }}
        {...getBackgroundAnimation()}
      />

      {/* Overlay effect */}
      {theme.overlayType !== 'none' && (
        <div className="absolute inset-0 pointer-events-none" style={getOverlayStyles()} />
      )}

      {/* Particles */}
      {showParticles && particles.length > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              animate={getParticleAnimation(particle)}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Glow effect */}
      {theme.glowEnabled && isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${theme.glowColor}30, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: theme.glowIntensity || 0.5 }}
        />
      )}

      {/* Holographic shine on hover */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              135deg,
              transparent 0%,
              rgba(255,255,255,0.1) 45%,
              rgba(255,255,255,0.3) 50%,
              rgba(255,255,255,0.1) 55%,
              transparent 100%
            )`,
            x: shineX,
            y: shineY,
          }}
        />
      )}

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Top: Tier badge */}
        <div className="flex justify-between items-start">
          <motion.div
            className={`
              px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
              ${tierColor.bg} ${tierColor.text} border ${tierColor.border}
            `}
            style={{
              boxShadow: `0 0 10px ${tierColor.glow}`,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {theme.tier}
          </motion.div>

          {/* Category icon */}
          <motion.div
            className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-lg"
            whileHover={{ scale: 1.1, rotate: 10 }}
          >
            {theme.category === '8bit' && '🎮'}
            {theme.category === 'japanese' && '🌸'}
            {theme.category === 'anime' && '⚡'}
            {theme.category === 'cyberpunk' && '🤖'}
            {theme.category === 'gothic' && '🦇'}
            {theme.category === 'kawaii' && '🌈'}
          </motion.div>
        </div>

        {/* Center: Preview avatar */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-full bg-dark-900/80 border-2 flex items-center justify-center"
            style={{
              borderColor: theme.accentPrimary,
              boxShadow: theme.glowEnabled 
                ? `0 0 20px ${theme.accentPrimary}60` 
                : undefined,
            }}
            animate={theme.glowEnabled ? {
              boxShadow: [
                `0 0 10px ${theme.accentPrimary}40`,
                `0 0 25px ${theme.accentPrimary}60`,
                `0 0 10px ${theme.accentPrimary}40`,
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl">👤</span>
          </motion.div>
        </div>

        {/* Bottom: Theme name and description */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2">
          <h3 
            className="font-bold text-sm truncate"
            style={{ color: theme.textColor }}
          >
            {theme.name}
          </h3>
          <p 
            className="text-[10px] opacity-70 truncate"
            style={{ color: theme.textColor }}
          >
            {theme.description}
          </p>
        </div>
      </div>

      {/* Lock overlay */}
      {!theme.unlocked && (
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <LockClosedIcon className="w-8 h-8 text-white/70 mb-2" />
          <span className="text-xs text-white/80 font-medium">
            {theme.unlockLevel ? `Level ${theme.unlockLevel}` : 'Locked'}
          </span>
          {theme.unlockRequirement && (
            <span className="text-[10px] text-white/60 text-center px-4 mt-1">
              {theme.unlockRequirement}
            </span>
          )}
        </motion.div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <>
          {/* Corner brackets */}
          <motion.div
            className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg"
            style={{ borderColor: theme.accentPrimary }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          />
          <motion.div
            className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg"
            style={{ borderColor: theme.accentPrimary }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          />
          <motion.div
            className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg"
            style={{ borderColor: theme.accentPrimary }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          />
          <motion.div
            className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 rounded-br-lg"
            style={{ borderColor: theme.accentPrimary }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          />

          {/* Checkmark badge */}
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: theme.accentPrimary,
              boxShadow: `0 0 15px ${theme.accentPrimary}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <CheckIcon className="w-4 h-4 text-white" />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

/**
 * Grid container for profile theme cards
 */
export function ProfileThemeGrid({
  children,
  columns = 3,
  className = '',
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

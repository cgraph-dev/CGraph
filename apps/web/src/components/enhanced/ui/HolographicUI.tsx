/**
 * Holographic UI Component System
 * 
 * Next-generation holographic user interface components with:
 * - 3D holographic projections using WebGL
 * - Volumetric lighting effects
 * - Parallax depth layers
 * - Holographic scan lines and flicker
 * - Interactive 3D touch targets
 * - Sci-fi inspired animations
 * 
 * This creates a futuristic "Minority Report" style interface
 * that works on standard displays with advanced visual effects.
 * 
 * @version 3.0.0
 * @since v0.7.35
 */

import { ReactNode, useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface HolographicTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  scanline: string;
  background: string;
}

export interface HolographicConfig {
  intensity: 'subtle' | 'medium' | 'intense';
  colorTheme: 'cyan' | 'green' | 'purple' | 'gold' | 'custom';
  customColors?: HolographicTheme;
  enableScanlines: boolean;
  enableFlicker: boolean;
  enableParallax: boolean;
  enable3D: boolean;
  enableAudio: boolean;
  glitchProbability: number;
}

// =============================================================================
// COLOR THEMES
// =============================================================================

const HOLOGRAPHIC_THEMES: Record<string, HolographicTheme> = {
  cyan: {
    primary: 'rgba(0, 255, 255, 0.9)',
    secondary: 'rgba(0, 200, 255, 0.7)',
    accent: 'rgba(100, 255, 255, 1)',
    glow: 'rgba(0, 255, 255, 0.5)',
    scanline: 'rgba(0, 255, 255, 0.1)',
    background: 'rgba(0, 20, 40, 0.95)',
  },
  green: {
    primary: 'rgba(0, 255, 100, 0.9)',
    secondary: 'rgba(50, 255, 150, 0.7)',
    accent: 'rgba(100, 255, 150, 1)',
    glow: 'rgba(0, 255, 100, 0.5)',
    scanline: 'rgba(0, 255, 100, 0.1)',
    background: 'rgba(0, 30, 20, 0.95)',
  },
  purple: {
    primary: 'rgba(200, 100, 255, 0.9)',
    secondary: 'rgba(150, 50, 255, 0.7)',
    accent: 'rgba(220, 150, 255, 1)',
    glow: 'rgba(180, 80, 255, 0.5)',
    scanline: 'rgba(180, 80, 255, 0.1)',
    background: 'rgba(30, 10, 50, 0.95)',
  },
  gold: {
    primary: 'rgba(255, 200, 50, 0.9)',
    secondary: 'rgba(255, 180, 30, 0.7)',
    accent: 'rgba(255, 220, 100, 1)',
    glow: 'rgba(255, 200, 50, 0.5)',
    scanline: 'rgba(255, 200, 50, 0.1)',
    background: 'rgba(40, 30, 10, 0.95)',
  },
};

// =============================================================================
// HOLOGRAPHIC CONTAINER
// =============================================================================

interface HolographicContainerProps {
  children: ReactNode;
  config?: Partial<HolographicConfig>;
  className?: string;
  onClick?: () => void;
}

export function HolographicContainer({
  children,
  config: userConfig,
  className,
  onClick,
}: HolographicContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [flickerOpacity, setFlickerOpacity] = useState(1);
  
  const config: HolographicConfig = {
    intensity: userConfig?.intensity ?? 'medium',
    colorTheme: userConfig?.colorTheme ?? 'cyan',
    enableScanlines: userConfig?.enableScanlines ?? true,
    enableFlicker: userConfig?.enableFlicker ?? true,
    enableParallax: userConfig?.enableParallax ?? true,
    enable3D: userConfig?.enable3D ?? true,
    enableAudio: userConfig?.enableAudio ?? false,
    glitchProbability: userConfig?.glitchProbability ?? 0.02,
    ...userConfig,
  };
  
  const theme = config.customColors ?? HOLOGRAPHIC_THEMES[config.colorTheme];
  
  // Motion values for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });
  
  // Random glitch effect
  useEffect(() => {
    if (!config.enableFlicker) return;
    
    const glitchInterval = setInterval(() => {
      if (Math.random() < config.glitchProbability) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150);
      }
    }, 500);
    
    return () => clearInterval(glitchInterval);
  }, [config.enableFlicker, config.glitchProbability]);
  
  // Subtle flicker
  useEffect(() => {
    if (!config.enableFlicker) return;
    
    const flickerInterval = setInterval(() => {
      setFlickerOpacity(0.95 + Math.random() * 0.05);
    }, 100);
    
    return () => clearInterval(flickerInterval);
  }, [config.enableFlicker]);
  
  // Mouse tracking for parallax
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!config.enableParallax) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    mouseX.set(x);
    mouseY.set(y);
  }, [config.enableParallax, mouseX, mouseY]);
  
  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);
  
  const intensityMultiplier = {
    subtle: 0.5,
    medium: 1,
    intense: 1.5,
  }[config.intensity];
  
  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        'transition-all duration-300',
        className
      )}
      style={{
        perspective: 1000,
        opacity: flickerOpacity,
        background: theme.background,
        boxShadow: `
          0 0 ${20 * intensityMultiplier}px ${theme.glow},
          inset 0 0 ${30 * intensityMultiplier}px ${theme.glow}
        `,
        border: `1px solid ${theme.primary}`,
        rotateX: config.enable3D ? rotateX : 0,
        rotateY: config.enable3D ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Holographic gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            135deg,
            transparent 0%,
            ${theme.glow} 25%,
            transparent 50%,
            ${theme.glow} 75%,
            transparent 100%
          )`,
          opacity: 0.1 * intensityMultiplier,
          animation: 'holographicShimmer 3s linear infinite',
        }}
      />
      
      {/* Scanlines */}
      {config.enableScanlines && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              ${theme.scanline},
              ${theme.scanline} 1px,
              transparent 1px,
              transparent 3px
            )`,
            opacity: 0.5 * intensityMultiplier,
            animation: 'scanlineMove 10s linear infinite',
          }}
        />
      )}
      
      {/* Glitch overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                ${theme.accent} 10%,
                transparent 20%
              )`,
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-8 h-8">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path
            d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z"
            fill={theme.primary}
            opacity={0.8}
          />
        </svg>
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 rotate-90">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path
            d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z"
            fill={theme.primary}
            opacity={0.8}
          />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-8 h-8 -rotate-90">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path
            d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z"
            fill={theme.primary}
            opacity={0.8}
          />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-8 h-8 rotate-180">
        <svg viewBox="0 0 32 32" className="w-full h-full">
          <path
            d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z"
            fill={theme.primary}
            opacity={0.8}
          />
        </svg>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// =============================================================================
// HOLOGRAPHIC TEXT
// =============================================================================

interface HolographicTextProps {
  children: ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'label';
  colorTheme?: HolographicConfig['colorTheme'];
  animate?: boolean;
  glowIntensity?: number;
  className?: string;
}

export function HolographicText({
  children,
  variant = 'body',
  colorTheme = 'cyan',
  animate = true,
  glowIntensity = 1,
  className,
}: HolographicTextProps) {
  const theme = HOLOGRAPHIC_THEMES[colorTheme];
  
  const sizeClasses = {
    title: 'text-4xl font-bold tracking-wider',
    subtitle: 'text-2xl font-semibold tracking-wide',
    body: 'text-base',
    label: 'text-sm uppercase tracking-widest',
  };
  
  return (
    <motion.span
      className={cn(sizeClasses[variant], className)}
      style={{
        color: theme.primary,
        textShadow: `
          0 0 ${5 * glowIntensity}px ${theme.glow},
          0 0 ${10 * glowIntensity}px ${theme.glow},
          0 0 ${20 * glowIntensity}px ${theme.glow}
        `,
      }}
      animate={animate ? {
        textShadow: [
          `0 0 ${5 * glowIntensity}px ${theme.glow}, 0 0 ${10 * glowIntensity}px ${theme.glow}`,
          `0 0 ${8 * glowIntensity}px ${theme.glow}, 0 0 ${15 * glowIntensity}px ${theme.glow}`,
          `0 0 ${5 * glowIntensity}px ${theme.glow}, 0 0 ${10 * glowIntensity}px ${theme.glow}`,
        ],
      } : undefined}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.span>
  );
}

// =============================================================================
// HOLOGRAPHIC BUTTON
// =============================================================================

interface HolographicButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  colorTheme?: HolographicConfig['colorTheme'];
  className?: string;
}

export function HolographicButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  colorTheme = 'cyan',
  className,
}: HolographicButtonProps) {
  const theme = HOLOGRAPHIC_THEMES[colorTheme];
  const [isPressed, setIsPressed] = useState(false);
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}30)`,
      border: `2px solid ${theme.primary}`,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${theme.secondary}`,
    },
    danger: {
      background: 'linear-gradient(135deg, rgba(255,50,50,0.2), rgba(255,100,100,0.3))',
      border: '2px solid rgba(255,100,100,0.8)',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
    },
  };
  
  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-lg font-semibold uppercase tracking-wider',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        sizeClasses[size],
        className
      )}
      style={{
        ...variantStyles[variant],
        color: variant === 'danger' ? 'rgba(255,150,150,1)' : theme.primary,
        boxShadow: isPressed 
          ? `inset 0 0 20px ${theme.glow}`
          : `0 0 15px ${theme.glow}`,
      }}
      onClick={disabled || loading ? undefined : onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `radial-gradient(circle at center, ${theme.glow}, transparent 70%)`,
        }}
      />
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 rounded-full"
            style={{
              borderColor: `${theme.primary} transparent ${theme.primary} transparent`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
      
      {/* Content */}
      <span className={cn('relative z-10', loading && 'opacity-0')}>
        {children}
      </span>
    </motion.button>
  );
}

// =============================================================================
// HOLOGRAPHIC CARD
// =============================================================================

interface HolographicCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  colorTheme?: HolographicConfig['colorTheme'];
  className?: string;
  onClick?: () => void;
}

export function HolographicCard({
  children,
  header,
  footer,
  colorTheme = 'cyan',
  className,
  onClick,
}: HolographicCardProps) {
  const theme = HOLOGRAPHIC_THEMES[colorTheme];
  
  return (
    <HolographicContainer
      config={{ colorTheme }}
      className={cn('p-0', className)}
      onClick={onClick}
    >
      {/* Header */}
      {header && (
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: theme.primary + '40' }}
        >
          {header}
        </div>
      )}
      
      {/* Body */}
      <div className="px-6 py-4">
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: theme.primary + '40' }}
        >
          {footer}
        </div>
      )}
    </HolographicContainer>
  );
}

// =============================================================================
// HOLOGRAPHIC AVATAR
// =============================================================================

interface HolographicAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  colorTheme?: HolographicConfig['colorTheme'];
  className?: string;
}

export function HolographicAvatar({
  src,
  name,
  size = 'md',
  status,
  colorTheme = 'cyan',
  className,
}: HolographicAvatarProps) {
  const theme = HOLOGRAPHIC_THEMES[colorTheme];
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };
  
  const statusColors = {
    online: 'rgb(50, 255, 100)',
    offline: 'rgb(150, 150, 150)',
    away: 'rgb(255, 200, 50)',
    busy: 'rgb(255, 80, 80)',
  };
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  return (
    <div className={cn('relative', className)}>
      <motion.div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center',
          sizeClasses[size]
        )}
        style={{
          background: src ? 'transparent' : theme.background,
          border: `2px solid ${theme.primary}`,
          boxShadow: `
            0 0 10px ${theme.glow},
            inset 0 0 15px ${theme.glow}
          `,
        }}
        whileHover={{ scale: 1.1 }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            style={{
              filter: `drop-shadow(0 0 5px ${theme.glow})`,
            }}
          />
        ) : (
          <span style={{ color: theme.primary }}>{initials}</span>
        )}
        
        {/* Holographic ring animation */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: `1px solid ${theme.accent}`,
          }}
          animate={{
            scale: [1, 1.2],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </motion.div>
      
      {/* Status indicator */}
      {status && (
        <motion.div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full"
          style={{
            background: statusColors[status],
            boxShadow: `0 0 8px ${statusColors[status]}`,
            border: `2px solid ${theme.background}`,
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// HOLOGRAPHIC INPUT
// =============================================================================

interface HolographicInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;
  colorTheme?: HolographicConfig['colorTheme'];
  className?: string;
}

export function HolographicInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  colorTheme = 'cyan',
  className,
}: HolographicInputProps) {
  const theme = HOLOGRAPHIC_THEMES[colorTheme];
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <motion.div
      className={cn('relative', className)}
      animate={{
        boxShadow: isFocused 
          ? `0 0 20px ${theme.glow}, inset 0 0 10px ${theme.glow}`
          : `0 0 10px ${theme.glow}40`,
      }}
      style={{
        borderRadius: 8,
      }}
    >
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'w-full px-4 py-3 rounded-lg bg-transparent outline-none',
          'placeholder-opacity-50 transition-all',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          color: theme.primary,
          border: `1px solid ${isFocused ? theme.primary : theme.secondary}50`,
          background: theme.background,
        }}
      />
      
      {/* Focus indicator line */}
      <motion.div
        className="absolute bottom-0 left-1/2 h-0.5"
        style={{
          background: theme.accent,
          boxShadow: `0 0 10px ${theme.accent}`,
        }}
        initial={{ width: 0, x: '-50%' }}
        animate={{
          width: isFocused ? '100%' : 0,
          x: '-50%',
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

// =============================================================================
// HOLOGRAPHIC PROGRESS
// =============================================================================

interface HolographicProgressProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorTheme?: HolographicConfig['colorTheme'];
  className?: string;
}

export function HolographicProgress({
  value,
  showLabel = true,
  size = 'md',
  colorTheme = 'cyan',
  className,
}: HolographicProgressProps) {
  const theme = HOLOGRAPHIC_THEMES[colorTheme];
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };
  
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={cn('relative', className)}>
      {/* Background track */}
      <div
        className={cn('w-full rounded-full overflow-hidden', heightClasses[size])}
        style={{
          background: theme.background,
          border: `1px solid ${theme.secondary}40`,
          boxShadow: `inset 0 0 10px ${theme.glow}20`,
        }}
      >
        {/* Progress fill */}
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${theme.secondary}, ${theme.primary})`,
            boxShadow: `0 0 15px ${theme.glow}`,
          }}
        >
          {/* Animated shine */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accent}80, transparent)`,
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </div>
      
      {/* Label */}
      {showLabel && (
        <div
          className="mt-1 text-sm text-right"
          style={{ color: theme.primary }}
        >
          {clampedValue.toFixed(0)}%
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HOLOGRAPHIC NOTIFICATION
// =============================================================================

interface HolographicNotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
  duration?: number;
  className?: string;
}

export function HolographicNotification({
  message,
  type = 'info',
  onDismiss,
  duration = 5000,
  className,
}: HolographicNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const typeThemes: Record<string, HolographicConfig['colorTheme']> = {
    info: 'cyan',
    success: 'green',
    warning: 'gold',
    error: 'purple',
  };
  
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);
  
  const theme = HOLOGRAPHIC_THEMES[typeThemes[type]];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={cn('relative max-w-md', className)}
        >
          <HolographicContainer config={{ colorTheme: typeThemes[type] }}>
            <div className="flex items-center gap-3 p-4">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{
                  background: theme.accent,
                  boxShadow: `0 0 10px ${theme.accent}`,
                }}
              />
              <span style={{ color: theme.primary }}>{message}</span>
              {onDismiss && (
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="ml-auto p-1 rounded hover:bg-white/10"
                  style={{ color: theme.secondary }}
                >
                  ✕
                </button>
              )}
            </div>
          </HolographicContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// CSS KEYFRAMES (add to global CSS)
// =============================================================================

export const holographicStyles = `
  @keyframes holographicShimmer {
    0% { transform: translateX(-100%) rotate(45deg); }
    100% { transform: translateX(100%) rotate(45deg); }
  }
  
  @keyframes scanlineMove {
    0% { transform: translateY(0); }
    100% { transform: translateY(100%); }
  }
  
  @keyframes holoGlitch {
    0%, 100% { transform: translate(0); filter: none; }
    20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
    40% { transform: translate(2px, -2px); filter: hue-rotate(-90deg); }
    60% { transform: translate(-1px, -1px); }
    80% { transform: translate(1px, 1px); }
  }
`;

// =============================================================================
// EXPORTS
// =============================================================================

export { HOLOGRAPHIC_THEMES };

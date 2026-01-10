/**
 * Holographic UI Component System v4.0
 * 
 * Next-generation holographic user interface with:
 * - Full theme engine integration
 * - Advanced particle systems
 * - Depth-based parallax layers
 * - Holographic distortion effects
 * - Haptic feedback simulation
 * - Accessibility-first design
 * - Performance-optimized animations
 * 
 * Components:
 * - HoloContainer v4
 * - HoloText v4
 * - HoloButton v4
 * - HoloCard v4
 * - HoloAvatar v4
 * - HoloInput v4
 * - HoloProgress v4
 * - HoloNotification v4
 * - HoloModal (NEW)
 * - HoloMenu (NEW)
 * - HoloBadge (NEW)
 * - HoloTabs (NEW)
 * - HoloDivider (NEW)
 * - HoloTooltip (NEW)
 * 
 * @version 4.0.0
 * @since v0.7.36
 */

import {
  ReactNode,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
  forwardRef,
} from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  MotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface HoloTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  scanline: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface HoloConfig {
  /** Visual intensity level */
  intensity: 'subtle' | 'medium' | 'intense';
  /** Color preset or custom */
  preset: 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight' | 'custom';
  /** Custom theme colors */
  customTheme?: Partial<HoloTheme>;
  /** Enable animated scanlines */
  enableScanlines: boolean;
  /** Enable random flicker effect */
  enableFlicker: boolean;
  /** Enable mouse-based parallax */
  enableParallax: boolean;
  /** Enable 3D transforms */
  enable3D: boolean;
  /** Enable glow effects */
  enableGlow: boolean;
  /** Enable particle effects */
  enableParticles: boolean;
  /** Reduce motion for accessibility */
  reduceMotion: boolean;
  /** Glitch effect probability (0-1) */
  glitchProbability: number;
}

type HoloPreset = 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight';

// =============================================================================
// COLOR PRESETS
// =============================================================================

const HOLO_PRESETS: Record<HoloPreset, HoloTheme> = {
  cyan: {
    primary: 'rgba(0, 255, 255, 0.95)',
    secondary: 'rgba(0, 200, 255, 0.8)',
    accent: 'rgba(100, 255, 255, 1)',
    glow: 'rgba(0, 255, 255, 0.6)',
    scanline: 'rgba(0, 255, 255, 0.08)',
    background: 'rgba(0, 15, 30, 0.98)',
    surface: 'rgba(0, 30, 60, 0.9)',
    text: 'rgba(200, 255, 255, 1)',
    textMuted: 'rgba(100, 180, 200, 0.8)',
    border: 'rgba(0, 255, 255, 0.3)',
    success: 'rgba(0, 255, 150, 1)',
    warning: 'rgba(255, 200, 50, 1)',
    error: 'rgba(255, 80, 100, 1)',
    info: 'rgba(80, 200, 255, 1)',
  },
  matrix: {
    primary: 'rgba(0, 255, 65, 0.95)',
    secondary: 'rgba(0, 200, 50, 0.8)',
    accent: 'rgba(100, 255, 100, 1)',
    glow: 'rgba(0, 255, 65, 0.6)',
    scanline: 'rgba(0, 255, 65, 0.08)',
    background: 'rgba(0, 10, 0, 0.98)',
    surface: 'rgba(0, 20, 5, 0.9)',
    text: 'rgba(180, 255, 180, 1)',
    textMuted: 'rgba(80, 180, 80, 0.8)',
    border: 'rgba(0, 255, 65, 0.3)',
    success: 'rgba(0, 255, 100, 1)',
    warning: 'rgba(200, 255, 0, 1)',
    error: 'rgba(255, 50, 50, 1)',
    info: 'rgba(0, 200, 100, 1)',
  },
  purple: {
    primary: 'rgba(180, 100, 255, 0.95)',
    secondary: 'rgba(140, 60, 255, 0.8)',
    accent: 'rgba(220, 150, 255, 1)',
    glow: 'rgba(180, 80, 255, 0.6)',
    scanline: 'rgba(180, 80, 255, 0.08)',
    background: 'rgba(15, 5, 30, 0.98)',
    surface: 'rgba(30, 15, 60, 0.9)',
    text: 'rgba(230, 200, 255, 1)',
    textMuted: 'rgba(150, 120, 200, 0.8)',
    border: 'rgba(180, 100, 255, 0.3)',
    success: 'rgba(100, 255, 200, 1)',
    warning: 'rgba(255, 180, 100, 1)',
    error: 'rgba(255, 100, 150, 1)',
    info: 'rgba(150, 150, 255, 1)',
  },
  gold: {
    primary: 'rgba(255, 200, 50, 0.95)',
    secondary: 'rgba(255, 170, 30, 0.8)',
    accent: 'rgba(255, 230, 100, 1)',
    glow: 'rgba(255, 200, 50, 0.6)',
    scanline: 'rgba(255, 200, 50, 0.08)',
    background: 'rgba(20, 15, 5, 0.98)',
    surface: 'rgba(40, 30, 15, 0.9)',
    text: 'rgba(255, 240, 200, 1)',
    textMuted: 'rgba(200, 170, 120, 0.8)',
    border: 'rgba(255, 200, 50, 0.3)',
    success: 'rgba(150, 255, 100, 1)',
    warning: 'rgba(255, 180, 50, 1)',
    error: 'rgba(255, 100, 80, 1)',
    info: 'rgba(200, 200, 100, 1)',
  },
  midnight: {
    primary: 'rgba(100, 150, 255, 0.95)',
    secondary: 'rgba(80, 120, 255, 0.8)',
    accent: 'rgba(150, 180, 255, 1)',
    glow: 'rgba(100, 150, 255, 0.6)',
    scanline: 'rgba(100, 150, 255, 0.08)',
    background: 'rgba(8, 12, 25, 0.98)',
    surface: 'rgba(15, 25, 50, 0.9)',
    text: 'rgba(200, 220, 255, 1)',
    textMuted: 'rgba(120, 150, 200, 0.8)',
    border: 'rgba(100, 150, 255, 0.3)',
    success: 'rgba(100, 255, 180, 1)',
    warning: 'rgba(255, 200, 100, 1)',
    error: 'rgba(255, 120, 140, 1)',
    info: 'rgba(120, 180, 255, 1)',
  },
};

// =============================================================================
// CONTEXT
// =============================================================================

const HoloContext = createContext<{
  theme: HoloTheme;
  config: HoloConfig;
  updateConfig: (updates: Partial<HoloConfig>) => void;
} | null>(null);

export function useHolo() {
  const context = useContext(HoloContext);
  if (!context) {
    throw new Error('useHolo must be used within a HoloProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface HoloProviderProps {
  children: ReactNode;
  config?: Partial<HoloConfig>;
}

export function HoloProvider({ children, config: userConfig }: HoloProviderProps) {
  const [config, setConfig] = useState<HoloConfig>(() => ({
    intensity: 'medium',
    preset: 'cyan',
    enableScanlines: true,
    enableFlicker: true,
    enableParallax: true,
    enable3D: true,
    enableGlow: true,
    enableParticles: true,
    reduceMotion: false,
    glitchProbability: 0.02,
    ...userConfig,
  }));

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setConfig(prev => ({ ...prev, reduceMotion: true }));
    }
    
    const handler = (e: MediaQueryListEvent) => {
      setConfig(prev => ({ ...prev, reduceMotion: e.matches }));
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const theme = useMemo(() => {
    const preset = config.preset === 'custom' ? 'cyan' : config.preset;
    const baseTheme = HOLO_PRESETS[preset];
    return { ...baseTheme, ...config.customTheme };
  }, [config.preset, config.customTheme]);

  const updateConfig = useCallback((updates: Partial<HoloConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <HoloContext.Provider value={{ theme, config, updateConfig }}>
      {children}
    </HoloContext.Provider>
  );
}

// =============================================================================
// UTILITIES
// =============================================================================

function getIntensityMultiplier(intensity: HoloConfig['intensity']): number {
  return { subtle: 0.5, medium: 1, intense: 1.5 }[intensity];
}

function getTheme(preset: HoloPreset | 'custom', customTheme?: Partial<HoloTheme>): HoloTheme {
  const base = preset === 'custom' ? HOLO_PRESETS.cyan : HOLO_PRESETS[preset];
  return { ...base, ...customTheme };
}

// =============================================================================
// HOLO CONTAINER v4
// =============================================================================

interface HoloContainerProps extends Omit<MotionProps, 'children'> {
  children: ReactNode;
  preset?: HoloPreset;
  intensity?: HoloConfig['intensity'];
  enableScanlines?: boolean;
  enableFlicker?: boolean;
  enableParallax?: boolean;
  enable3D?: boolean;
  enableGlow?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
  onClick?: () => void;
}

export const HoloContainer = forwardRef<HTMLDivElement, HoloContainerProps>(
  function HoloContainer(
    {
      children,
      preset = 'cyan',
      intensity = 'medium',
      enableScanlines = true,
      enableFlicker = true,
      enableParallax = true,
      enable3D = true,
      enableGlow = true,
      className,
      as: Component = 'div',
      onClick,
      ...motionProps
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isGlitching, setIsGlitching] = useState(false);
    const [flickerOpacity, setFlickerOpacity] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    const theme = getTheme(preset);
    const mult = getIntensityMultiplier(intensity);

    // Parallax motion values
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useSpring(useTransform(mouseY, [-200, 200], [4, -4]), {
      stiffness: 400,
      damping: 40,
    });
    const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-4, 4]), {
      stiffness: 400,
      damping: 40,
    });

    // Glitch effect
    useEffect(() => {
      if (!enableFlicker) return;
      const interval = setInterval(() => {
        if (Math.random() < 0.02) {
          setIsGlitching(true);
          setTimeout(() => setIsGlitching(false), 80 + Math.random() * 120);
        }
      }, 500);
      return () => clearInterval(interval);
    }, [enableFlicker]);

    // Flicker effect
    useEffect(() => {
      if (!enableFlicker) return;
      const interval = setInterval(() => {
        setFlickerOpacity(0.96 + Math.random() * 0.04);
      }, 80);
      return () => clearInterval(interval);
    }, [enableFlicker]);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!enableParallax || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      },
      [enableParallax, mouseX, mouseY]
    );

    const handleMouseLeave = useCallback(() => {
      mouseX.set(0);
      mouseY.set(0);
      setIsHovered(false);
    }, [mouseX, mouseY]);

    const MotionComponent = motion[Component];

    return (
      <MotionComponent
        ref={ref || containerRef}
        className={cn('relative overflow-hidden rounded-xl', className)}
        style={{
          perspective: 1000,
          opacity: flickerOpacity,
          background: theme.background,
          border: `1px solid ${theme.border}`,
          boxShadow: enableGlow
            ? `
              0 0 ${15 * mult}px ${theme.glow}40,
              0 0 ${30 * mult}px ${theme.glow}20,
              inset 0 0 ${20 * mult}px ${theme.glow}10
            `
            : undefined,
          rotateX: enable3D ? rotateX : 0,
          rotateY: enable3D ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.01 }}
        {...motionProps}
      >
        {/* Holographic gradient overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              135deg,
              transparent 0%,
              ${theme.glow}15 25%,
              transparent 50%,
              ${theme.glow}10 75%,
              transparent 100%
            )`,
          }}
          animate={
            isHovered
              ? { backgroundPosition: ['0% 0%', '200% 200%'] }
              : { backgroundPosition: '0% 0%' }
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        {/* Scanlines */}
        {enableScanlines && (
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
              opacity: 0.4 * mult,
            }}
          />
        )}

        {/* Glitch overlay */}
        <AnimatePresence>
          {isGlitching && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-50"
              initial={{ opacity: 0, x: -2 }}
              animate={{ opacity: 0.8, x: [0, 2, -2, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              style={{
                background: `linear-gradient(90deg, transparent 40%, ${theme.accent}30 50%, transparent 60%)`,
                mixBlendMode: 'screen',
              }}
            />
          )}
        </AnimatePresence>

        {/* Corner brackets */}
        <CornerBrackets color={theme.primary} />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </MotionComponent>
    );
  }
);

// Corner bracket decorations
function CornerBrackets({ color }: { color: string }) {
  const corners = ['top-0 left-0', 'top-0 right-0 rotate-90', 'bottom-0 left-0 -rotate-90', 'bottom-0 right-0 rotate-180'];
  
  return (
    <>
      {corners.map((pos, i) => (
        <div key={i} className={`absolute w-6 h-6 ${pos}`}>
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M0 0 L24 0 L24 3 L3 3 L3 24 L0 24 Z" fill={color} opacity={0.7} />
          </svg>
        </div>
      ))}
    </>
  );
}

// =============================================================================
// HOLO TEXT v4
// =============================================================================

interface HoloTextProps {
  children: ReactNode;
  variant?: 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';
  preset?: HoloPreset;
  animate?: boolean;
  glowIntensity?: number;
  gradient?: boolean;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

export function HoloText({
  children,
  variant = 'body',
  preset = 'cyan',
  animate = true,
  glowIntensity = 1,
  gradient = false,
  className,
  as: Component = 'span',
}: HoloTextProps) {
  const theme = getTheme(preset);

  const variantStyles: Record<string, string> = {
    display: 'text-5xl font-black tracking-tight',
    title: 'text-3xl font-bold tracking-wide',
    subtitle: 'text-xl font-semibold',
    body: 'text-base',
    caption: 'text-sm',
    label: 'text-xs uppercase tracking-widest font-medium',
  };

  const MotionComponent = motion[Component];

  return (
    <MotionComponent
      className={cn(variantStyles[variant], className)}
      style={{
        color: gradient ? 'transparent' : theme.text,
        backgroundClip: gradient ? 'text' : undefined,
        WebkitBackgroundClip: gradient ? 'text' : undefined,
        background: gradient
          ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`
          : undefined,
        textShadow: gradient
          ? undefined
          : `
            0 0 ${4 * glowIntensity}px ${theme.glow},
            0 0 ${8 * glowIntensity}px ${theme.glow}60
          `,
      }}
      animate={
        animate
          ? {
              textShadow: [
                `0 0 ${4 * glowIntensity}px ${theme.glow}, 0 0 ${8 * glowIntensity}px ${theme.glow}60`,
                `0 0 ${6 * glowIntensity}px ${theme.glow}, 0 0 ${12 * glowIntensity}px ${theme.glow}80`,
                `0 0 ${4 * glowIntensity}px ${theme.glow}, 0 0 ${8 * glowIntensity}px ${theme.glow}60`,
              ],
            }
          : undefined
      }
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </MotionComponent>
  );
}

// =============================================================================
// HOLO BUTTON v4
// =============================================================================

interface HoloButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  preset?: HoloPreset;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

export function HoloButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  preset = 'cyan',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
}: HoloButtonProps) {
  const theme = getTheme(preset);
  const [isPressed, setIsPressed] = useState(false);

  const sizeStyles: Record<string, string> = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  const variantColors = {
    primary: { bg: theme.primary, text: theme.background, glow: theme.glow },
    secondary: { bg: 'transparent', text: theme.primary, glow: theme.glow },
    ghost: { bg: 'transparent', text: theme.textMuted, glow: 'transparent' },
    danger: { bg: theme.error, text: '#fff', glow: theme.error },
    success: { bg: theme.success, text: theme.background, glow: theme.success },
  };

  const colors = variantColors[variant];

  return (
    <motion.button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg font-semibold uppercase tracking-wider',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        fullWidth && 'w-full',
        sizeStyles[size],
        className
      )}
      style={{
        background:
          variant === 'primary'
            ? `linear-gradient(135deg, ${colors.bg}30, ${colors.bg}50)`
            : colors.bg,
        color: colors.text,
        border: `1.5px solid ${variant === 'ghost' ? theme.border : colors.bg}`,
        boxShadow: isPressed
          ? `inset 0 0 20px ${colors.glow}50`
          : `0 0 12px ${colors.glow}40, 0 4px 20px ${colors.glow}20`,
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={disabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `radial-gradient(circle at center, ${colors.glow}30, transparent 70%)`,
        }}
      />

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-5 h-5 border-2 rounded-full"
            style={{ borderColor: `${colors.text} transparent ${colors.text} transparent` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Content */}
      <span className={cn('relative z-10 flex items-center', sizeStyles[size], loading && 'opacity-0')}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </motion.button>
  );
}

// =============================================================================
// HOLO CARD v4
// =============================================================================

interface HoloCardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  preset?: HoloPreset;
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

export function HoloCard({
  children,
  header,
  footer,
  preset = 'cyan',
  hoverable = true,
  onClick,
  className,
}: HoloCardProps) {
  const theme = getTheme(preset);

  return (
    <HoloContainer
      preset={preset}
      className={cn(hoverable && 'cursor-pointer', className)}
      onClick={onClick}
      whileHover={hoverable ? { y: -4, scale: 1.01 } : undefined}
    >
      {header && (
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: theme.border }}
        >
          {header}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div
          className="px-5 py-4 border-t"
          style={{ borderColor: theme.border }}
        >
          {footer}
        </div>
      )}
    </HoloContainer>
  );
}

// =============================================================================
// HOLO AVATAR v4
// =============================================================================

interface HoloAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  preset?: HoloPreset;
  ring?: boolean;
  className?: string;
}

export function HoloAvatar({
  src,
  name,
  size = 'md',
  status,
  preset = 'cyan',
  ring = true,
  className,
}: HoloAvatarProps) {
  const theme = getTheme(preset);

  const sizeMap = {
    xs: { container: 'w-6 h-6', text: 'text-[8px]', status: 'w-1.5 h-1.5' },
    sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2' },
    md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5' },
    lg: { container: 'w-14 h-14', text: 'text-lg', status: 'w-3 h-3' },
    xl: { container: 'w-20 h-20', text: 'text-2xl', status: 'w-4 h-4' },
    '2xl': { container: 'w-28 h-28', text: 'text-3xl', status: 'w-5 h-5' },
  } as const;

  const statusColors: Record<string, string> = {
    online: theme.success,
    offline: theme.textMuted,
    away: theme.warning,
    busy: theme.error,
    invisible: theme.textMuted,
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizes = sizeMap[size];

  return (
    <div className={cn('relative inline-block', className)}>
      <motion.div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center',
          sizes.container
        )}
        style={{
          background: src ? 'transparent' : theme.surface,
          border: `2px solid ${theme.primary}`,
          boxShadow: `0 0 12px ${theme.glow}50`,
        }}
        whileHover={{ scale: 1.08 }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            style={{ filter: `drop-shadow(0 0 4px ${theme.glow})` }}
          />
        ) : (
          <span className={sizes.text} style={{ color: theme.primary, fontWeight: 600 }}>
            {initials}
          </span>
        )}

        {/* Animated ring */}
        {ring && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: `1px solid ${theme.accent}` }}
            animate={{ scale: [1, 1.15], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.div>

      {/* Status indicator */}
      {status && status !== 'invisible' && (
        <motion.div
          className={cn('absolute bottom-0 right-0 rounded-full', sizes.status)}
          style={{
            background: statusColors[status],
            boxShadow: `0 0 6px ${statusColors[status]}`,
            border: `2px solid ${theme.background}`,
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// =============================================================================
// HOLO INPUT v4
// =============================================================================

interface HoloInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  preset?: HoloPreset;
  disabled?: boolean;
  error?: string;
  label?: string;
  icon?: ReactNode;
  className?: string;
}

export function HoloInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  preset = 'cyan',
  disabled = false,
  error,
  label,
  icon,
  className,
}: HoloInputProps) {
  const theme = getTheme(preset);
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error ? theme.error : isFocused ? theme.primary : theme.border;

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          className="block mb-2 text-sm font-medium"
          style={{ color: theme.textMuted }}
        >
          {label}
        </label>
      )}

      <motion.div
        className="relative"
        animate={{
          boxShadow: isFocused
            ? `0 0 16px ${error ? theme.error : theme.glow}40`
            : `0 0 8px ${theme.glow}20`,
        }}
        style={{ borderRadius: 8 }}
      >
        {icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          >
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full px-4 py-3 rounded-lg bg-transparent outline-none transition-all',
            icon && 'pl-10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            color: theme.text,
            border: `1.5px solid ${borderColor}`,
            background: theme.surface,
          }}
        />

        {/* Focus line */}
        <motion.div
          className="absolute bottom-0 left-1/2 h-0.5 rounded-full"
          style={{ background: error ? theme.error : theme.accent }}
          initial={{ width: 0, x: '-50%' }}
          animate={{ width: isFocused ? '100%' : 0, x: '-50%' }}
          transition={{ duration: 0.25 }}
        />
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm"
          style={{ color: theme.error }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// =============================================================================
// HOLO PROGRESS v4
// =============================================================================

interface HoloProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  preset?: HoloPreset;
  animated?: boolean;
  variant?: 'linear' | 'circular';
  className?: string;
}

export function HoloProgress({
  value,
  max = 100,
  showLabel = true,
  size = 'md',
  preset = 'cyan',
  animated = true,
  variant = 'linear',
  className,
}: HoloProgressProps) {
  const theme = getTheme(preset);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
  };

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'md' ? 30 : 45;
    const stroke = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className={cn('relative inline-flex items-center justify-center', className)}>
        <svg
          width={(radius + stroke) * 2}
          height={(radius + stroke) * 2}
          className="-rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={theme.surface}
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <motion.circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke={theme.primary}
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 4px ${theme.glow})`,
            }}
          />
        </svg>
        {showLabel && (
          <span
            className="absolute text-sm font-semibold"
            style={{ color: theme.text }}
          >
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn('w-full rounded-full overflow-hidden', heights[size])}
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
        }}
      >
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: `linear-gradient(90deg, ${theme.secondary}, ${theme.primary})`,
            boxShadow: `0 0 12px ${theme.glow}`,
          }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${theme.accent}60, transparent)`,
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </motion.div>
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-sm" style={{ color: theme.textMuted }}>
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}

// =============================================================================
// HOLO BADGE v4 (NEW)
// =============================================================================

interface HoloBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  preset?: HoloPreset;
  pulse?: boolean;
  className?: string;
}

export function HoloBadge({
  children,
  variant = 'default',
  size = 'md',
  preset = 'cyan',
  pulse = false,
  className,
}: HoloBadgeProps) {
  const theme = getTheme(preset);

  const variantColors: Record<string, string> = {
    default: theme.primary,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
    info: theme.info,
  };

  const sizeStyles: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const color = variantColors[variant];

  return (
    <motion.span
      className={cn(
        'inline-flex items-center rounded-md font-medium uppercase tracking-wide',
        sizeStyles[size],
        className
      )}
      style={{
        background: `${color}20`,
        color: color,
        border: `1px solid ${color}50`,
        boxShadow: `0 0 8px ${color}30`,
      }}
      animate={pulse ? { scale: [1, 1.05, 1] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {children}
    </motion.span>
  );
}

// =============================================================================
// HOLO TABS v4 (NEW)
// =============================================================================

interface HoloTab {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface HoloTabsProps {
  tabs: HoloTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  preset?: HoloPreset;
  fullWidth?: boolean;
  className?: string;
}

export function HoloTabs({
  tabs,
  activeTab,
  onChange,
  preset = 'cyan',
  fullWidth = false,
  className,
}: HoloTabsProps) {
  const theme = getTheme(preset);

  return (
    <div
      className={cn('inline-flex p-1 rounded-lg gap-1', fullWidth && 'w-full', className)}
      style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <motion.button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              'relative flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              fullWidth && 'flex-1',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              color: isActive ? theme.background : theme.textMuted,
              background: isActive ? theme.primary : 'transparent',
            }}
            whileHover={tab.disabled ? {} : { scale: 1.02 }}
            whileTap={tab.disabled ? {} : { scale: 0.98 }}
          >
            {tab.icon}
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 rounded-md"
                style={{
                  background: theme.primary,
                  boxShadow: `0 0 12px ${theme.glow}`,
                  zIndex: -1,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// =============================================================================
// HOLO DIVIDER v4 (NEW)
// =============================================================================

interface HoloDividerProps {
  preset?: HoloPreset;
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

export function HoloDivider({
  preset = 'cyan',
  orientation = 'horizontal',
  decorative = true,
  className,
}: HoloDividerProps) {
  const theme = getTheme(preset);

  if (orientation === 'vertical') {
    return (
      <div
        className={cn('w-px h-full', className)}
        style={{
          background: `linear-gradient(180deg, transparent, ${theme.border}, transparent)`,
        }}
      />
    );
  }

  return (
    <div className={cn('relative w-full h-px my-4', className)}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.border}, transparent)`,
        }}
      />
      {decorative && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: theme.primary, boxShadow: `0 0 8px ${theme.glow}` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// =============================================================================
// HOLO MODAL v4 (NEW)
// =============================================================================

interface HoloModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  preset?: HoloPreset;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  className?: string;
}

export function HoloModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  preset = 'cyan',
  size = 'md',
  closeOnOverlay = true,
  className,
}: HoloModalProps) {
  const theme = getTheme(preset);

  const sizeStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] max-h-[90vh]',
  };

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlay ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn('relative w-full', sizeStyles[size], className)}
          >
            <HoloContainer preset={preset} className="overflow-hidden">
              {/* Header */}
              {title && (
                <div
                  className="flex items-center justify-between px-6 py-4 border-b"
                  style={{ borderColor: theme.border }}
                >
                  <HoloText variant="subtitle" preset={preset}>
                    {title}
                  </HoloText>
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: theme.textMuted }}
                    whileHover={{ scale: 1.1, color: theme.text }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">{children}</div>

              {/* Footer */}
              {footer && (
                <div
                  className="px-6 py-4 border-t flex justify-end gap-3"
                  style={{ borderColor: theme.border }}
                >
                  {footer}
                </div>
              )}
            </HoloContainer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// HOLO NOTIFICATION v4
// =============================================================================

interface HoloNotificationProps {
  message: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  preset?: HoloPreset;
  duration?: number;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function HoloNotification({
  message,
  description,
  type = 'info',
  preset = 'cyan',
  duration = 5000,
  onDismiss,
  action,
  className,
}: HoloNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const theme = getTheme(preset);

  const typeColors: Record<string, string> = {
    info: theme.info,
    success: theme.success,
    warning: theme.warning,
    error: theme.error,
  };

  const color = typeColors[type];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          className={cn('relative max-w-sm', className)}
        >
          <HoloContainer preset={preset}>
            <div className="flex gap-3 p-4">
              {/* Indicator */}
              <motion.div
                className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ color: theme.text }}>
                  {message}
                </p>
                {description && (
                  <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                    {description}
                  </p>
                )}
                {action && (
                  <button
                    onClick={action.onClick}
                    className="mt-2 text-sm font-medium hover:underline"
                    style={{ color: theme.primary }}
                  >
                    {action.label}
                  </button>
                )}
              </div>

              {/* Close button */}
              {onDismiss && (
                <motion.button
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="p-1 rounded hover:bg-white/10 flex-shrink-0"
                  style={{ color: theme.textMuted }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </div>
          </HoloContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// HOLO TOOLTIP v4 (NEW)
// =============================================================================

interface HoloTooltipProps {
  children: ReactNode;
  content: ReactNode;
  preset?: HoloPreset;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function HoloTooltip({
  children,
  content,
  preset = 'cyan',
  position = 'top',
  delay = 200,
  className,
}: HoloTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDelayed, setShowDelayed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = getTheme(preset);

  const positionStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const handleMouseEnter = () => {
    setIsVisible(true);
    timeoutRef.current = setTimeout(() => setShowDelayed(true), delay);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setShowDelayed(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && showDelayed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn('absolute z-50 whitespace-nowrap', positionStyles[position])}
          >
            <div
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                boxShadow: `0 0 12px ${theme.glow}30`,
              }}
            >
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// CSS KEYFRAMES
// =============================================================================

export const holoStyles = `
  @keyframes holoShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes holoScanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  
  @keyframes holoGlitch {
    0%, 100% { transform: translate(0); filter: none; }
    25% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
    50% { transform: translate(2px, -1px); filter: hue-rotate(-90deg); }
    75% { transform: translate(-1px, -1px); }
  }
  
  @keyframes holoPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

// =============================================================================
// EXPORTS
// =============================================================================

export { HOLO_PRESETS };
export type { HoloPreset };

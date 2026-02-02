import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { sanitizeCss } from '@/lib/security';
import {
  useActiveForumTheme,
  type ForumTheme,
  type ForumTitleAnimation,
  type ForumRoleStyle,
} from '@/stores/forumThemeStore';

// Reserved for future features
const _reservedAnimations = { AnimatePresence };
void _reservedAnimations;

/**
 * ForumThemeRenderer
 *
 * Renders forum theming including:
 * - Animated forum titles
 * - Themed banners with particle effects
 * - Role badges with glow effects
 * - Dynamic CSS variable injection
 */

// ==================== FORUM TITLE COMPONENT ====================

export interface AnimatedForumTitleProps {
  title: string;
  animation?: ForumTitleAnimation;
  speed?: number;
  colors?: { primary: string; secondary: string; accent: string };
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
}

export const AnimatedForumTitle = memo(function AnimatedForumTitle({
  title,
  animation = 'none',
  speed = 2,
  colors = { primary: '#22c55e', secondary: '#16a34a', accent: '#4ade80' },
  className,
  as: Component = 'h1',
}: AnimatedForumTitleProps) {
  const getAnimationStyles = (): React.CSSProperties => {
    switch (animation) {
      case 'gradient':
        return {
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`,
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        };
      case 'glow':
        return {
          textShadow: `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 30px ${colors.secondary}`,
        };
      case 'holographic':
        return {
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent}, ${colors.secondary}, ${colors.primary})`,
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        };
      case 'neon-flicker':
        return {
          color: colors.primary,
          textShadow: `0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}, 0 0 20px ${colors.accent}`,
        };
      case 'fire':
        return {
          background: 'linear-gradient(to top, #ff4500, #ff6b00, #ffd700)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px #ff4500)',
        };
      case 'ice':
        return {
          background: 'linear-gradient(to bottom, #00b4d8, #90e0ef, #caf0f8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 8px #00b4d8)',
        };
      case 'electric':
        return {
          color: '#00f0ff',
          textShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px #00f0ff',
        };
      case 'matrix':
        return {
          color: '#00ff41',
          textShadow: '0 0 5px #00ff41, 0 0 10px #00ff41',
          fontFamily: '"Share Tech Mono", monospace',
        };
      default:
        return { color: colors.primary };
    }
  };

  const getMotionProps = () => {
    const duration = speed;

    switch (animation) {
      case 'gradient':
      case 'holographic':
        return {
          animate: { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] },
          transition: { duration: duration * 2, repeat: Infinity, ease: 'linear' },
        };
      case 'glow':
        return {
          animate: {
            textShadow: [
              `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 30px ${colors.secondary}`,
              `0 0 20px ${colors.primary}, 0 0 40px ${colors.primary}, 0 0 60px ${colors.secondary}`,
              `0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}, 0 0 30px ${colors.secondary}`,
            ],
          },
          transition: { duration, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'neon-flicker':
        return {
          animate: { opacity: [1, 0.8, 1, 0.9, 1, 0.7, 1] },
          transition: { duration: duration * 0.5, repeat: Infinity },
        };
      case 'letter-reveal':
        return {}; // Handled separately
      case 'particle-trail':
        return {}; // Needs separate particle component
      default:
        return {};
    }
  };

  // Letter-by-letter reveal animation
  if (animation === 'letter-reveal') {
    return (
      <Component className={cn('inline-flex', className)} style={getAnimationStyles()}>
        {title.split('').map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </Component>
    );
  }

  return (
    <motion.span
      className={cn('inline-block', className)}
      style={getAnimationStyles()}
      {...(getMotionProps() as Record<string, unknown>)}
    >
      <Component className="m-0">{title}</Component>
    </motion.span>
  );
});

// ==================== ROLE BADGE COMPONENT ====================

export interface RoleBadgeProps {
  role: ForumRoleStyle;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RoleBadge = memo(function RoleBadge({ role, size = 'md', className }: RoleBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const getBadgeStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      color: role.color,
    };

    if (role.glowEffect) {
      base.boxShadow = `0 0 8px ${role.color}40, 0 0 16px ${role.color}20`;
    }

    switch (role.badgeStyle) {
      case 'pill':
        return { ...base, borderRadius: '9999px', border: `1px solid ${role.color}` };
      case 'shield':
        return {
          ...base,
          borderRadius: '4px 4px 50% 50%',
          border: `2px solid ${role.color}`,
          paddingBottom: '0.75rem',
        };
      case 'crown':
        return { ...base, borderRadius: '4px', border: `2px solid ${role.color}` };
      case 'star':
        return { ...base, borderRadius: '4px', border: `1px solid ${role.color}` };
      case 'diamond':
        return {
          ...base,
          borderRadius: '4px',
          border: `2px solid ${role.color}`,
          background: `linear-gradient(135deg, ${role.color}20, transparent)`,
        };
      default:
        return base;
    }
  };

  const getAnimationProps = () => {
    switch (role.animation) {
      case 'pulse':
        return {
          animate: { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] },
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        };
      case 'shimmer':
        return {
          animate: { backgroundPosition: ['200% 0', '-200% 0'] },
          transition: { duration: 3, repeat: Infinity, ease: 'linear' },
        };
      case 'rainbow':
        return {
          animate: {
            borderColor: [
              '#ff0000',
              '#ff7f00',
              '#ffff00',
              '#00ff00',
              '#0000ff',
              '#8b00ff',
              '#ff0000',
            ],
          },
          transition: { duration: 4, repeat: Infinity, ease: 'linear' },
        };
      default:
        return {};
    }
  };

  return (
    <motion.span
      className={cn('inline-flex items-center gap-1 font-medium', sizeClasses[size], className)}
      style={getBadgeStyles()}
      {...(getAnimationProps() as Record<string, unknown>)}
    >
      {role.badgeIcon && <span className="text-current">{role.badgeIcon}</span>}
      {role.name}
    </motion.span>
  );
});

// ==================== FORUM BANNER COMPONENT ====================

export interface ForumBannerProps {
  theme: ForumTheme;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const ForumBanner = memo(function ForumBanner({
  theme,
  title,
  subtitle,
  className,
}: ForumBannerProps) {
  const { banner, colors, titleAnimation, titleAnimationSpeed } = theme;

  const bannerStyle: React.CSSProperties = useMemo(() => {
    const base: React.CSSProperties = {
      height: banner.height,
      position: 'relative',
      overflow: 'hidden',
    };

    switch (banner.type) {
      case 'image':
        return {
          ...base,
          backgroundImage: `url(${banner.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      case 'video':
        return base;
      case 'gradient':
      case 'animated':
        return {
          ...base,
          background: banner.gradient,
        };
      default:
        return base;
    }
  }, [banner]);

  return (
    <motion.div
      className={cn('relative w-full', className)}
      style={bannerStyle}
      animate={banner.parallax ? { backgroundPositionY: ['0%', '10%', '0%'] } : undefined}
      transition={
        banner.parallax ? { duration: 10, repeat: Infinity, ease: 'easeInOut' } : undefined
      }
    >
      {/* Video background */}
      {banner.type === 'video' && banner.url && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={banner.url} type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      {banner.overlay && (
        <div className="absolute inset-0 bg-black" style={{ opacity: banner.overlayOpacity }} />
      )}

      {/* Particle effects */}
      {banner.particleEffect && banner.particleEffect !== 'none' && (
        <BannerParticles effect={banner.particleEffect} />
      )}

      {/* Title content */}
      {(title || subtitle) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          {title && (
            <AnimatedForumTitle
              title={title}
              animation={titleAnimation}
              speed={titleAnimationSpeed}
              colors={{
                primary: colors.primary,
                secondary: colors.secondary,
                accent: colors.accent,
              }}
              className="text-3xl font-bold md:text-5xl"
            />
          )}
          {subtitle && (
            <p className="mt-2 text-lg opacity-80" style={{ color: colors.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
});

// ==================== BANNER PARTICLES ====================

interface BannerParticlesProps {
  effect: 'snow' | 'stars' | 'embers' | 'matrix' | 'bubbles';
}

const BannerParticles = memo(function BannerParticles({ effect }: BannerParticlesProps) {
  const particles = useMemo(() => {
    const count = effect === 'matrix' ? 30 : 20;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    }));
  }, [effect]);

  const getParticleStyle = (particle: (typeof particles)[0]): React.CSSProperties => {
    switch (effect) {
      case 'snow':
        return {
          width: particle.size,
          height: particle.size,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 4px white',
        };
      case 'stars':
        return {
          width: particle.size,
          height: particle.size,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 6px white, 0 0 12px white',
        };
      case 'embers':
        return {
          width: particle.size,
          height: particle.size * 1.5,
          background: 'linear-gradient(to top, #ff4500, #ff6b00, transparent)',
          borderRadius: '50%',
        };
      case 'matrix':
        return {
          width: 2,
          height: 20,
          background: 'linear-gradient(to bottom, #00ff41, transparent)',
          fontFamily: 'monospace',
        };
      case 'bubbles':
        return {
          width: particle.size * 2,
          height: particle.size * 2,
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '50%',
        };
      default:
        return {};
    }
  };

  const getAnimation = (particle: (typeof particles)[0]) => {
    switch (effect) {
      case 'snow':
        return {
          y: ['-10%', '110%'],
          x: [0, Math.sin(particle.id) * 20],
          opacity: [0, 1, 0],
        };
      case 'stars':
        return {
          opacity: [0.3, 1, 0.3],
          scale: [0.8, 1.2, 0.8],
        };
      case 'embers':
        return {
          y: ['100%', '-10%'],
          opacity: [0, 1, 0],
        };
      case 'matrix':
        return {
          y: ['-10%', '110%'],
          opacity: [0, 1, 0],
        };
      case 'bubbles':
        return {
          y: ['100%', '-10%'],
          opacity: [0, 0.5, 0],
          scale: [0.5, 1.5],
        };
      default:
        return {};
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            ...getParticleStyle(particle),
          }}
          animate={getAnimation(particle)}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

// ==================== THEME CSS PROVIDER ====================

export interface ForumThemeProviderProps {
  theme: ForumTheme;
  children: React.ReactNode;
  className?: string;
}

export const ForumThemeProvider = memo(function ForumThemeProvider({
  theme,
  children,
  className,
}: ForumThemeProviderProps) {
  const cssVariables = useMemo((): React.CSSProperties => {
    const { colors, borderRadius, borderWidth, shadows, fontFamily, headerFontFamily, fontSize } =
      theme;

    const radiusMap = {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem',
      full: '9999px',
    };

    const shadowMap = {
      none: 'none',
      subtle: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
      dramatic: '0 10px 25px rgba(0,0,0,0.3), 0 6px 10px rgba(0,0,0,0.2)',
    };

    const fontSizeMap = {
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
    };

    return {
      '--forum-primary': colors.primary,
      '--forum-secondary': colors.secondary,
      '--forum-accent': colors.accent,
      '--forum-background': colors.background,
      '--forum-surface': colors.surface,
      '--forum-elevated': colors.elevated,
      '--forum-text-primary': colors.textPrimary,
      '--forum-text-secondary': colors.textSecondary,
      '--forum-text-muted': colors.textMuted,
      '--forum-border': colors.border,
      '--forum-divider': colors.divider,
      '--forum-success': colors.success,
      '--forum-warning': colors.warning,
      '--forum-error': colors.error,
      '--forum-info': colors.info,
      '--forum-member-color': colors.memberColor,
      '--forum-mod-color': colors.modColor,
      '--forum-admin-color': colors.adminColor,
      '--forum-owner-color': colors.ownerColor,
      '--forum-radius': radiusMap[borderRadius],
      '--forum-border-width': `${borderWidth}px`,
      '--forum-shadow': shadowMap[shadows],
      '--forum-font-family': fontFamily,
      '--forum-header-font-family': headerFontFamily,
      '--forum-font-size': fontSizeMap[fontSize],
      backgroundColor: colors.background,
      color: colors.textPrimary,
      fontFamily: fontFamily,
    } as React.CSSProperties;
  }, [theme]);

  return (
    <div className={cn('forum-theme-container min-h-screen', className)} style={cssVariables}>
      {/* Inject custom CSS - sanitized to prevent CSS injection attacks */}
      {theme.customCss && (
        <style dangerouslySetInnerHTML={{ __html: sanitizeCss(theme.customCss) }} />
      )}

      {/* Glassmorphism backdrop */}
      {theme.glassmorphism && (
        <style>{`
          .forum-theme-container .glass {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
      )}

      {children}
    </div>
  );
});

// ==================== HOOK FOR APPLYING THEME ====================

export function useForumThemeStyles() {
  const theme = useActiveForumTheme();

  if (!theme) {
    return {
      containerStyle: {},
      cardStyle: {},
      buttonStyle: {},
      inputStyle: {},
    };
  }

  const { borderRadius = 'md', glassmorphism = false, shadows = 'subtle' } = theme;
  const colors = theme.colors ?? {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    accent: '#8b5cf6',
  };

  const radiusMap: Record<string, string> = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  };

  const shadowMap: Record<string, string> = {
    none: 'none',
    subtle: '0 1px 3px rgba(0,0,0,0.1)',
    medium: '0 4px 6px rgba(0,0,0,0.1)',
    dramatic: '0 10px 25px rgba(0,0,0,0.3)',
  };

  return {
    containerStyle: {
      backgroundColor: colors.background,
      color: colors.textPrimary,
    },
    cardStyle: {
      backgroundColor: glassmorphism ? 'rgba(255,255,255,0.05)' : colors.surface,
      backdropFilter: glassmorphism ? 'blur(10px)' : 'none',
      border: `1px solid ${colors.border}`,
      borderRadius: radiusMap[borderRadius] ?? radiusMap.md,
      boxShadow: shadowMap[shadows] ?? shadowMap.subtle,
    },
    buttonStyle: {
      backgroundColor: colors.primary,
      color: '#ffffff',
      borderRadius: radiusMap[borderRadius] ?? radiusMap.md,
    },
    inputStyle: {
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      color: colors.textPrimary,
      borderRadius: radiusMap[borderRadius] ?? radiusMap.md,
    },
  };
}

export default ForumThemeProvider;

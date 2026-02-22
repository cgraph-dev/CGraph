/**
 * ForumBanner component
 * @module modules/forums/components/forum-theme-renderer
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ForumBannerProps } from './types';
import { AnimatedForumTitle } from './animated-forum-title';
import { BannerParticles } from './banner-particles';

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

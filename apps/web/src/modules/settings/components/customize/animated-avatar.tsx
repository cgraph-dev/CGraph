/**
 * Animated Avatar Component
 *
 * Renders avatar with various animated border effects.
 * Ported from CustomizationDemo with scalability optimizations.
 *
 * @version 3.0.0 - Extracted border effects to animated-avatar-borders.tsx
 */

import { memo, useMemo, lazy, Suspense } from 'react';
import type { AvatarBorderType, ThemePreset } from '@/modules/settings/store/customization';
import { THEME_COLORS as themeColors } from '@/modules/settings/store/customization';
import { usePrefersReducedMotion } from '@/hooks';
import { renderBorderEffect } from './animated-avatar-borders';

const LottieBorderRenderer = lazy(() =>
  import('@/lib/lottie/lottie-border-renderer').then((m) => ({ default: m.LottieBorderRenderer }))
);

interface AnimatedAvatarProps {
  borderType: AvatarBorderType;
  borderColor: ThemePreset;
  size: 'small' | 'medium' | 'large' | number;
  speedMultiplier?: number;
  src?: string;
  initials?: string;
  /** Lottie JSON URL for 'lottie' border type. */
  lottieUrl?: string;
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
  lottieUrl,
}: AnimatedAvatarProps) {
  const colors = themeColors[borderColor];
  const avatarSize = typeof size === 'number' ? size : sizeMap[size];
  const effectiveSize =
    typeof size === 'number' ? (size <= 48 ? 'small' : size <= 64 ? 'medium' : 'large') : size;
  const borderWidth = effectiveSize === 'small' ? 2 : effectiveSize === 'medium' ? 3 : 4;
  const prefersReducedMotion = usePrefersReducedMotion();

  // GPU layer promotion styles for animated elements
  const gpuStyles = useMemo(
    () => ({
      willChange: prefersReducedMotion ? 'auto' : ('transform, opacity' as const),
      transform: 'translateZ(0)' as const,
    }),
    [prefersReducedMotion]
  );

  const avatarImage = (
    <div
      className="flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gray-700 to-gray-800"
      style={{ width: avatarSize - 4, height: avatarSize - 4 }}
    >
      {src ? (
        <img src={src} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xl font-bold text-white">{initials}</span>
      )}
    </div>
  );

  // Lottie border: wrap avatar directly in LottieBorderRenderer
  // Frame needs extra space for decorative elements (star crown, wings, etc.)
  if (borderType === 'lottie' && lottieUrl) {
    const frameSize = avatarSize + 28; // Lottie frame is larger than avatar
    const outerSize = frameSize + 8; // Container with breathing room
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: outerSize, height: outerSize }}
      >
        <Suspense fallback={avatarImage}>
          <LottieBorderRenderer
            lottieUrl={lottieUrl}
            avatarSize={avatarSize - 8}
            borderWidth={Math.round((frameSize - (avatarSize - 8)) / 2)}
            lottieConfig={{ speed: speedMultiplier }}
          >
            {avatarImage}
          </LottieBorderRenderer>
        </Suspense>
      </div>
    );
  }

  // CSS-based borders
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
        {renderBorderEffect({
          borderType,
          colors,
          borderWidth,
          avatarSize,
          speedMultiplier,
          gpuStyles,
          prefersReducedMotion,
          lottieUrl,
        })}
      </div>

      {/* Avatar image */}
      <div className="relative z-10">{avatarImage}</div>
    </div>
  );
});

export default AnimatedAvatar;

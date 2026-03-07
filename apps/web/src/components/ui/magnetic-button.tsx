/**
 * Magnetic button hook and wrapper — cursor-following displacement effect.
 *
 * Uses spring-smoothed translation toward the cursor when hovering.
 * Consumes `buttonPresets.magnetic` from @cgraph/animation-constants.
 *
 * @module components/ui/magnetic-button
 */
import { useRef, useCallback } from 'react';
import { motion, useSpring, type HTMLMotionProps } from 'motion/react';
import { buttonPresets } from '@cgraph/animation-constants';
import { useMotionSafe } from '@/hooks/useMotionSafe';

interface MagneticStyle {
  x: ReturnType<typeof useSpring>;
  y: ReturnType<typeof useSpring>;
}

interface UseMagneticButtonReturn {
  ref: React.RefObject<HTMLButtonElement | null>;
  style: MagneticStyle;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

/**
 * Hook for magnetic cursor-following button displacement.
 */
export function useMagneticButton(): UseMagneticButtonReturn {
  const ref = useRef<HTMLButtonElement>(null);
  const { shouldAnimate } = useMotionSafe();
  const { pullStrength, maxDisplacement, springConfig } = buttonPresets.magnetic;

  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!shouldAnimate || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) * pullStrength;
      const dy = (e.clientY - centerY) * pullStrength;
      x.set(Math.max(-maxDisplacement, Math.min(maxDisplacement, dx)));
      y.set(Math.max(-maxDisplacement, Math.min(maxDisplacement, dy)));
    },
    [shouldAnimate, pullStrength, maxDisplacement, x, y]
  );

  const onMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { ref, style: { x, y }, onMouseMove, onMouseLeave };
}

/**
 * MagneticButton — wraps motion.button with cursor-following magnetic pull.
 */
export function MagneticButton({
  children,
  className,
  ...props
}: HTMLMotionProps<'button'> & { ref?: React.Ref<HTMLButtonElement> }) {
  const { ref, style, onMouseMove, onMouseLeave } = useMagneticButton();

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ x: style.x, y: style.y }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </motion.button>
  );
}

MagneticButton.displayName = 'MagneticButton';

/**
 * MagneticButton Component - Button with magnetic cursor attraction
 *
 * Features:
 * - Cursor follows button when nearby (magnetic pull)
 * - GSAP-powered smooth animation
 * - Glow pulse animation
 * - Multiple variants (primary, secondary, ghost)
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import {
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type MagneticButtonVariant = 'primary' | 'secondary' | 'ghost' | 'hot';

interface MagneticButtonBaseProps {
  /** Button content */
  children: ReactNode;
  /** Visual variant */
  variant?: MagneticButtonVariant;
  /** Magnetic pull strength (0-1) */
  strength?: number;
  /** Enable glow animation */
  glowing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface MagneticButtonButtonProps
  extends MagneticButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Render as link */
  href?: never;
}

interface MagneticButtonLinkProps
  extends MagneticButtonBaseProps, Omit<LinkProps, 'children' | 'className' | 'to'> {
  /** Render as link (mapped to 'to' internally) */
  href: string;
}

type MagneticButtonProps = MagneticButtonButtonProps | MagneticButtonLinkProps;

// ============================================================================
// STYLES
// ============================================================================

const BASE_CLASSES = `
  relative inline-flex items-center justify-center gap-2
  px-6 py-3 rounded-xl font-medium text-sm
  transition-colors duration-200
  focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900
`;

const VARIANT_CLASSES: Record<MagneticButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-emerald-500 to-cyan-500
    text-white
    hover:from-emerald-400 hover:to-cyan-400
    focus-visible:ring-emerald-500
  `,
  secondary: `
    bg-gradient-to-r from-purple-500 to-pink-500
    text-white
    hover:from-purple-400 hover:to-pink-400
    focus-visible:ring-purple-500
  `,
  ghost: `
    bg-white/5 border border-white/10
    text-white
    hover:bg-white/10 hover:border-white/20
    focus-visible:ring-white/50
  `,
  hot: `
    bg-gradient-to-r from-orange-500 to-red-500
    text-white
    hover:from-orange-400 hover:to-red-400
    focus-visible:ring-orange-500
  `,
};

const GLOW_CLASSES: Record<MagneticButtonVariant, string> = {
  primary: 'glow-button',
  secondary: '',
  ghost: '',
  hot: '',
};

// ============================================================================
// HOOK: useMagneticEffect
// ============================================================================

function useMagneticEffect(ref: React.RefObject<HTMLElement>, strength: number = 0.3) {
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: 'power2.out',
      });
    },
    [ref, strength]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    gsap.to(el, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    });
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, handleMouseMove, handleMouseLeave]);
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MagneticButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  MagneticButtonProps
>(function MagneticButton(props, forwardedRef) {
  const {
    children,
    variant = 'primary',
    strength = 0.3,
    glowing = false,
    className,
    ...rest
  } = props;

  const localRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const ref = (forwardedRef as React.RefObject<HTMLElement>) ?? localRef;

  useMagneticEffect(ref as React.RefObject<HTMLElement>, strength);

  const classes = cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    glowing && GLOW_CLASSES[variant],
    className
  );

  // Render as Link if href is provided
  if ('href' in rest && rest.href) {
    const { href, ...linkProps } = rest as MagneticButtonLinkProps;
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} to={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  // Render as button
  const buttonProps = rest as Omit<MagneticButtonButtonProps, keyof MagneticButtonBaseProps>;
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...buttonProps}>
      {children}
    </button>
  );
});

// ============================================================================
// EXPORTS
// ============================================================================

export type { MagneticButtonProps, MagneticButtonVariant };

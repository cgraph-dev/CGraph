/**
 * PageContainer Component
 *
 * Wrapper component for page content with consistent styling.
 * Features:
 * - Responsive padding
 * - Max-width constraints
 * - Animation on mount
 * - Header and footer slots
 */

import React from 'react';
import { motion } from 'motion/react';
import { tweens } from '@/lib/animation-presets';

export interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

/**
 * unknown for the layout module.
 */
/**
 * Page Container — route-level page component.
 */
export function PageContainer({
  children,
  title,
  subtitle,
  header,
  footer,
  actions,
  maxWidth = 'xl',
  padding = 'md',
  animate = true,
  className = '',
}: PageContainerProps): React.ReactElement {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-2 py-3 sm:px-4 sm:py-4',
    md: 'px-4 py-4 sm:px-6 sm:py-6',
    lg: 'px-6 py-6 sm:px-8 sm:py-8',
  };

  const Container = animate ? motion.div : 'div';

  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
        transition: tweens.fast,
      }
    : {};

  return (
    <Container
      {...animationProps}
      className={`w-full ${maxWidthClasses[maxWidth]} mx-auto ${paddingClasses[padding]} ${className} `}
    >
      {/* Header section */}
      {(title || subtitle || header || actions) && (
        <div className="mb-6">
          {header || (
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
                {subtitle && <p className="mt-1 text-white/60">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1">{children}</div>

      {/* Footer section */}
      {footer && <div className="mt-6">{footer}</div>}
    </Container>
  );
}

export default PageContainer;

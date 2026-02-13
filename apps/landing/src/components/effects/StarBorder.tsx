/**
 * StarBorder — Animated star-light border effect
 *
 * Adapted from ReactBits (MIT). Two radial-gradient "stars" orbit the
 * top and bottom edges of the container, producing a sleek animated border.
 *
 * @module components/effects/StarBorder
 */

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import './StarBorder.css';

type StarBorderProps<T extends ElementType = 'div'> = {
  /** Render as a different HTML element */
  as?: T;
  /** Star color — defaults to CGraph emerald */
  color?: string;
  /** Animation duration — defaults to '6s' */
  speed?: string;
  children?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'color' | 'children' | 'className'>;

export default function StarBorder<T extends ElementType = 'div'>({
  as,
  className = '',
  color = '#10b981',
  speed = '6s',
  children,
  ...rest
}: StarBorderProps<T>) {
  const Component = as || 'div';

  return (
    <Component className={`star-border-container ${className}`} {...rest}>
      <div
        className="star-border__gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="star-border__gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="star-border__inner">{children}</div>
    </Component>
  );
}

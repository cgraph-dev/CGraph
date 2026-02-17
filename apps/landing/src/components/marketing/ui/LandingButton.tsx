import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FlowingBorder } from '../../customization-demo/effects';

export interface LandingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

/**
 * LandingButton - CGraph Primitive
 *
 * A high-fidelity button component with:
 * - Magnetic pull on hover
 * - Gradient border with internal glow
 * - "Shimmer" idle animation
 * - Accessible focus states
 */
export const LandingButton: React.FC<LandingButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  href,
  className = '',
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.2; // Magnetic strength
    const y = (clientY - (top + height / 2)) * 0.2;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none group isolate overflow-hidden';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-full',
    md: 'px-8 py-3 text-base rounded-full',
    lg: 'px-10 py-4 text-lg rounded-full',
  };

  const variantStyles = {
    primary:
      'text-white bg-black/20 backdrop-blur-sm border border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)]',
    secondary:
      'text-white bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'text-gray-300 hover:text-white hover:bg-white/5',
  };

  const Content = (
    <>
      {variant === 'primary' && (
        <span className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}

      {/* Button Text */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon && (
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            {icon}
          </span>
        )}
      </span>

      {/* Primary Gradient Glow (Bottom Edge) */}
      {variant === 'primary' && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-gradient-to-r from-transparent via-emerald-500 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
      )}

      {/* Secondary Animated Gradient Border */}
      {variant === 'secondary' && <FlowingBorder variant="button" borderRadius="9999px" />}
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        onMouseMove={handleMouseMove as React.MouseEventHandler}
        onMouseLeave={handleMouseLeave}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      >
        {Content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      {...(props as Record<string, unknown>)}
    >
      {Content}
    </motion.button>
  );
};

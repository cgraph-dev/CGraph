/**
 * AuthCard Component
 *
 * Animated card container for auth pages.
 * Features:
 * - Glassmorphism styling
 * - Animated gradient border
 * - Multiple variants
 * - Logo placement
 * - Responsive design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlassCard from '@/components/ui/GlassCard';

export interface AuthCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'compact' | 'split';
  showLogo?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  backgroundEffect?: 'gradient' | 'particles' | 'grid' | 'none';
  className?: string;
}

const Logo: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Link to="/" className="group inline-flex items-center gap-3">
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className={`
          flex items-center justify-center rounded-xl
          bg-gradient-to-br from-primary-500 to-purple-600
          ${sizeClasses[size]}
        `}
      >
        <svg
          className="h-2/3 w-2/3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </motion.div>
      <span className={`font-bold text-white ${textSizes[size]}`}>
        CGraph
      </span>
    </Link>
  );
};

const GridBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  </div>
);

const GradientBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        background: [
          'radial-gradient(circle at 20% 80%, rgba(var(--color-primary-500), 0.3) 0%, transparent 50%)',
          'radial-gradient(circle at 80% 20%, rgba(var(--color-primary-500), 0.3) 0%, transparent 50%)',
          'radial-gradient(circle at 20% 80%, rgba(var(--color-primary-500), 0.3) 0%, transparent 50%)',
        ],
      }}
      transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
      className="absolute inset-0"
    />
  </div>
);

const ParticlesBackground: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{
          x: Math.random() * 100 + '%',
          y: Math.random() * 100 + '%',
          opacity: Math.random() * 0.5 + 0.2,
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{
          y: [null, Math.random() * 100 + '%'],
          x: [null, Math.random() * 100 + '%'],
        }}
        transition={{
          repeat: Infinity,
          duration: Math.random() * 20 + 10,
          ease: 'linear',
        }}
        className="absolute w-1 h-1 bg-primary-500/30 rounded-full"
      />
    ))}
  </div>
);

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  variant = 'default',
  showLogo = true,
  logoSize = 'md',
  title,
  subtitle,
  footer,
  backgroundEffect = 'gradient',
  className = '',
}) => {
  const renderBackground = () => {
    switch (backgroundEffect) {
      case 'gradient':
        return <GradientBackground />;
      case 'particles':
        return <ParticlesBackground />;
      case 'grid':
        return <GridBackground />;
      default:
        return null;
    }
  };

  if (variant === 'split') {
    return (
      <div className={`min-h-screen flex ${className}`}>
        {/* Left side - branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 to-purple-700 p-12 flex-col justify-between"
        >
          {renderBackground()}
          
          <div className="relative">
            {showLogo && <Logo size={logoSize} />}
          </div>
          
          <div className="relative space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold text-white"
            >
              Connect with your community
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/70"
            >
              Join millions of people sharing, learning, and building together.
            </motion.p>
          </div>

          <div className="relative text-sm text-white/50">
            © {new Date().getFullYear()} CGraph. All rights reserved.
          </div>
        </motion.div>

        {/* Right side - form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex items-center justify-center p-8 bg-dark-900"
        >
          <div className="w-full max-w-md">
            {showLogo && (
              <div className="lg:hidden mb-8 text-center">
                <Logo size={logoSize} />
              </div>
            )}
            
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white"
                  >
                    {title}
                  </motion.h2>
                )}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-2 text-white/60"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
            )}

            {children}

            {footer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                {footer}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-sm mx-auto ${className}`}
      >
        <GlassCard variant="frosted" className="p-6 relative overflow-hidden">
          {renderBackground()}
          
          <div className="relative">
            {showLogo && (
              <div className="mb-6 text-center">
                <Logo size="sm" />
              </div>
            )}

            {(title || subtitle) && (
              <div className="mb-6 text-center">
                {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
              </div>
            )}

            {children}

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className={`w-full max-w-md mx-auto ${className}`}
    >
      <GlassCard variant="crystal" className="p-8 relative overflow-hidden">
        {/* Animated border */}
        <motion.div
          animate={{
            background: [
              'linear-gradient(0deg, transparent, rgba(var(--color-primary-500), 0.5), transparent)',
              'linear-gradient(180deg, transparent, rgba(var(--color-primary-500), 0.5), transparent)',
              'linear-gradient(360deg, transparent, rgba(var(--color-primary-500), 0.5), transparent)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ padding: 1 }}
        />

        {renderBackground()}
        
        <div className="relative">
          {showLogo && (
            <div className="mb-8 text-center">
              <Logo size={logoSize} />
            </div>
          )}

          {(title || subtitle) && (
            <div className="mb-8 text-center">
              {title && (
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold text-white"
                >
                  {title}
                </motion.h2>
              )}
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-2 text-white/60"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          )}

          {children}

          {footer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              {footer}
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default AuthCard;

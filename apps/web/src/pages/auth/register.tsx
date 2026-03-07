/**
 * User registration page.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { OAuthButtonGroup } from '@/modules/auth/components/o-auth-buttons';
import {
  TextScramble,
  GlitchText,
  prefersReducedMotion,
} from '@/modules/auth/components/auth-effects';
import { LogoIcon } from '@/components/logo';
import { createLogger } from '@/lib/logger';
import { useRegisterForm } from './register/useRegisterForm';
import { AuthErrorAlert } from './register/auth-error-alert';
import { RegisterFormFields } from './register/register-form-fields';

const logger = createLogger('Register');

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slower.ms / 1000, ease: 'easeOut' as const },
  },
};

// Header variant: NO opacity so TextScramble/GlitchText are visible immediately
const headerVariants = {
  hidden: { y: 15 },
  visible: {
    y: 0,
    transition: { duration: durations.smooth.ms / 1000, ease: 'easeOut' as const },
  },
};

/**
 * Register component.
 */
export default function Register() {
  const navigate = useNavigate();
  const reduced = prefersReducedMotion();
  const form = useRegisterForm();

  return (
    <motion.div
      className="space-y-8"
      variants={reduced ? {} : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Mobile Logo with matrix glow */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center lg:hidden">
        <a href="https://www.cgraph.org" className="group inline-flex items-center gap-3">
          <motion.div
            whileHover={reduced ? {} : { scale: 1.1, rotate: 5 }}
            whileTap={reduced ? {} : { scale: 0.95 }}
          >
            <LogoIcon size={96} color="gradient" showGlow={false} />
          </motion.div>
        </a>
      </motion.div>

      {/* Header with cyberpunk text effect */}
      <motion.div variants={reduced ? {} : headerVariants} className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">
          <GlitchText text="Create your account" className="matrix-glow" />
        </h2>
        <p className="mt-2 text-foreground-muted">
          <TextScramble
            text="Join the community and start connecting"
            delay={1000}
            scrambleSpeed={80}
          />
        </p>
      </motion.div>

      <AuthErrorAlert error={form.displayError} />

      {/* Register Form with staggered animations */}
      <form action={form.formAction} className="space-y-5">
        <RegisterFormFields
          showPassword={form.showPassword}
          setShowPassword={form.setShowPassword}
          showConfirmPassword={form.showConfirmPassword}
          setShowConfirmPassword={form.setShowConfirmPassword}
          isLoading={form.isLoading}
        />
      </form>

      {/* Divider with matrix styling */}
      <motion.div variants={reduced ? {} : itemVariants} className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-transparent px-4 text-foreground-muted backdrop-blur-sm">
            Or sign up with
          </span>
        </div>
      </motion.div>

      {/* OAuth Buttons with matrix hover effects */}
      <motion.div variants={reduced ? {} : itemVariants}>
        <OAuthButtonGroup
          providers={['google', 'apple', 'facebook', 'tiktok']}
          variant="icon"
          onSuccess={() => navigate('/messages')}
          onError={(err) => logger.error('OAuth error:', err)}
        />
      </motion.div>

      {/* Sign In Link with matrix styling */}
      <motion.p
        variants={reduced ? {} : itemVariants}
        className="text-center text-foreground-muted"
      >
        Already have an account?{' '}
        <Link to="/login" className="matrix-link font-medium">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}

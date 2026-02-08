import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OAuthButtonGroup } from '@/modules/auth/components/OAuthButtons';
import {
  TextScramble,
  GlitchText,
  prefersReducedMotion,
} from '@/modules/auth/components/AuthEffects';
import { createLogger } from '@/lib/logger';
import { useRegisterForm } from './register/useRegisterForm';
import { AuthErrorAlert } from './register/AuthErrorAlert';
import { RegisterFormFields } from './register/RegisterFormFields';

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
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

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
        <Link to="/" className="group inline-flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 transition-all duration-300 group-hover:bg-primary-500 group-hover:shadow-glow-md"
            whileHover={reduced ? {} : { scale: 1.1, rotate: 5 }}
            whileTap={reduced ? {} : { scale: 0.95 }}
          >
            <svg
              className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110"
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
          <span className="matrix-glow text-2xl font-bold text-white">CGraph</span>
        </Link>
      </motion.div>

      {/* Header with cyberpunk text effect */}
      <motion.div variants={reduced ? {} : itemVariants} className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">
          <GlitchText text="Create your account" className="matrix-glow" />
        </h2>
        <p className="mt-2 text-gray-400">
          <TextScramble text="Join the community and start connecting" delay={500} />
        </p>
      </motion.div>

      <AuthErrorAlert error={form.displayError} />

      {/* Register Form with staggered animations */}
      <form onSubmit={form.handleSubmit} className="space-y-5">
        <RegisterFormFields
          email={form.email}
          setEmail={form.setEmail}
          username={form.username}
          setUsername={form.setUsername}
          password={form.password}
          setPassword={form.setPassword}
          confirmPassword={form.confirmPassword}
          setConfirmPassword={form.setConfirmPassword}
          showPassword={form.showPassword}
          setShowPassword={form.setShowPassword}
          showConfirmPassword={form.showConfirmPassword}
          setShowConfirmPassword={form.setShowConfirmPassword}
          agreeToTerms={form.agreeToTerms}
          setAgreeToTerms={form.setAgreeToTerms}
          isLoading={form.isLoading}
        />
      </form>

      {/* Divider with matrix styling */}
      <motion.div variants={reduced ? {} : itemVariants} className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-transparent px-4 text-gray-500 backdrop-blur-sm">
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
      <motion.p variants={reduced ? {} : itemVariants} className="text-center text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="matrix-link font-medium">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}

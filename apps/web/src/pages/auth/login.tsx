import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { OAuthButtonGroup } from '@/modules/auth/components/o-auth-buttons';
import {
  TextScramble,
  GlitchText,
  prefersReducedMotion,
} from '@/modules/auth/components/auth-effects';
import { AuthErrorAlert } from '@/pages/auth/register/auth-error-alert';
import { useLoginForm } from '@/pages/auth/login/useLoginForm';
import { LoginFormFields } from '@/pages/auth/login/login-form-fields';
import { LogoIcon } from '@/components/logo';
import { SubmitButton } from '@/components/ui/submit-button';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Login');

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
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

// Header variant: NO opacity animation so TextScramble/GlitchText are visible immediately
const headerVariants = {
  hidden: { y: 15 },
  visible: {
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export default function Login() {
  const navigate = useNavigate();
  const reduced = prefersReducedMotion();
  const { t } = useTranslation('auth');

  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    error,
    handleSubmit,
    handleWalletConnect,
  } = useLoginForm();

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
            <LogoIcon size={40} color="gradient" showGlow={false} />
          </motion.div>
          <span className="matrix-glow text-2xl font-bold text-white">{t('common:app_name')}</span>
        </a>
      </motion.div>

      {/* Header with cyberpunk text effect */}
      <motion.div variants={reduced ? {} : headerVariants} className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white">
          <GlitchText text={t('login.title')} className="matrix-glow" />
        </h2>
        <p className="mt-2 text-gray-400">
          <TextScramble
            text={t('login.subtitle')}
            delay={1000}
            scrambleSpeed={80}
          />
        </p>
      </motion.div>

      {/* Error Alert — reused from register */}
      <AuthErrorAlert error={error} />

      {/* Login Form with staggered animations */}
      <form action={handleSubmit} className="space-y-6">
        <LoginFormFields
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          itemVariants={reduced ? undefined : itemVariants}
          reduced={reduced}
        />

        <motion.div variants={reduced ? {} : itemVariants}>
          <SubmitButton
            pendingText={t('login.signing_in')}
            className="matrix-button w-full py-3"
            disabled={isLoading}
          >
            <span>{t('login.submit')}</span>
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </SubmitButton>
        </motion.div>
      </form>

      {/* Divider with matrix styling */}
      <motion.div variants={reduced ? {} : itemVariants} className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-600/50" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-transparent px-4 text-gray-500 backdrop-blur-sm">
            {t('login.or_continue_with')}
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

      {/* Wallet Login with matrix styling */}
      <motion.button
        onClick={handleWalletConnect}
        disabled={isLoading}
        variants={reduced ? {} : itemVariants}
        whileHover={
          reduced || isLoading ? {} : { scale: 1.02, borderColor: 'rgba(139, 92, 246, 0.5)' }
        }
        whileTap={reduced || isLoading ? {} : { scale: 0.98 }}
        className="group flex w-full items-center justify-center gap-3 rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 font-medium text-white transition-all duration-300 hover:border-violet-500/30 hover:bg-dark-700/80 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
      >
        <motion.svg
          className="h-5 w-5"
          viewBox="0 0 40 40"
          fill="none"
          whileHover={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <path
            d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z"
            fill="#627EEA"
          />
          <path d="M20.498 5V16.0875L29.995 20.2L20.498 5Z" fill="white" fillOpacity="0.602" />
          <path d="M20.498 5L11 20.2L20.498 16.0875V5Z" fill="white" />
          <path
            d="M20.498 27.4525V35.0025L30 21.815L20.498 27.4525Z"
            fill="white"
            fillOpacity="0.602"
          />
          <path d="M20.498 35.0025V27.4512L11 21.815L20.498 35.0025Z" fill="white" />
          <path
            d="M20.498 25.8363L29.995 20.2L20.498 16.09V25.8363Z"
            fill="white"
            fillOpacity="0.2"
          />
          <path d="M11 20.2L20.498 25.8363V16.09L11 20.2Z" fill="white" fillOpacity="0.602" />
        </motion.svg>
        <span>{t('login.connect_wallet')}</span>
      </motion.button>

      {/* Sign Up Link with matrix styling */}
      <motion.p variants={reduced ? {} : itemVariants} className="text-center text-gray-400">
        {t('login.no_account')}{' '}
        <Link to="/register" className="matrix-link font-medium">
          {t('login.sign_up')}
        </Link>
      </motion.p>
    </motion.div>
  );
}

// Type declaration for MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

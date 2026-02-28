/**
 * Login form input fields — email/username and password.
 *
 * @module pages/auth/login/LoginFormFields
 */

import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PasswordToggleButton } from '@/pages/auth/register/password-toggle-button';

interface LoginFormFieldsProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  itemVariants: Variants | undefined;
  reduced: boolean;
}

/**
 * unknown for the auth module.
 */
/**
 * Login Form Fields component.
 */
export function LoginFormFields({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  itemVariants,
  reduced,
}: LoginFormFieldsProps) {
  const { t } = useTranslation('auth');
  return (
    <>
      <motion.div variants={itemVariants}>
        <label
          htmlFor="identifier"
          className="mb-2 block text-sm font-medium text-foreground-secondary"
        >
          {t('login.email_or_username')}
        </label>
        <motion.input
          id="identifier"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 text-foreground placeholder-foreground-muted transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          placeholder={t('login.email_placeholder')}
          whileFocus={reduced ? {} : { scale: 1.01 }}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-foreground-secondary"
        >
          {t('login.password')}
        </label>
        <div className="relative">
          <motion.input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="matrix-input w-full rounded-lg border border-dark-600 bg-dark-800/80 px-4 py-3 pr-12 text-foreground placeholder-foreground-muted transition-all duration-300 hover:border-dark-500 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            placeholder="••••••••"
            whileFocus={reduced ? {} : { scale: 1.01 }}
          />
          <PasswordToggleButton
            show={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <label className="group flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-primary-500 transition-all checked:border-primary-600 checked:bg-primary-600 focus:ring-primary-500/50 focus:ring-offset-0"
          />
          <span className="text-sm text-foreground-muted transition-colors group-hover:text-foreground-secondary">
            {t('login.remember_me')}
          </span>
        </label>
        <Link to="/forgot-password" className="matrix-link text-sm">
          {t('forgot_password.title')}
        </Link>
      </motion.div>
    </>
  );
}

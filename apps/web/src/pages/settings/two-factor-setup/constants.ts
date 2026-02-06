/**
 * TwoFactorSetup animation constants
 * @module pages/settings/two-factor-setup
 */

export const STEPS: readonly string[] = ['intro', 'scan', 'verify', 'backup', 'complete'] as const;

export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const FEATURES = [
  {
    icon: '🔐',
    title: 'Enhanced Security',
    desc: 'Protect your account from unauthorized access',
  },
  {
    icon: '📱',
    title: 'Authenticator App',
    desc: 'Use Google Authenticator, Authy, or similar',
  },
  {
    icon: '💾',
    title: 'Backup Codes',
    desc: 'Get recovery codes in case you lose access',
  },
];

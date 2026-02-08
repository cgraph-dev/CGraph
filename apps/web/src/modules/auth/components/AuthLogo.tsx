import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export type LogoSize = 'sm' | 'md' | 'lg';

const LOGO_SIZE_CLASSES: Record<LogoSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const LOGO_TEXT_SIZES: Record<LogoSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export const AuthLogo: React.FC<{ size: LogoSize }> = ({ size }) => (
  <Link to="/" className="group inline-flex items-center gap-3">
    <motion.div
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 ${LOGO_SIZE_CLASSES[size]} `}
    >
      <svg className="h-2/3 w-2/3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </motion.div>
    <span className={`font-bold text-white ${LOGO_TEXT_SIZES[size]}`}>CGraph</span>
  </Link>
);

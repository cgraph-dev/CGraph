/**
 * Redirect component to customization page.
 * @module
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';

interface RedirectToCustomizeProps {
  section: string;
}

export function RedirectToCustomize({ section }: RedirectToCustomizeProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect after a brief delay to show the message
    const timer = setTimeout(() => {
      navigate(`/customize/${section}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, section]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex h-full items-center justify-center"
    >
      <GlassCard variant="holographic" className="max-w-md p-8 text-center">
        <SparklesIcon className="mx-auto mb-4 h-16 w-16 text-primary-400" />
        <h2 className="mb-2 text-2xl font-bold text-white">Moved to Customize!</h2>
        <p className="mb-4 text-white/60">
          This setting has been moved to the new Customize hub for better organization.
        </p>
        <p className="text-sm text-white/40">Redirecting you now...</p>
      </GlassCard>
    </motion.div>
  );
}

/**
 * Profile loading and error state components.
 * @module
 */
import { durations } from '@cgraph/animation-constants';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens, loop } from '@/lib/animation-presets';

interface AmbientParticlesProps {
  count?: number;
}

/**
 * unknown for the social module.
 */
/**
 * Ambient Particles component.
 */
export function AmbientParticles({ count = 10 }: AmbientParticlesProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: durations.epic.ms / 1000 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

/**
 * unknown for the social module.
 */
/**
 * Profile Loading State — loading placeholder.
 */
export function ProfileLoadingState() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <AmbientParticles count={10} />
      <div className="relative">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={loop(tweens.slow)}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary-400/30"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={loop(tweens.ambient)}
        />
      </div>
    </div>
  );
}

interface ProfileErrorStateProps {
  error: string | null;
}

/**
 * unknown for the social module.
 */
/**
 * Profile Error State — fallback UI for error states.
 */
export function ProfileErrorState({ error }: ProfileErrorStateProps) {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <AmbientParticles count={10} />
      <GlassCard variant="holographic" className="relative z-10 p-8">
        <p className="mb-4 text-gray-400">{error || 'User not found'}</p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="secondary"
            onClick={() => {
              navigate(-1);
              HapticFeedback.medium();
            }}
          >
            Go Back
          </Button>
        </motion.div>
      </GlassCard>
    </div>
  );
}

interface ProfileInvalidUserProps {
  onGoBack: () => void;
}

/**
 * unknown for the social module.
 */
/**
 * Profile Invalid User component.
 */
export function ProfileInvalidUser({ onGoBack }: ProfileInvalidUserProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-900 p-8">
      <GlassCard variant="frosted" className="max-w-md p-8 text-center">
        <h2 className="mb-4 text-xl font-bold text-white">Failed to load user profile</h2>
        <p className="mb-6 text-gray-400">The user profile could not be found or is invalid.</p>
        <button
          onClick={onGoBack}
          className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Go Back
        </button>
      </GlassCard>
    </div>
  );
}

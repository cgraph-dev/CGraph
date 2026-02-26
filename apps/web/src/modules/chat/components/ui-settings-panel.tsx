/**
 * Chat UI settings panel component.
 * @module
 */
import { motion } from 'framer-motion';
import { GlassCard } from '@/shared/components/ui';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { UIPreferences } from './message-bubble';
import { tweens } from '@/lib/animation-presets';

type AnimationIntensity = UIPreferences['animationIntensity'];

export interface UISettingsPanelProps {
  uiPreferences: UIPreferences;
  setUiPreferences: React.Dispatch<React.SetStateAction<UIPreferences>>;
  updatePreference: <K extends keyof UIPreferences>(key: K, value: UIPreferences[K]) => void;
}

/**
 * UISettingsPanel - Next Gen UI Customization panel
 * Allows users to customize visual effects, animations, and themes
 */
export function UISettingsPanel({
  uiPreferences,
  setUiPreferences,
  updatePreference,
}: UISettingsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      transition={tweens.standard}
      className="z-20"
    >
      <GlassCard variant="neon" glow className="mx-4 mt-4 rounded-2xl p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-primary-500/20 pb-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <SparklesIcon className="h-5 w-5 text-primary-400" />
              Next Gen UI Customization
            </h3>
            <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs text-gray-400">
              BETA
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Glass Effect */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Glass Effect</label>
              <select
                value={uiPreferences.glassEffect}
                onChange={(e) =>
                  updatePreference(
                    'glassEffect',
                     
                    e.target.value as UIPreferences['glassEffect'] /* safe downcast – event value */
                  )
                }
                className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                <option value="default">Default</option>
                <option value="frosted">Frosted</option>
                <option value="crystal">Crystal</option>
                <option value="neon">Neon</option>
                <option value="holographic">Holographic</option>
              </select>
            </div>

            {/* Voice Visualizer Theme */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Voice Theme</label>
              <select
                value={uiPreferences.voiceVisualizerTheme}
                onChange={(e) =>
                  updatePreference(
                    'voiceVisualizerTheme',
                     
                    e.target
                      .value as UIPreferences['voiceVisualizerTheme'] /* safe downcast – event value */
                  )
                }
                className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                <option value="matrix-green">Matrix Green</option>
                <option value="cyber-blue">Cyber Blue</option>
                <option value="neon-pink">Neon Pink</option>
                <option value="amber">Amber</option>
              </select>
            </div>

            {/* Animation Intensity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Animation Intensity
              </label>
              <select
                value={uiPreferences.animationIntensity}
                onChange={(e) =>
                  updatePreference(
                    'animationIntensity',
                     
                    e.target.value as AnimationIntensity /* safe downcast – event value */
                  )
                }
                className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                <option value="low">Low (Performance)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Beautiful)</option>
              </select>
            </div>

            {/* Message Animation */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Message Animation
              </label>
              <select
                value={uiPreferences.messageEntranceAnimation}
                onChange={(e) =>
                  updatePreference(
                    'messageEntranceAnimation',
                     
                    e.target
                      .value as UIPreferences['messageEntranceAnimation'] /* safe downcast – event value */
                  )
                }
                className="w-full rounded-lg border border-primary-500/30 bg-dark-700/50 px-3 py-2 text-sm text-white transition-colors focus:border-primary-500 focus:outline-none"
              >
                <option value="slide">Slide</option>
                <option value="scale">Scale</option>
                <option value="fade">Fade</option>
                <option value="bounce">Bounce</option>
              </select>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'showParticles', label: 'Particles' },
              { key: 'enableGlow', label: 'Glow Effects' },
              { key: 'enable3D', label: '3D Effects' },
              { key: 'enableHaptic', label: 'Haptic' },
            ].map(({ key, label }) => (
              <motion.button
                key={key}
                onClick={() => {
                  setUiPreferences({
                    ...uiPreferences,
                     
                    [key]: !uiPreferences[key as keyof typeof uiPreferences],
                  });
                  if (uiPreferences.enableHaptic) HapticFeedback.light();
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                   
                  uiPreferences[key as keyof typeof uiPreferences]
                    ? 'bg-primary-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'border border-dark-600 bg-dark-700/50 text-gray-400'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default UISettingsPanel;

/**
 * AppearancePanel Component
 *
 * Forum appearance customization panel with:
 * - Live preview
 * - Theme presets
 * - Custom colors
 * - Icon/banner images
 * - Custom CSS
 */

import { motion } from 'motion/react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ForumAppearance } from '../types';
import { THEME_PRESETS } from '../constants';

export interface AppearancePanelProps {
  appearance: ForumAppearance;
  setAppearance: React.Dispatch<React.SetStateAction<ForumAppearance>>;
  forumName: string;
  displayName: string;
  memberCount: number;
}

/**
 * unknown for the forums module.
 */
/**
 * Appearance Panel component.
 */
export function AppearancePanel({
  appearance,
  setAppearance,
  forumName,
  displayName,
  memberCount,
}: AppearancePanelProps) {
  return (
    <motion.div
      key="appearance"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Appearance</h2>
        <p className="text-gray-400">Customize your forum's look and feel.</p>
      </div>

      {/* Preview */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Live Preview</h3>
        <div
          className="overflow-hidden rounded-xl border border-white/[0.08]"
          style={
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            {
              '--primary': appearance.primaryColor,
              '--secondary': appearance.secondaryColor,
            } as React.CSSProperties // safe downcast – CSS custom properties
          }
        >
          {appearance.bannerUrl ? (
            <div
              className="h-32 bg-cover bg-center"
              style={{ backgroundImage: `url(${appearance.bannerUrl})` }}
            />
          ) : (
            <div
              className="h-32"
              style={{
                background: `linear-gradient(135deg, ${appearance.primaryColor}, ${appearance.secondaryColor})`,
              }}
            />
          )}
          <div className="flex items-center gap-4 bg-white/[0.04] p-4">
            {appearance.iconUrl ? (
              <img
                src={appearance.iconUrl}
                alt=""
                className="-mt-12 h-16 w-16 rounded-xl border-4 border-dark-800 object-cover"
              />
            ) : (
              <div
                className="-mt-12 flex h-16 w-16 items-center justify-center rounded-xl border-4 border-dark-800"
                style={{
                  background: `linear-gradient(135deg, ${appearance.primaryColor}, ${appearance.secondaryColor})`,
                }}
              >
                <span className="text-2xl font-bold text-white">{forumName[0]}</span>
              </div>
            )}
            <div>
              <h4 className="text-xl font-bold text-white">{displayName || forumName}</h4>
              <p className="text-sm text-gray-400">{memberCount} members</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Theme Presets */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Theme Presets</h3>
        <div className="grid grid-cols-4 gap-3">
          {THEME_PRESETS.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => {
                setAppearance((prev) => ({
                  ...prev,
                  themePreset: theme.id,
                  primaryColor: theme.primary,
                  secondaryColor: theme.secondary,
                  accentColor: theme.accent,
                }));
                HapticFeedback.light();
              }}
              className={`rounded-xl border-2 p-3 transition-all ${
                appearance.themePreset === theme.id
                  ? 'border-primary-500'
                  : 'border-white/[0.08] hover:border-dark-500'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className="mb-2 h-8 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                }}
              />
              <span className="text-sm text-white">{theme.name}</span>
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Custom Colors */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Custom Colors</h3>
        <div className="grid grid-cols-3 gap-4">
          <ColorInput
            label="Primary"
            value={appearance.primaryColor}
            onChange={(value) =>
              setAppearance((prev) => ({
                ...prev,
                primaryColor: value,
                themePreset: 'custom',
              }))
            }
          />
          <ColorInput
            label="Secondary"
            value={appearance.secondaryColor}
            onChange={(value) =>
              setAppearance((prev) => ({
                ...prev,
                secondaryColor: value,
                themePreset: 'custom',
              }))
            }
          />
          <ColorInput
            label="Accent"
            value={appearance.accentColor}
            onChange={(value) =>
              setAppearance((prev) => ({
                ...prev,
                accentColor: value,
                themePreset: 'custom',
              }))
            }
          />
        </div>
      </GlassCard>

      {/* Images */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Images</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-400">Icon URL</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
                {appearance.iconUrl ? (
                  <img src={appearance.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PhotoIcon className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <input
                type="text"
                value={appearance.iconUrl}
                onChange={(e) => setAppearance((prev) => ({ ...prev, iconUrl: e.target.value }))}
                placeholder="https://example.com/icon.png"
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-400">Banner URL</label>
            <div className="space-y-2">
              <div className="flex h-24 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
                {appearance.bannerUrl ? (
                  <img src={appearance.bannerUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <PhotoIcon className="h-8 w-8 text-gray-500" />
                )}
              </div>
              <input
                type="text"
                value={appearance.bannerUrl}
                onChange={(e) => setAppearance((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                placeholder="https://example.com/banner.png"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-2.5 text-white"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Custom CSS */}
      <GlassCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Custom CSS</h3>
        <p className="mb-3 text-sm text-gray-400">Advanced: Add custom styles to your forum.</p>
        <textarea
          value={appearance.customCss}
          onChange={(e) => setAppearance((prev) => ({ ...prev, customCss: e.target.value }))}
          rows={8}
          placeholder="/* Custom CSS goes here */"
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-3 font-mono text-sm text-white"
        />
      </GlassCard>
    </motion.div>
  );
}

/**
 * Color input component for theme customization
 */
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.06] px-3 py-2 font-mono text-sm text-white"
        />
      </div>
    </div>
  );
}

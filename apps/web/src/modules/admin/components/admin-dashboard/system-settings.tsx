/**
 * System Settings Panel
 * Configure nodes economy and moderation settings
 */

import { motion } from 'motion/react';

import { ToggleSwitch, SettingsSection, SettingRow } from './shared-components';

/**
 * System Settings component.
 */
export function SystemSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">System Settings</h1>

      <div className="max-w-2xl space-y-8">
        <SettingsSection title="💎 Nodes Economy">
          <SettingRow
            label="Platform Fee (%)"
            description="Percentage deducted from tips and content unlocks"
            value={
              <input
                type="number"
                defaultValue="20"
                step="1"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Withdrawal Hold (days)"
            description="Days before earned nodes become withdrawable"
            value={
              <input
                type="number"
                defaultValue="21"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Min Withdrawal (Nodes)"
            description="Minimum node balance required for withdrawal"
            value={
              <input
                type="number"
                defaultValue="1000"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="🛡️ Moderation">
          <SettingRow
            label="Auto-flag High Risk"
            description="Automatically flag high-risk content"
            value={<ToggleSwitch defaultChecked />}
          />
          <SettingRow
            label="Risk Score Threshold"
            description="Minimum score to trigger auto-flag"
            value={
              <input
                type="number"
                defaultValue="75"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
        </SettingsSection>

        <div className="flex justify-end pt-6">
          <button className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-medium transition-opacity hover:opacity-90">
            Save Changes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * System Settings Panel
 * Configure gamification, marketplace, and moderation settings
 */

import { motion } from 'framer-motion';

import { ToggleSwitch, SettingsSection, SettingRow } from './shared-components';

/**
 * unknown for the admin module.
 */
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
        <SettingsSection title="🎮 Gamification">
          <SettingRow
            label="XP Rate Multiplier"
            description="Global multiplier for all XP gains"
            value={
              <input
                type="number"
                defaultValue="1.0"
                step="0.1"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Daily Quest Reset Time"
            description="UTC time for daily quest reset"
            value={
              <input
                type="time"
                defaultValue="00:00"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
            }
          />
          <SettingRow
            label="Enable Prestige System"
            description="Allow users to prestige at max level"
            value={<ToggleSwitch defaultChecked />}
          />
        </SettingsSection>

        <SettingsSection title="🏪 Marketplace">
          <SettingRow
            label="Transaction Fee"
            description="Percentage fee on all sales"
            value={
              <input
                type="number"
                defaultValue="5"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Listing Duration (days)"
            description="How long listings remain active"
            value={
              <input
                type="number"
                defaultValue="30"
                className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right"
              />
            }
          />
          <SettingRow
            label="Enable Trading"
            description="Allow direct item trades between users"
            value={<ToggleSwitch defaultChecked />}
          />
        </SettingsSection>

        <SettingsSection title="🛡️ Moderation">
          <SettingRow
            label="Auto-flag High Risk"
            description="Automatically flag high-risk listings"
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

/**
 * Discovery Settings — Frequency weight adjustment page
 *
 * Route: /settings/discovery
 *
 * @module pages/settings/discovery/discovery-settings
 */

import { FrequencyPicker } from '@/modules/discovery';

export function DiscoverySettings() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-white">Discovery Preferences</h1>
        <p className="mt-1 text-sm text-white/40">
          Adjust your interests to personalize your feed
        </p>
      </div>

      <FrequencyPicker
        onSaved={() => {
          // Could show toast here
        }}
      />
    </div>
  );
}

export default DiscoverySettings;

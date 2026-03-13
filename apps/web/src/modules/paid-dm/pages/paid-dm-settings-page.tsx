/**
 * Paid DM Settings Page
 *
 * Configure paid direct-message settings: enable/disable,
 * pricing, accepted file types, and auto-accept for friends.
 *
 * @module modules/paid-dm/pages/paid-dm-settings-page
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface PaidDmSettings {
  enabled: boolean;
  priceNodes: number;
  acceptedFileTypes: string[];
  autoAcceptFriends: boolean;
}

const FILE_TYPES = ['image', 'video', 'audio', 'document'] as const;

const DEFAULT_SETTINGS: PaidDmSettings = {
  enabled: false,
  priceNodes: 10,
  acceptedFileTypes: [],
  autoAcceptFriends: false,
};

// ── Component ──────────────────────────────────────────────────────────

/** Paid Dm Settings Page component. */
export default function PaidDmSettingsPage() {
  const [settings, setSettings] = useState<PaidDmSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get<{ data: PaidDmSettings }>('/api/v1/paid-dm/settings');
        if (!cancelled) setSettings(res.data.data);
      } catch {
        /* use defaults */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFileType = useCallback((type: string) => {
    setSettings((prev) => {
      const exists = prev.acceptedFileTypes.includes(type);
      return {
        ...prev,
        acceptedFileTypes: exists
          ? prev.acceptedFileTypes.filter((t) => t !== type)
          : [...prev.acceptedFileTypes, type],
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await api.put('/api/v1/paid-dm/settings', settings);
      setMessage({ type: 'success', text: 'Settings saved!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Paid DM Settings</h1>

      {/* Enable / Disable */}
      <label className="border-border bg-card flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Enable Paid DMs</p>
          <p className="text-muted-foreground text-sm">
            Non-friends must pay Nodes to send you DMs
          </p>
        </div>
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={settings.enabled}
          onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
        />
      </label>

      {/* Price */}
      <div className="border-border bg-card rounded-lg border p-4">
        <label className="block font-medium" htmlFor="price-input">
          Price per DM (Nodes)
        </label>
        <p className="text-muted-foreground mb-2 text-sm">Minimum 10 Nodes</p>
        <input
          id="price-input"
          type="number"
          min={10}
          className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          value={settings.priceNodes}
          onChange={(e) =>
            setSettings((s) => ({ ...s, priceNodes: Math.max(10, Number(e.target.value)) }))
          }
        />
      </div>

      {/* Accepted file types */}
      <fieldset className="border-border bg-card rounded-lg border p-4">
        <legend className="font-medium">Accepted File Types</legend>
        <p className="text-muted-foreground mb-3 text-sm">
          Select which file types paid senders can attach
        </p>
        <div className="flex flex-wrap gap-4">
          {FILE_TYPES.map((ft) => (
            <label key={ft} className="flex items-center gap-2 capitalize">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={settings.acceptedFileTypes.includes(ft)}
                onChange={() => toggleFileType(ft)}
              />
              {ft}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Auto-accept friends */}
      <label className="border-border bg-card flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Auto-accept Friends</p>
          <p className="text-muted-foreground text-sm">
            Friends can DM you for free without approval
          </p>
        </div>
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={settings.autoAcceptFriends}
          onChange={(e) => setSettings((s) => ({ ...s, autoAcceptFriends: e.target.checked }))}
        />
      </label>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="text-primary-foreground rounded-md bg-primary px-6 py-2 font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save Settings'}
        </button>

        {message && (
          <span
            className={
              message.type === 'success' ? 'text-sm text-green-500' : 'text-destructive text-sm'
            }
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

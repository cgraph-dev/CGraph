/**
 * Plugin Configuration Panel
 *
 * Renders plugin settings schema as form fields, shows plugin info
 * (name, version, hooks, last execution), enable/disable toggle,
 * update settings, uninstall with confirmation.
 *
 * @module modules/forums/components/plugin-settings/plugin-config-panel
 */
import { useState, useEffect, useCallback } from 'react';
import { usePluginStore, type InstalledPlugin } from '@/modules/settings/store';
import { createLogger } from '@/lib/logger';
import { CogIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const logger = createLogger('PluginConfigPanel');

interface PluginConfigPanelProps {
  forumId: string;
  plugin: InstalledPlugin;
  onClose?: () => void;
  onUninstall?: () => void;
}

/**
 * Plugin configuration panel for a single installed plugin.
 */
export default function PluginConfigPanel({
  forumId,
  plugin,
  onClose,
  onUninstall,
}: PluginConfigPanelProps) {
  const { togglePlugin, updatePluginSettings, uninstallPlugin } = usePluginStore();

  const [settings, setSettings] = useState<Record<string, unknown>>(plugin.settings ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false);

  useEffect(() => {
    setSettings(plugin.settings ?? {});
  }, [plugin.settings]);

  const handleSettingChange = useCallback((key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await updatePluginSettings(forumId, plugin.id, settings);
      toast.success('Plugin settings saved');
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'handleSave');
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [forumId, plugin.id, settings, updatePluginSettings]);

  const handleToggle = useCallback(async () => {
    setIsToggling(true);
    try {
      await togglePlugin(forumId, plugin.id);
      toast.success(plugin.is_active ? 'Plugin disabled' : 'Plugin enabled');
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'handleToggle');
      toast.error('Failed to toggle plugin');
    } finally {
      setIsToggling(false);
    }
  }, [forumId, plugin.id, plugin.is_active, togglePlugin]);

  const handleUninstall = useCallback(async () => {
    try {
      await uninstallPlugin(forumId, plugin.id);
      toast.success('Plugin uninstalled');
      onUninstall?.();
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'handleUninstall');
      toast.error('Failed to uninstall plugin');
    }
  }, [forumId, plugin.id, uninstallPlugin, onUninstall]);

  const settingKeys = Object.keys(settings).filter((k) => k !== 'hooks');

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow dark:bg-white/[0.04]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CogIcon className="h-6 w-6 text-gray-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plugin.name}</h3>
            <p className="text-sm text-gray-500">
              v{plugin.version} by {plugin.author}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
            Close
          </button>
        )}
      </div>

      {/* Description */}
      {plugin.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{plugin.description}</p>
      )}

      {/* Plugin Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>{' '}
          <span className={plugin.is_active ? 'text-green-600' : 'text-red-500'}>
            {plugin.is_active ? 'Active' : 'Disabled'}
          </span>
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Installed:</span>{' '}
          <span className="text-gray-500">
            {plugin.installed_at ? new Date(plugin.installed_at).toLocaleDateString() : '—'}
          </span>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Hooks:</span>{' '}
          <span className="text-gray-500">
            {plugin.hooks.length > 0 ? plugin.hooks.join(', ') : 'None'}
          </span>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between border-b border-t py-3 dark:border-white/[0.08]">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Plugin</span>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            plugin.is_active ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              plugin.is_active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Settings Form */}
      {settingKeys.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Settings</h4>
          {settingKeys.map((key) => {
            const value = settings[key];
            return (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-sm font-medium capitalize text-gray-600 dark:text-gray-400">
                  {key.replace(/_/g, ' ')}
                </label>
                {typeof value === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleSettingChange(key, e.target.checked)}
                    className="h-4 w-4 rounded text-blue-600"
                  />
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleSettingChange(key, Number(e.target.value))}
                    className="rounded border p-2 text-sm dark:border-white/[0.08] dark:bg-white/[0.06]"
                  />
                ) : (
                  <input
                    type="text"
                    value={String(value ?? '')}
                    onChange={(e) => handleSettingChange(key, e.target.value)}
                    className="rounded border p-2 text-sm dark:border-white/[0.08] dark:bg-white/[0.06]"
                  />
                )}
              </div>
            );
          })}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Uninstall */}
      {!plugin.is_core && (
        <div className="border-t pt-4 dark:border-white/[0.08]">
          {showUninstallConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-red-600">
                Are you sure? This will remove the plugin and all its settings.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUninstall}
                  className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                >
                  Confirm Uninstall
                </button>
                <button
                  onClick={() => setShowUninstallConfirm(false)}
                  className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowUninstallConfirm(true)}
              className="flex items-center gap-2 rounded bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40"
            >
              <TrashIcon className="h-4 w-4" />
              Uninstall Plugin
            </button>
          )}
        </div>
      )}
    </div>
  );
}

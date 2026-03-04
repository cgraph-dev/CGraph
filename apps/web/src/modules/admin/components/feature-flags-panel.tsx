/**
 * Feature Flags Admin Panel
 *
 * Admin component for managing runtime feature flags.
 * Supports toggling, percentage rollout, variant config, and change history.
 *
 * @module modules/admin/components/feature-flags-panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FeatureFlag, FlagType, FlagHistoryEntry } from '@/stores/featureFlagStore';

// ── Types ──────────────────────────────────────────────────────────────

interface CreateFlagPayload {
  name: string;
  type: FlagType;
  enabled: boolean;
  percentage?: number;
  variants?: string[];
  description?: string;
}

// ── API helpers ────────────────────────────────────────────────────────

const ADMIN_FLAGS_URL = '/api/v1/admin/feature-flags';

async function fetchAdminFlags(): Promise<FeatureFlag[]> {
  const res = await fetch(ADMIN_FLAGS_URL, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch flags: ${res.status}`);
  const data = await res.json();
  return data.data?.flags ?? data.data ?? [];
}

async function createFlag(payload: CreateFlagPayload): Promise<FeatureFlag> {
  const res = await fetch(ADMIN_FLAGS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ flag: payload }),
  });
  if (!res.ok) throw new Error(`Failed to create flag: ${res.status}`);
  const data = await res.json();
  return data.data;
}

async function updateFlag(name: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> {
  const res = await fetch(`${ADMIN_FLAGS_URL}/${name}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ flag: updates }),
  });
  if (!res.ok) throw new Error(`Failed to update flag: ${res.status}`);
  const data = await res.json();
  return data.data;
}

async function deleteFlag(name: string): Promise<void> {
  const res = await fetch(`${ADMIN_FLAGS_URL}/${name}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to delete flag: ${res.status}`);
}

async function fetchFlagHistory(name: string): Promise<FlagHistoryEntry[]> {
  const res = await fetch(`${ADMIN_FLAGS_URL}/${name}/history`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
  const data = await res.json();
  return data.data?.history ?? data.data ?? [];
}

// ── Components ─────────────────────────────────────────────────────────

/** Table row for a single feature flag */
function FlagRow({
  flag,
  onToggle,
  onPercentageChange,
  onSelect,
  onDelete,
}: {
  flag: FeatureFlag;
  onToggle: (name: string, enabled: boolean) => void;
  onPercentageChange: (name: string, pct: number) => void;
  onSelect: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  return (
    <tr className="border-b border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.04]">
      <td className="px-4 py-3">
        <button
          className="text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => onSelect(flag.name)}
        >
          {flag.name}
        </button>
        {flag.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{flag.description}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-800 dark:text-gray-200">
          {flag.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={flag.enabled}
            onChange={() => onToggle(flag.name, !flag.enabled)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
        </label>
      </td>
      <td className="px-4 py-3">
        {flag.type === 'percentage' ? (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={flag.percentage ?? 0}
              onChange={(e) => onPercentageChange(flag.name, Number(e.target.value))}
              className="w-20 h-1.5 accent-blue-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300 w-10">
              {flag.percentage ?? 0}%
            </span>
          </div>
        ) : flag.type === 'variant' ? (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {flag.variant ?? flag.variants?.join(', ') ?? '—'}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {flag.updated_at ? new Date(flag.updated_at).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onDelete(flag.name)}
          className="text-red-500 hover:text-red-700 text-sm"
          title="Delete flag"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

/** History timeline for a single flag */
function FlagHistory({ flagName }: { flagName: string }) {
  const [history, setHistory] = useState<FlagHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFlagHistory(flagName)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [flagName]);

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading history...</p>;
  }

  if (history.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No history available.</p>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {history.map((entry, idx) => (
        <div key={idx} className="flex gap-3 text-sm border-l-2 border-blue-300 pl-3">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-200">{entry.action}</span>
            <span className="text-gray-500 dark:text-gray-400"> by {entry.changed_by}</span>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.timestamp).toLocaleString()}
            </p>
            {entry.changes && Object.keys(entry.changes).length > 0 && (
              <pre className="text-xs bg-gray-50 dark:bg-white/[0.04] rounded p-1 mt-1 max-w-xs overflow-x-auto">
                {JSON.stringify(entry.changes, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Create flag modal */
function CreateFlagModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: CreateFlagPayload) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FlagType>('boolean');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim().toLowerCase().replace(/\s+/g, '_'),
      type,
      enabled: false,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create Feature Flag</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. dark_mode_v2"
              className="w-full px-3 py-2 border rounded-md dark:bg-white/[0.06] dark:border-white/[0.08]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FlagType)}
              className="w-full px-3 py-2 border rounded-md dark:bg-white/[0.06] dark:border-white/[0.08]"
            >
              <option value="boolean">Boolean (on/off)</option>
              <option value="percentage">Percentage rollout</option>
              <option value="variant">A/B Variant</option>
              <option value="targeted">Targeted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 border rounded-md dark:bg-white/[0.06] dark:border-white/[0.08]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────

/**
 * Feature Flags Admin Panel
 *
 * Full CRUD interface for managing feature flags:
 * - Table listing all flags with name, type, status, last changed
 * - Toggle switch for boolean flags
 * - Slider for percentage rollout (0-100%)
 * - Variant display for A/B test flags
 * - Create new flag modal
 * - Detail view with change history timeline
 * - Delete with confirmation
 */
export function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminFlags();
      setFlags(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const handleToggle = async (name: string, enabled: boolean) => {
    try {
      await updateFlag(name, { enabled });
      setFlags((prev) => prev.map((f) => (f.name === name ? { ...f, enabled } : f)));
    } catch {
      setError('Failed to toggle flag');
    }
  };

  const handlePercentageChange = async (name: string, percentage: number) => {
    try {
      await updateFlag(name, { percentage });
      setFlags((prev) => prev.map((f) => (f.name === name ? { ...f, percentage } : f)));
    } catch {
      setError('Failed to update percentage');
    }
  };

  const handleCreate = async (payload: CreateFlagPayload) => {
    try {
      const flag = await createFlag(payload);
      setFlags((prev) => [...prev, flag]);
      setShowCreate(false);
    } catch {
      setError('Failed to create flag');
    }
  };

  const handleDelete = async (name: string) => {
    if (deleteConfirm !== name) {
      setDeleteConfirm(name);
      return;
    }
    try {
      await deleteFlag(name);
      setFlags((prev) => prev.filter((f) => f.name !== name));
      setDeleteConfirm(null);
      if (selectedFlag === name) setSelectedFlag(null);
    } catch {
      setError('Failed to delete flag');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Feature Flags</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage runtime feature flags for gradual rollout
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadFlags}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-white/[0.06]"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + New Flag
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-700 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Flags table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading flags...</div>
      ) : flags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No feature flags configured.{' '}
          <button onClick={() => setShowCreate(true)} className="text-blue-600 underline">
            Create one
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg dark:border-white/[0.08]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/[0.04] text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Value</th>
                <th className="px-4 py-2 font-medium">Last Updated</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag) => (
                <FlagRow
                  key={flag.name}
                  flag={flag}
                  onToggle={handleToggle}
                  onPercentageChange={handlePercentageChange}
                  onSelect={setSelectedFlag}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail view with history */}
      {selectedFlag && (
        <div className="border rounded-lg dark:border-white/[0.08] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              Flag: <span className="text-blue-600 dark:text-blue-400">{selectedFlag}</span>
            </h3>
            <button
              onClick={() => setSelectedFlag(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Close
            </button>
          </div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Change History
          </h4>
          <FlagHistory flagName={selectedFlag} />
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 text-sm">
          Are you sure you want to delete{' '}
          <strong>{deleteConfirm}</strong>?{' '}
          <button onClick={() => handleDelete(deleteConfirm)} className="text-red-600 font-medium underline">
            Confirm Delete
          </button>{' '}
          <button onClick={() => setDeleteConfirm(null)} className="text-gray-500 underline">
            Cancel
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateFlagModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

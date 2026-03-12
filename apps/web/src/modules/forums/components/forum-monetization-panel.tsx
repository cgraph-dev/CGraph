/**
 * ForumMonetizationPanel — admin panel for managing forum monetization settings.
 *
 * Allows forum owners to select a monetization mode (Free / Gated / Hybrid)
 * and manage up to 3 monetization tiers with pricing and features.
 *
 * @module modules/forums/components/forum-monetization-panel
 */

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ForumTierEditor } from './forum-tier-editor';

// ── Types ──────────────────────────────────────────────────────────────

type MonetizationMode = 'free' | 'gated' | 'hybrid';

interface MonetizationTier {
  id: string;
  forum_id: string;
  name: string;
  monthly_price_nodes: number;
  yearly_price_nodes: number;
  features: string[];
}

interface MonetizationSettings {
  forum_id: string;
  mode: MonetizationMode;
  tiers: MonetizationTier[];
}

interface ForumMonetizationPanelProps {
  forumId: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const MAX_TIERS = 3;

const MODE_OPTIONS: { value: MonetizationMode; label: string; description: string }[] = [
  { value: 'free', label: 'Free', description: 'All content is freely accessible' },
  { value: 'gated', label: 'Gated', description: 'Content requires a tier subscription' },
  { value: 'hybrid', label: 'Hybrid', description: 'Some content free, premium behind tiers' },
];

// ── Component ──────────────────────────────────────────────────────────

/**
 * Admin panel for managing forum monetization mode and subscription tiers.
 * Uses glass-panel styling consistent with other admin panels.
 */
export function ForumMonetizationPanel({ forumId }: ForumMonetizationPanelProps) {
  const queryClient = useQueryClient();

  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ── Fetch settings ───────────────────────────────────────────────────

  const { data: settings, isLoading } = useQuery<MonetizationSettings>({
    queryKey: ['forum-monetization', forumId],
    queryFn: async () => {
      const res = await api.get<{ data: MonetizationSettings }>(
        `/api/v1/forums/${forumId}/monetization`
      );
      return res.data.data;
    },
    staleTime: 60_000,
  });

  // ── Mode mutation ────────────────────────────────────────────────────

  const modeMutation = useMutation({
    mutationFn: async (mode: MonetizationMode) => {
      await api.put(`/api/v1/forums/${forumId}/monetization`, { mode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-monetization', forumId] });
    },
  });

  // ── Delete tier mutation ─────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (tierId: string) => {
      await api.delete(`/api/v1/forums/${forumId}/monetization/tiers/${tierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-monetization', forumId] });
    },
  });

  const handleModeChange = useCallback(
    (mode: MonetizationMode) => {
      modeMutation.mutate(mode);
    },
    [modeMutation]
  );

  const handleDeleteTier = useCallback(
    (tierId: string) => {
      deleteMutation.mutate(tierId);
    },
    [deleteMutation]
  );

  // ── Render ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-48 rounded bg-white/[0.08]" />
          <div className="h-20 rounded bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  const currentMode = settings?.mode ?? 'free';
  const tiers = settings?.tiers ?? [];
  const showTiers = currentMode === 'gated' || currentMode === 'hybrid';

  return (
    <div className="space-y-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-6">
      <h3 className="text-base font-semibold text-white">Monetization Settings</h3>

      {/* Mode selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-white/70">Mode</span>
        <div className="space-y-2">
          {MODE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                currentMode === opt.value
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-white/[0.06] hover:bg-white/[0.02]'
              }`}
            >
              <input
                type="radio"
                name="monetization-mode"
                className="mt-0.5 accent-primary"
                checked={currentMode === opt.value}
                onChange={() => handleModeChange(opt.value)}
                disabled={modeMutation.isPending}
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-white">{opt.label}</span>
                <p className="text-xs text-white/50">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Tiers section */}
      {showTiers && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/70">
              Tiers ({tiers.length}/{MAX_TIERS})
            </span>
            <button
              type="button"
              disabled={tiers.length >= MAX_TIERS || isCreating}
              onClick={() => setIsCreating(true)}
              className="rounded-md bg-primary/20 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + Add Tier
            </button>
          </div>

          {/* Existing tiers */}
          {tiers.map((tier) => (
            <div key={tier.id}>
              {editingTierId === tier.id ? (
                <ForumTierEditor
                  forumId={forumId}
                  tier={tier}
                  onClose={() => setEditingTierId(null)}
                />
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">{tier.name}</span>
                    <span className="text-xs text-white/50">
                      {tier.monthly_price_nodes} Nodes/mo · {tier.yearly_price_nodes} Nodes/yr
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTierId(tier.id)}
                      className="rounded px-2 py-1 text-xs text-white/60 hover:bg-white/[0.06] hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDeleteTier(tier.id)}
                      className="rounded px-2 py-1 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* New tier editor */}
          {isCreating && <ForumTierEditor forumId={forumId} onClose={() => setIsCreating(false)} />}

          {tiers.length === 0 && !isCreating && (
            <p className="py-4 text-center text-sm text-white/30">
              No tiers configured. Add a tier to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ForumMonetizationPanel;

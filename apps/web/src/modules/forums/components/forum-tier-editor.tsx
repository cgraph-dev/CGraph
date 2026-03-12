/**
 * ForumTierEditor — inline form for creating or editing a monetization tier.
 *
 * Renders name, pricing fields, and a features checklist.
 * On save, calls createTier or updateTier via the api client.
 *
 * @module modules/forums/components/forum-tier-editor
 */

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface TierData {
  id?: string;
  name: string;
  monthly_price_nodes: number;
  yearly_price_nodes: number;
  features: string[];
}

interface ForumTierEditorProps {
  forumId: string;
  /** Existing tier data when editing, undefined when creating. */
  tier?: TierData;
  onClose: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────

const AVAILABLE_FEATURES = [
  { key: 'private_boards', label: 'Private Boards' },
  { key: 'special_badges', label: 'Special Badges' },
  { key: 'increased_upload_limit', label: 'Increased Upload Limit' },
  { key: 'priority_thread', label: 'Priority Threads' },
  { key: 'custom_nameplate', label: 'Custom Nameplate' },
] as const;

// ── Component ──────────────────────────────────────────────────────────

/**
 * Inline form for creating or editing a monetization tier.
 * Renders within the ForumMonetizationPanel, not as a modal.
 */
export function ForumTierEditor({ forumId, tier, onClose }: ForumTierEditorProps) {
  const isEditing = !!tier?.id;
  const queryClient = useQueryClient();

  const [name, setName] = useState(tier?.name ?? '');
  const [monthlyPrice, setMonthlyPrice] = useState(tier?.monthly_price_nodes ?? 100);
  const [yearlyPrice, setYearlyPrice] = useState(tier?.yearly_price_nodes ?? 1000);
  const [features, setFeatures] = useState<string[]>(tier?.features ?? []);

  const toggleFeature = useCallback((key: string) => {
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        name,
        monthly_price_nodes: monthlyPrice,
        yearly_price_nodes: yearlyPrice,
        features,
      };

      if (isEditing && tier?.id) {
        await api.put(`/api/v1/forums/${forumId}/monetization/tiers/${tier.id}`, body);
      } else {
        await api.post(`/api/v1/forums/${forumId}/monetization/tiers`, body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-monetization', forumId] });
      onClose();
    },
  });

  return (
    <div className="space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <h4 className="text-sm font-semibold text-white">{isEditing ? 'Edit Tier' : 'New Tier'}</h4>

      {/* Name */}
      <div>
        <label htmlFor="tier-name" className="mb-1 block text-xs text-white/60">
          Tier Name
        </label>
        <input
          id="tier-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bronze, Silver, Gold"
          className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tier-monthly" className="mb-1 block text-xs text-white/60">
            Monthly (Nodes)
          </label>
          <input
            id="tier-monthly"
            type="number"
            min={0}
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(Number(e.target.value))}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="tier-yearly" className="mb-1 block text-xs text-white/60">
            Yearly (Nodes)
          </label>
          <input
            id="tier-yearly"
            type="number"
            min={0}
            value={yearlyPrice}
            onChange={(e) => setYearlyPrice(Number(e.target.value))}
            className="w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Features checklist */}
      <div>
        <span className="mb-1 block text-xs text-white/60">Features</span>
        <div className="space-y-1">
          {AVAILABLE_FEATURES.map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 text-sm text-white/80"
            >
              <input
                type="checkbox"
                checked={features.includes(key)}
                onChange={() => toggleFeature(key)}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={mutation.isPending || !name.trim()}
          onClick={() => mutation.mutate()}
          className="text-primary-foreground rounded-md bg-primary px-4 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : isEditing ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-1.5 text-sm text-white/60 hover:text-white"
        >
          Cancel
        </button>
      </div>

      {mutation.isError && (
        <p className="text-destructive text-sm">Failed to save tier. Please try again.</p>
      )}
    </div>
  );
}

export default ForumTierEditor;

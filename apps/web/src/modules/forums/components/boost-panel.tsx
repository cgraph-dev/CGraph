/**
 * BoostPanel
 *
 * UI for purchasing visibility boosts on forum threads, posts, or forums.
 * Lets users choose boost type, duration, and shows live pricing.
 *
 * @module modules/forums/components/boost-panel
 */

import { useCallback, useMemo, useState } from 'react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface BoostPanelProps {
  targetType: 'thread' | 'post' | 'forum';
  targetId: string;
}

type BoostKind = 'visibility' | 'pinned' | 'highlighted';

interface BoostOption {
  kind: BoostKind;
  label: string;
  ratePerHour: number;
  description: string;
}

const BOOST_OPTIONS: BoostOption[] = [
  { kind: 'visibility', label: 'Visibility', ratePerHour: 50, description: 'Appear higher in feeds' },
  { kind: 'pinned', label: 'Pinned', ratePerHour: 200, description: 'Pin to the top of the forum' },
  { kind: 'highlighted', label: 'Highlighted', ratePerHour: 100, description: 'Highlighted border & badge' },
];

// ── Component ──────────────────────────────────────────────────────────

export function BoostPanel({ targetType, targetId }: BoostPanelProps) {
  const [selectedKind, setSelectedKind] = useState<BoostKind>('visibility');
  const [durationHours, setDurationHours] = useState(6);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedOption = useMemo(
    () => BOOST_OPTIONS.find((o) => o.kind === selectedKind)!,
    [selectedKind],
  );

  const totalCost = selectedOption.ratePerHour * durationHours;

  const handlePurchase = useCallback(async () => {
    setIsPurchasing(true);
    setResult(null);
    try {
      await api.post('/api/v1/boosts', {
        targetType,
        targetId,
        boostType: selectedKind,
        durationHours,
      });
      setResult({ type: 'success', text: 'Boost activated!' });
    } catch {
      setResult({ type: 'error', text: 'Failed to purchase boost.' });
    } finally {
      setIsPurchasing(false);
    }
  }, [targetType, targetId, selectedKind, durationHours]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">Boost {targetType}</h3>

      {/* Type selector */}
      <div className="space-y-2">
        {BOOST_OPTIONS.map((opt) => (
          <label
            key={opt.kind}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              selectedKind === opt.kind
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted'
            }`}
          >
            <input
              type="radio"
              name="boost-type"
              className="mt-0.5 accent-primary"
              checked={selectedKind === opt.kind}
              onChange={() => setSelectedKind(opt.kind)}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.ratePerHour} Nodes/hr</span>
              </div>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Duration slider */}
      <div>
        <label htmlFor="boost-duration" className="mb-1 block text-sm font-medium">
          Duration: {durationHours} hour{durationHours > 1 ? 's' : ''}
        </label>
        <input
          id="boost-duration"
          type="range"
          min={1}
          max={72}
          value={durationHours}
          onChange={(e) => setDurationHours(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 hr</span>
          <span>72 hrs</span>
        </div>
      </div>

      {/* Live price calculator */}
      <div className="rounded-lg bg-muted p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {selectedOption.ratePerHour} × {durationHours} hr{durationHours > 1 ? 's' : ''}
          </span>
          <span className="text-lg font-bold text-primary">{totalCost} Nodes</span>
        </div>
      </div>

      {/* Purchase button */}
      <button
        type="button"
        disabled={isPurchasing}
        onClick={handlePurchase}
        className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPurchasing ? 'Purchasing…' : `Boost for ${totalCost} Nodes`}
      </button>

      {result && (
        <p
          className={`text-center text-sm ${
            result.type === 'success' ? 'text-green-500' : 'text-destructive'
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}

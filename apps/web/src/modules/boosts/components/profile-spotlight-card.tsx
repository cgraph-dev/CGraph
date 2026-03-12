/**
 * ProfileSpotlightCard
 *
 * A card for purchasing profile spotlight boosts.
 * Shows the user's profile in "Featured Creators" for a chosen duration.
 *
 * @module modules/boosts/components/profile-spotlight-card
 */

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface ProfileSpotlightCardProps {
  userId: string;
  userName?: string;
  avatarUrl?: string;
}

interface DurationOption {
  hours: number;
  label: string;
  cost: number;
}

const DURATION_OPTIONS: DurationOption[] = [
  { hours: 1, label: '1 hour', cost: 50 },
  { hours: 6, label: '6 hours', cost: 200 },
  { hours: 24, label: '24 hours', cost: 500 },
];

// ── Component ──────────────────────────────────────────────────────────

/** Spotlight card for boosting profile visibility in Featured Creators. */
export function ProfileSpotlightCard({ userId, userName, avatarUrl }: ProfileSpotlightCardProps) {
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(DURATION_OPTIONS[1]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBoost = useCallback(async () => {
    setIsPurchasing(true);
    setResult(null);
    try {
      await api.post('/api/v1/boosts', {
        targetType: 'profile',
        targetId: userId,
        boostType: 'visibility',
        durationHours: selectedDuration.hours,
      });
      setResult({
        type: 'success',
        text: `Your profile will appear in Featured Creators for ${selectedDuration.label}!`,
      });
    } catch {
      setResult({ type: 'error', text: 'Failed to boost profile. Please try again.' });
    } finally {
      setIsPurchasing(false);
    }
  }, [userId, selectedDuration]);

  return (
    <div className="glass-panel space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">Boost Your Profile</div>
      </div>

      <p className="text-muted-foreground text-sm">
        Spotlight your profile in the Featured Creators section. More visibility means more
        followers and engagement.
      </p>

      {/* User preview */}
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-medium">
            {userName?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <div className="font-medium">{userName ?? 'Your Profile'}</div>
          <div className="text-muted-foreground text-xs">Will appear in Featured Creators</div>
        </div>
      </div>

      {/* Duration selector */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Select Duration</div>
        <div className="grid grid-cols-3 gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.hours}
              onClick={() => setSelectedDuration(option)}
              className={`rounded-xl border p-3 text-center transition-all ${
                selectedDuration.hours === option.hours
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              } `}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-muted-foreground mt-1 text-xs">{option.cost} Nodes</div>
            </button>
          ))}
        </div>
      </div>

      {/* Purchase button */}
      <button
        onClick={handleBoost}
        disabled={isPurchasing}
        className="text-primary-foreground w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isPurchasing ? 'Boosting...' : `Boost for ${selectedDuration.cost} Nodes`}
      </button>

      {/* Result message */}
      {result && (
        <div
          className={`rounded-xl p-3 text-sm ${
            result.type === 'success'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {result.text}
        </div>
      )}
    </div>
  );
}

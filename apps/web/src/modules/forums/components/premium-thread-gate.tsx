/**
 * PremiumThreadGate
 *
 * Conditionally renders full thread content or a truncated preview
 * with a blur overlay and unlock CTA for premium threads.
 *
 * @module modules/forums/components/premium-thread-gate
 */

// ── Types ──────────────────────────────────────────────────────────────

interface PremiumThreadGateProps {
  content: string;
  previewLength: number;
  priceNodes: number;
  isUnlocked: boolean;
  onUnlock: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Premium Thread Gate component. */
export function PremiumThreadGate({
  content,
  previewLength,
  priceNodes,
  isUnlocked,
  onUnlock,
}: PremiumThreadGateProps) {
  if (isUnlocked) {
    return <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{content}</div>;
  }

  const preview = content.slice(0, previewLength);

  return (
    <div className="relative">
      {/* Truncated preview */}
      <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{preview}…</div>

      {/* Blur overlay */}
      <div className="from-card via-card/80 absolute inset-x-0 bottom-0 flex h-40 flex-col items-center justify-end bg-gradient-to-t to-transparent pb-6">
        <p className="text-muted-foreground mb-3 text-sm font-medium">This is premium content</p>
        <button
          type="button"
          onClick={onUnlock}
          className="text-primary-foreground rounded-md bg-primary px-6 py-2 text-sm font-medium shadow-lg hover:bg-primary/90"
        >
          Unlock for {priceNodes} Nodes
        </button>
      </div>
    </div>
  );
}

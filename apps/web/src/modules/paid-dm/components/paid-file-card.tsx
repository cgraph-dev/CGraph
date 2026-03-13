/**
 * PaidFileCard
 *
 * Renders a blurred file preview with a price badge and unlock CTA.
 * Shows full preview when the file has been purchased.
 *
 * @module modules/paid-dm/components/paid-file-card
 */

// ── Types ──────────────────────────────────────────────────────────────

interface PaidFileCardProps {
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document';
  price: number;
  status: 'pending' | 'paid';
  onUnlock: () => void;
}

// ── Icons (inline SVG helpers) ─────────────────────────────────────────

function FileIcon({ type }: { type: string }) {
  const label: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    document: '📄',
  };
  return <span className="text-2xl">{label[type] ?? '📎'}</span>;
}

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Paid File Card component. */
export function PaidFileCard({
  fileUrl,
  fileName,
  fileType,
  price,
  status,
  onUnlock,
}: PaidFileCardProps) {
  const isLocked = status === 'pending';

  return (
    <div className="border-border bg-card relative overflow-hidden rounded-lg border">
      {/* Preview area */}
      <div
        className="bg-muted relative flex h-40 items-center justify-center"
        style={isLocked ? { filter: 'blur(10px)', WebkitFilter: 'blur(10px)' } : undefined}
      >
        {fileType === 'image' ? (
          <img src={fileUrl} alt={fileName} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <FileIcon type={fileType} />
        )}
      </div>

      {/* Price badge */}
      {isLocked && (
        <div className="text-primary-foreground absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold">
          {price} Nodes
        </div>
      )}

      {/* Info bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-sm font-medium">{fileName}</span>

        {isLocked ? (
          <button
            type="button"
            onClick={onUnlock}
            className="text-primary-foreground shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium hover:bg-primary/90"
          >
            Unlock for {price} Nodes
          </button>
        ) : (
          <span className="shrink-0 text-xs font-medium text-green-500">Unlocked</span>
        )}
      </div>
    </div>
  );
}

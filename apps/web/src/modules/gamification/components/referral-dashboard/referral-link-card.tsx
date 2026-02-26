/**
 * Referral Link Card
 *
 * Card displaying the user's referral link and code with copy/share actions.
 */

import {
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { ReferralLinkCardProps } from './types';

/**
 * unknown for the gamification module.
 */
/**
 * Referral Link Card display component.
 */
export function ReferralLinkCard({
  referralCode,
  isLoading,
  copied,
  copiedType,
  isRegenerating,
  onCopyUrl,
  onCopyCode,
  onShare,
  onRegenerate,
}: ReferralLinkCardProps) {
  return (
    <div className="from-primary/10 to-primary/5 border-primary/20 rounded-xl border bg-gradient-to-br p-6">
      <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
        <LinkIcon className="text-primary h-5 w-5" />
        Your Referral Link
      </h2>

      {isLoading || !referralCode ? (
        <div className="bg-background/50 h-12 animate-pulse rounded-lg" />
      ) : (
        <>
          {/* URL Display */}
          <div className="mb-4 flex items-center gap-2">
            <div className="bg-background border-border flex-1 truncate rounded-lg border px-4 py-3 font-mono text-sm">
              {referralCode.url}
            </div>
            <button
              onClick={onCopyUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-3 transition-colors"
              title="Copy link"
            >
              {copied && copiedType === 'url' ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={onShare}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg p-3 transition-colors"
              title="Share"
            >
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Code Display */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Your code:</span>
              <code className="bg-background rounded px-2 py-1 font-mono font-semibold">
                {referralCode.code}
              </code>
              <button onClick={onCopyCode} className="text-primary hover:text-primary/80">
                {copied && copiedType === 'code' ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>

          {/* Usage stats */}
          <div className="border-border/50 text-muted-foreground mt-4 flex items-center gap-4 border-t pt-4 text-sm">
            <span>
              Used <strong className="text-foreground">{referralCode.usageCount}</strong> times
            </span>
            {referralCode.maxUsage && (
              <span>
                Max: <strong className="text-foreground">{referralCode.maxUsage}</strong>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

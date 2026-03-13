import React from 'react';

/**
 * ContentGate — overlay for gated paid-forum content.
 *
 * Shows the thread title, a teaser excerpt, and a subscribe CTA.
 * The parent should render this instead of the full thread body
 * when the API returns `gated: true`.
 */

export interface ContentGateProps {
  /** Thread title (always visible) */
  title: string;
  /** First ~200 chars of thread body */
  teaser: string | null;
  /** Forum display name */
  forumName: string;
  /** Human-readable price like "$4.99" */
  priceDisplay: string | null;
  /** URL to initiate subscription */
  subscribeUrl: string;
  /** Optional callback when subscribe button is clicked */
  onSubscribe?: () => void;
  /** Optional className */
  className?: string;
}

/** Description. */
/** Content Gate component. */
export function ContentGate({
  title,
  teaser,
  forumName,
  priceDisplay,
  subscribeUrl,
  onSubscribe,
  className,
}: ContentGateProps): React.ReactElement {
  const handleSubscribe = (e: React.MouseEvent) => {
    if (onSubscribe) {
      e.preventDefault();
      onSubscribe();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 ${className ?? ''}`}
    >
      {/* Title — always visible */}
      <div className="border-b border-gray-100 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>

      {/* Teaser with gradient fade */}
      {teaser && (
        <div className="relative px-4 pb-8 pt-4">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{teaser}…</p>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-gray-900" />
        </div>
      )}

      {/* Subscribe CTA */}
      <div className="flex flex-col items-center gap-3 border-t border-gray-100 bg-gray-50 px-4 py-6 text-center dark:border-gray-800 dark:bg-gray-800/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-amber-500"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
            clipRule="evenodd"
          />
        </svg>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Subscribe to <strong className="text-gray-900 dark:text-gray-100">{forumName}</strong>
          {priceDisplay && (
            <>
              {' '}
              for <strong className="text-amber-600 dark:text-amber-400">{priceDisplay}/mo</strong>
            </>
          )}{' '}
          to read this content
        </p>

        <a
          href={subscribeUrl}
          onClick={handleSubscribe}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          Subscribe Now
        </a>
      </div>
    </div>
  );
}

ContentGate.displayName = 'ContentGate';

export default ContentGate;

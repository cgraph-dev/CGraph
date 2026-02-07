/**
 * ThreadPrefix Badge Component
 * @module modules/forums/components/thread-view/components/prefix-badge
 */

import type { ThreadPrefix } from '@/modules/forums/store';

interface PrefixBadgeProps {
  prefix: ThreadPrefix;
}

export function PrefixBadge({ prefix }: PrefixBadgeProps) {
  return (
    <span
      className="mr-2 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: `${prefix.color}20`,
        color: prefix.color,
        border: `1px solid ${prefix.color}40`,
      }}
    >
      {prefix.name}
    </span>
  );
}

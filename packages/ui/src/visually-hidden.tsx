/**
 * VisuallyHidden — Accessible hidden content.
 *
 * Renders content that is visually hidden but accessible to screen
 * readers. Useful for accessible labels and descriptions.
 *
 * @module @cgraph/ui/visually-hidden
 */

import type { ReactNode, CSSProperties } from 'react';

interface VisuallyHiddenProps {
  readonly children: ReactNode;
}

const hiddenStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
};

/**
 * Renders content that is visually hidden but accessible to screen readers.
 *
 * @example
 * ```tsx
 * <button>
 *   <Icon name="close" />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 * ```
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps): JSX.Element {
  return <span style={hiddenStyle}>{children}</span>;
}

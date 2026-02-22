/**
 * Portal — Render children into a DOM subtree outside the parent.
 *
 * @module @cgraph/ui/portal
 */

import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface PortalProps {
  readonly children: ReactNode;
  readonly container?: Element | null;
}

/**
 * Renders children into document.body or a specified container.
 *
 * @example
 * ```tsx
 * <Portal>
 *   <Modal>Content</Modal>
 * </Portal>
 * ```
 */
export function Portal({ children, container }: PortalProps): ReactNode {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, container ?? document.body);
}

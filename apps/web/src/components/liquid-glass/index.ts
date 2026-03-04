/**
 * CGraph Liquid Glass Design System — Barrel Export
 *
 * Single import for all Liquid Glass components.
 *
 * ```ts
 * import { LGButton, LGCard, toast } from '@/components/liquid-glass';
 * ```
 *
 * @module components/liquid-glass
 */

/* ── Tokens (import CSS in your entry point) ──────────────────────────────── */
// import './tokens.css';  // ← uncomment or add to main.tsx / index.css

/* ── Shared ────────────────────────────────────────────────────────────────── */
export {
  springPreset,
  springSnap,
  springGentle,
  glassSurface,
  glassSurfaceElevated,
  glowColors,
  prefersReducedMotion,
  type GlowColor,
} from './shared';

/* ── Button ────────────────────────────────────────────────────────────────── */
export { LGButton, buttonVariants, type LGButtonProps } from './lg-button';

/* ── Text Input ────────────────────────────────────────────────────────────── */
export { LGTextInput, type LGTextInputProps } from './lg-text-input';

/* ── Search Input ──────────────────────────────────────────────────────────── */
export { LGSearchInput, type LGSearchInputProps } from './lg-search-input';

/* ── Select / Dropdown ─────────────────────────────────────────────────────── */
export { LGSelect, type LGSelectProps, type LGSelectOption } from './lg-select';

/* ── Toggle ────────────────────────────────────────────────────────────────── */
export { LGToggle, type LGToggleProps } from './lg-toggle';

/* ── Checkbox ──────────────────────────────────────────────────────────────── */
export { LGCheckbox, type LGCheckboxProps } from './lg-checkbox';

/* ── Tabs ──────────────────────────────────────────────────────────────────── */
export { LGTabs, type LGTabsProps, type LGTab } from './lg-tabs';

/* ── Card ──────────────────────────────────────────────────────────────────── */
export { LGCard, type LGCardProps } from './lg-card';

/* ── Modal ─────────────────────────────────────────────────────────────────── */
export { LGModal, type LGModalProps } from './lg-modal';

/* ── Toast / Notification ──────────────────────────────────────────────────── */
export {
  LGToastContainer,
  type LGToastContainerProps,
  toast,
  dismissToast,
  clearAllToasts,
  useToast,
  type Toast,
  type ToastVariant,
} from './lg-toast';

/* ── UserCard + Avatar ─────────────────────────────────────────────────────── */
export { LGUserCard, type LGUserCardProps, LGAvatar, type LGAvatarProps } from './lg-user-card';

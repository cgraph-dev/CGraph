/**
 * Shared Layout Components
 *
 * Re-exports layout components from @/components/layout.
 * Import from '@/shared/components/layout' for the new architecture.
 *
 * @module @shared/components/layout
 */

// Re-export all layout components from legacy location
export { Sidebar, TopNav, MobileNav, PageContainer, CommandPalette } from '@/components/layout';

// Re-export types
export type {
  SidebarProps,
  TopNavProps,
  MobileNavProps,
  PageContainerProps,
  CommandPaletteProps,
} from '@/components/layout';

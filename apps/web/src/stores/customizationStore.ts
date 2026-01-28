/**
 * @deprecated This file is deprecated. Import from '@/stores/customization' instead.
 *
 * This file re-exports from the consolidated customization store for backward compatibility.
 * All new code should import directly from '@/stores/customization'.
 *
 * @see /stores/customization/index.ts
 */

export {
  useCustomizationStore,
  useCustomizationStore as default,
  type CustomizationState,
  type CustomizationStore,
} from './customization';

/**
 * CGraph Mobile Shadow System — 5 elevation levels.
 * @module theme/shadows
 */
import { Platform } from 'react-native';

interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

function shadow(
  offsetY: number,
  blurRadius: number,
  opacity: number,
  elevation: number
): ShadowStyle {
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: Platform.OS === 'ios' ? opacity : 0,
    shadowRadius: blurRadius,
    elevation: Platform.OS === 'android' ? elevation : 0,
  };
}

/** Shadow presets matching web --shadow-* levels */
export const shadows = {
  xs: shadow(1, 2, 0.12, 1),
  sm: shadow(2, 4, 0.16, 2),
  md: shadow(4, 12, 0.2, 4),
  lg: shadow(8, 24, 0.28, 8),
  xxl: shadow(16, 48, 0.36, 16),
} as const satisfies Record<string, ShadowStyle>;

export type ShadowLevel = keyof typeof shadows;

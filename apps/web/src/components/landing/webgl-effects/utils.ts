/**
 * WebGL Effects - Utility Functions
 */

/**
 * Parse hex color to RGB values (0-1 range)
 */
export function parseColor(hex: string): [number, number, number] {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return [0.06, 0.73, 0.51]; // Default emerald
  return [
    parseInt(match[1]!, 16) / 255,
    parseInt(match[2]!, 16) / 255,
    parseInt(match[3]!, 16) / 255,
  ];
}

/**
 * Convert opacity (0-1) to hex string for color alpha
 */
export function opacityToHex(opacity: number): string {
  return Math.floor(opacity * 255)
    .toString(16)
    .padStart(2, '0');
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

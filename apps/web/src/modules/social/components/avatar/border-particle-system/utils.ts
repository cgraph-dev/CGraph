/**
 * Border particle system utility functions.
 * @module
 */
export const random = (min: number, max: number) => Math.random() * (max - min) + min;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const getColorVariant = (baseColor: string, variation: number): string => {
  // Simple color variation by adjusting opacity
  const alpha = Math.max(0.3, Math.min(1, 1 + variation));
  if (baseColor.startsWith('#')) {
    return `${baseColor}${Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0')}`;
  }
  return baseColor;
};

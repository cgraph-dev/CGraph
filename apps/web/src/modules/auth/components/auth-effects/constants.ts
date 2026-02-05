/**
 * Performance utility: Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Default color for auth effects
 */
export const DEFAULT_COLOR = '#8b5cf6';

/**
 * Default cell size for cyber grid
 */
export const DEFAULT_CELL_SIZE = 40;

/**
 * Default pulse speed for animations (ms)
 */
export const DEFAULT_PULSE_SPEED = 3000;

/**
 * Default blob size
 */
export const DEFAULT_BLOB_SIZE = 400;

/**
 * Default cursor glow size
 */
export const DEFAULT_GLOW_SIZE = 300;

/**
 * Default particle count
 */
export const DEFAULT_PARTICLE_COUNT = 80;

/**
 * Default connection distance for particles
 */
export const DEFAULT_CONNECTION_DISTANCE = 150;

/**
 * Default particle speed
 */
export const DEFAULT_PARTICLE_SPEED = 0.5;

/**
 * Default colors for particles and aurora
 */
export const DEFAULT_EFFECT_COLORS = ['#8b5cf6', '#a78bfa', '#10b981', '#34d399'];

/**
 * Default aurora colors
 */
export const DEFAULT_AURORA_COLORS = ['#8b5cf6', '#7c3aed', '#10b981', '#059669'];

/**
 * Default aurora animation speed
 */
export const DEFAULT_AURORA_SPEED = 8;

/**
 * Characters used for text scramble effect
 */
export const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';

/**
 * Morphing blob SVG paths for animation
 */
export const BLOB_PATHS = [
  'M44.5,-76.3C57.6,-69.3,68.1,-56.4,75.8,-42.1C83.5,-27.8,88.4,-12,86.6,2.8C84.8,17.6,76.4,31.3,66.3,43.2C56.2,55.1,44.5,65.1,31.2,72.1C17.9,79.1,3,83,-13.1,84.1C-29.2,85.2,-46.5,83.4,-59.8,74.9C-73.1,66.3,-82.4,51,-86.1,34.6C-89.8,18.3,-87.9,0.8,-83.1,-14.9C-78.3,-30.6,-70.6,-44.4,-59.6,-52.8C-48.6,-61.2,-34.3,-64.2,-21.2,-66.8C-8.1,-69.4,3.8,-71.7,17.1,-73.5C30.4,-75.3,45.1,-76.7,44.5,-76.3Z',
  'M45.3,-77.9C58.5,-70.3,68.8,-57.3,76.2,-43.1C83.6,-28.9,88,-13.4,87.2,1.4C86.5,16.2,80.4,30.4,71.9,42.8C63.4,55.2,52.4,65.8,39.6,73.1C26.8,80.4,12.1,84.3,-2.4,84.9C-16.9,85.5,-31.2,82.8,-44.1,76C-57,69.2,-68.5,58.3,-75.7,45.1C-82.9,31.9,-85.8,16.5,-85.3,1.3C-84.8,-13.9,-80.9,-28.9,-73.4,-42.1C-65.9,-55.3,-54.8,-66.7,-41.6,-74.2C-28.4,-81.7,-13.2,-85.3,1.8,-87.6C16.8,-89.9,33.5,-90.9,45.3,-77.9Z',
  'M42.7,-74.5C55.1,-67.8,64.8,-55.8,72.1,-42.5C79.4,-29.2,84.3,-14.6,84.6,0.2C84.9,15,80.6,30.1,73.1,43.3C65.6,56.5,54.9,67.9,42,75.1C29.1,82.3,14,85.4,-0.8,86.8C-15.6,88.2,-30.2,87.9,-43.5,82.1C-56.8,76.3,-68.8,65,-77.1,51.5C-85.4,38,-90,22.3,-89.8,6.8C-89.6,-8.7,-84.6,-23.8,-76.5,-37.1C-68.4,-50.4,-57.2,-61.9,-44.1,-68.3C-31,-74.7,-16.1,-76,-0.3,-75.5C15.5,-75,30.3,-72.6,42.7,-74.5Z',
];

/**
 * Security icon SVG paths
 */
export const SECURITY_ICONS = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-3V5a3 3 0 0 1 6 0v3',
  key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  fingerprint: 'M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4M12 2v10M2 12h10m0 0a5 5 0 0 0 5-5',
};

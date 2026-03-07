/**
 * Lottie animation library — barrel export.
 *
 * @module lib/lottie
 */

export { LottieRenderer } from './lottie-renderer';
export { useLottie } from './use-lottie';
export {
  lottieCache,
  preloadAnimations,
  getCachedAnimation,
  getLottieCdnUrl,
  getWebpCdnUrl,
  getGifCdnUrl,
} from './lottie-cache';
export type {
  LottieAnimationData,
  AnimatedEmoji,
  LottieConfig,
  LottieRendererProps,
  LottieCacheEntry,
} from './lottie-types';

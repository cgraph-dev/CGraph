/**
 * Lottie animation library — barrel export.
 *
 * @module lib/lottie
 */

export { LottieRenderer } from './lottie-renderer';
export { AnimatedEmoji } from './animated-emoji';
export type { AnimatedEmojiProps } from './animated-emoji';
export { EmojiTextRenderer } from './emoji-text-renderer';
export type { EmojiTextRendererProps } from './emoji-text-renderer';
export { LottieBorderRenderer } from './lottie-border-renderer';
export type { LottieBorderProps, LottieBorderConfig } from './lottie-border-renderer';
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
  AnimatedEmojiMeta,
  LottieConfig,
  LottieRendererProps,
  LottieCacheEntry,
} from './lottie-types';

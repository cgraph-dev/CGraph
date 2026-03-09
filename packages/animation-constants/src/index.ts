/**
 * @cgraph/animation-constants
 *
 * Platform-agnostic animation constants consumed by both
 * apps/web (Framer Motion) and apps/mobile (Reanimated).
 *
 * Only raw numeric / string values live here — no framework imports.
 */

export { springs, type SpringConfig } from './springs';
export { durations, type DurationPreset } from './durations';
export { easings, cubicBeziers, type CubicBezier } from './easings';
export { stagger, type StaggerConfig } from './stagger';
export { transitions, rnTransitions } from './transitions';
export { LAYOUT_IDS } from './layout-ids';
export {
  backgroundPresets,
  type BackgroundPresets,
  type ParticleFieldPreset,
  type CyberGridPreset,
  type AuroraGlowPreset,
  type BackgroundColors,
} from './backgrounds';
export {
  buttonPresets,
  type ButtonPresets,
  type MagneticPreset,
  type ShimmerPreset,
  type GlowPreset,
  type GlowState,
  type FlowingBorderPreset,
  type TapPreset,
  type HoverPreset,
  type ButtonReducedMotion,
} from './buttons';
export {
  BORDER_REGISTRY,
  BORDER_THEME_PALETTES,
  BORDER_RARITY_GLOW_RADIUS,
  BORDER_RARITY_MAX_ANIMATIONS,
  BORDER_RARITY_LOTTIE_SPEED,
  BORDER_RARITY_SCALE,
  getBorderById,
  getBordersByRarity,
  getBordersByTheme,
  isAnimatedRarity,
  type BorderRarity,
  type BorderTheme,
  type BorderParticleShape,
  type BorderRotationDirection,
  type BorderRegistryEntry,
} from './borders';
export {
  PROFILE_EFFECT_REGISTRY,
  getProfileEffectById,
  getFreeProfileEffects,
  getProfileEffectsByRarity,
  type ProfileEffectRarity,
  type ProfileEffectEntry,
} from './registries/profileEffects';
export {
  NAMEPLATE_REGISTRY,
  NAMEPLATE_CATEGORIES,
  getNameplateById,
  getFreeNameplates,
  getNameplatesByRarity,
  getNameplatesByCategory,
  type NameplateRarity,
  type NameplateEntry,
  type NameplateTextEffect,
  type NameplateParticleType,
  type NameplateBorderStyle,
  type NameplateCategory,
} from './registries/nameplates';
export {
  NAME_FONTS,
  NAME_FONT_KEYS,
  NAME_EFFECTS,
  NAME_EFFECT_KEYS,
  NAME_COLORS,
  DEFAULT_DISPLAY_NAME_STYLE,
  type NameFont,
  type NameFontConfig,
  type NameEffect,
  type NameEffectConfig,
  type DisplayNameStyle,
} from './registries/displayNameStyles';
export {
  PROFILE_THEME_PRESETS,
  DEFAULT_PROFILE_THEME,
  getProfileThemePresetById,
  isCustomTheme,
  type ProfileThemePreset,
  type ProfileTheme,
} from './registries/profileThemes';

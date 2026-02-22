/**
 * AvatarSettings module exports
 * @module modules/settings/components/avatar-settings
 */

export { default } from './avatar-settings';

// Components
export { AvatarPreviewCard } from './avatar-preview-card';
export { AvatarUploadCard } from './avatar-upload-card';
export { BannerUploadCard } from './banner-upload-card';
export { ProfileInfoCard } from './profile-info-card';
export { BorderStyleCard } from './border-style-card';
export { BorderWidthCard, BorderColorCard, GlowIntensityCard } from './border-settings-cards';
export { AnimationSpeedCard } from './animation-speed-card';
export { ShapeCard } from './shape-card';
export { ExportImportCard } from './export-import-card';

// Hooks
export { useAvatarSettings } from './useAvatarSettings';

// Types
export type {
  AvatarSettingsFormData,
  FileUploadState,
  BorderStyle,
  AvatarShape,
  AnimationSpeed,
  UseAvatarSettingsReturn,
} from './types';

// Constants
export {
  BORDER_STYLES,
  SHAPES,
  ANIMATION_SPEEDS,
  MAX_BIO_LENGTH,
  MAX_LOCATION_LENGTH,
  MAX_OCCUPATION_LENGTH,
  MAX_AVATAR_SIZE_MB,
  MAX_BANNER_SIZE_MB,
  RECOMMENDED_BANNER_SIZE,
} from './constants';

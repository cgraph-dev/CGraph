/**
 * AvatarSettings module exports
 * @module modules/settings/components/avatar-settings
 */

export { default } from './AvatarSettings';

// Components
export { AvatarPreviewCard } from './AvatarPreviewCard';
export { AvatarUploadCard } from './AvatarUploadCard';
export { BannerUploadCard } from './BannerUploadCard';
export { ProfileInfoCard } from './ProfileInfoCard';
export { BorderStyleCard } from './BorderStyleCard';
export { BorderWidthCard, BorderColorCard, GlowIntensityCard } from './BorderSettingsCards';
export { AnimationSpeedCard } from './AnimationSpeedCard';
export { ShapeCard } from './ShapeCard';
export { ExportImportCard } from './ExportImportCard';

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

/**
 * AvatarSettings type definitions
 * @module modules/settings/components/avatar-settings
 */

export interface AvatarSettingsFormData {
  bio: string;
  location: string;
  website: string;
  occupation: string;
}

export interface FileUploadState {
  file: File | null;
  preview: string | null;
}

export type BorderStyle =
  | 'none'
  | 'solid'
  | 'gradient'
  | 'rainbow'
  | 'pulse'
  | 'spin'
  | 'glow'
  | 'neon'
  | 'fire'
  | 'electric';

export type AvatarShape =
  | 'circle'
  | 'rounded-square'
  | 'hexagon'
  | 'octagon'
  | 'shield'
  | 'diamond';

export type AnimationSpeed = 'none' | 'slow' | 'normal' | 'fast';

export interface UseAvatarSettingsReturn {
  // Profile form state
  formData: AvatarSettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<AvatarSettingsFormData>>;
  handleProfileSave: () => Promise<void>;

  // Avatar upload
  avatarUpload: FileUploadState;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarUpload: () => Promise<void>;
  clearAvatarUpload: () => void;

  // Banner upload
  bannerUpload: FileUploadState;
  handleBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBannerUpload: () => Promise<void>;
  clearBannerUpload: () => void;

  // Style export/import
  importText: string;
  setImportText: (text: string) => void;
  handleExport: () => void;
  handleImport: () => void;

  // Sync status
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
}

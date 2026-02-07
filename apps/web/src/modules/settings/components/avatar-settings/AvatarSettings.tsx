/**
 * Avatar & Profile Settings Component
 * Comprehensive avatar customization with animated borders and profile editing
 *
 * @module modules/settings/components/avatar-settings
 */

import { motion } from 'framer-motion';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import SyncStatusIndicator from '@/modules/settings/components/SyncStatusIndicator';
import { useAvatarSettings } from './useAvatarSettings';
import { AvatarPreviewCard } from './AvatarPreviewCard';
import { AvatarUploadCard } from './AvatarUploadCard';
import { BannerUploadCard } from './BannerUploadCard';
import { ProfileInfoCard } from './ProfileInfoCard';
import { BorderStyleCard } from './BorderStyleCard';
import { BorderWidthCard, BorderColorCard, GlowIntensityCard } from './BorderSettingsCards';
import { AnimationSpeedCard } from './AnimationSpeedCard';
import { ShapeCard } from './ShapeCard';
import { ExportImportCard } from './ExportImportCard';

export default function AvatarSettings() {
  const { user } = useAuthStore();
  const {
    formData,
    setFormData,
    handleProfileSave,
    avatarUpload,
    handleAvatarChange,
    handleAvatarUpload,
    clearAvatarUpload,
    bannerUpload,
    handleBannerChange,
    handleBannerUpload,
    clearBannerUpload,
    importText,
    setImportText,
    handleExport,
    handleImport,
    syncStatus,
  } = useAvatarSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="h-8 w-8 text-primary-400" />
          <div>
            <h2 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
              Avatar & Profile
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Customize your avatar with animated borders and effects
            </p>
          </div>
        </div>
        <SyncStatusIndicator status={syncStatus} />
      </div>

      {/* Preview Card */}
      <AvatarPreviewCard
        avatarUrl={(avatarUpload.preview || user?.avatarUrl) ?? undefined}
        displayName={user?.displayName ?? undefined}
      />

      {/* Avatar Upload */}
      <AvatarUploadCard
        upload={avatarUpload}
        onChange={handleAvatarChange}
        onUpload={handleAvatarUpload}
        onCancel={clearAvatarUpload}
      />

      {/* Banner Upload */}
      <BannerUploadCard
        upload={bannerUpload}
        currentBannerUrl={user?.bannerUrl}
        onChange={handleBannerChange}
        onUpload={handleBannerUpload}
        onCancel={clearBannerUpload}
      />

      {/* Profile Information */}
      <ProfileInfoCard formData={formData} onChange={setFormData} onSave={handleProfileSave} />

      {/* Border Style */}
      <BorderStyleCard />

      {/* Border Width */}
      <BorderWidthCard />

      {/* Border Color */}
      <BorderColorCard />

      {/* Glow Intensity */}
      <GlowIntensityCard />

      {/* Animation Speed */}
      <AnimationSpeedCard />

      {/* Shape */}
      <ShapeCard />

      {/* Export/Import */}
      <ExportImportCard
        importText={importText}
        onImportTextChange={setImportText}
        onExport={handleExport}
        onImport={handleImport}
      />
    </motion.div>
  );
}

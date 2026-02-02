/**
 * Avatar & Profile Settings Component
 * Comprehensive avatar customization with animated borders and profile editing
 */

import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AvatarSettings');
import { motion } from 'framer-motion';
import { AnimatedAvatar, useAvatarStyle, GlassCard, toast } from '@/shared/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import SyncStatusIndicator, { useSyncStatus } from '@/components/settings/SyncStatusIndicator';
import VisibilityBadge from '@/components/settings/VisibilityBadge';
import {
  UserCircleIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  GlobeAltIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

export default function AvatarSettings() {
  const { user, updateUser } = useAuthStore();
  const { style, updateStyle, resetStyle, exportStyle, importStyle } = useAvatarStyle();
  const { updateProfile, uploadAvatar, uploadBanner } = useProfileStore();
  const [importText, setImportText] = useState('');
  const { status: syncStatus, setSaving, setSaved, setError } = useSyncStatus();

  // Profile form state
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [occupation, setOccupation] = useState(user?.occupation || '');

  // File upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Sync form state with user data when it changes
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setLocation(user.location || '');
      setWebsite(user.website || '');
      setOccupation(user.occupation || '');
    }
  }, [user]);

  // Handle profile update
  const handleProfileSave = async () => {
    setSaving();
    try {
      await updateProfile({
        bio,
        location,
        website,
        occupation,
      });

      // Update local user state
      updateUser({ bio, location, website, occupation });

      setSaved();
      toast.success('Profile updated successfully');
    } catch (error) {
      logger.error('Failed to update profile:', error);
      setError('Failed to save profile');
      toast.error('Failed to update profile');
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle banner file selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setSaving();
    try {
      const newAvatarUrl = await uploadAvatar(avatarFile);
      updateUser({ avatarUrl: newAvatarUrl });
      setAvatarFile(null);
      setAvatarPreview(null);
      setSaved();
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar');
      toast.error('Failed to upload avatar');
    }
  };

  // Upload banner
  const handleBannerUpload = async () => {
    if (!bannerFile) return;

    setSaving();
    try {
      const newBannerUrl = await uploadBanner(bannerFile);
      updateUser({ bannerUrl: newBannerUrl });
      setBannerFile(null);
      setBannerPreview(null);
      setSaved();
      toast.success('Banner uploaded successfully');
    } catch (error) {
      logger.error('Failed to upload banner:', error);
      setError('Failed to upload banner');
      toast.error('Failed to upload banner');
    }
  };

  const borderStyles: Array<typeof style.borderStyle> = [
    'none',
    'solid',
    'gradient',
    'rainbow',
    'pulse',
    'spin',
    'glow',
    'neon',
    'fire',
    'electric',
  ];

  const shapes: Array<typeof style.shape> = [
    'circle',
    'rounded-square',
    'hexagon',
    'octagon',
    'shield',
    'diamond',
  ];

  const animationSpeeds: Array<typeof style.animationSpeed> = ['none', 'slow', 'normal', 'fast'];

  const handleExport = () => {
    const json = exportStyle();
    navigator.clipboard.writeText(json);
    HapticFeedback.success();
    alert('Avatar style copied to clipboard!');
  };

  const handleImport = () => {
    if (importText.trim()) {
      importStyle(importText);
      setImportText('');
      HapticFeedback.success();
    }
  };

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
      <GlassCard className="p-8" variant="frosted">
        <div className="flex flex-col items-center gap-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <SparklesIcon className="h-5 w-5 text-primary-400" />
            Live Preview
          </h3>
          <AnimatedAvatar
            src={avatarPreview || user?.avatarUrl}
            alt={user?.displayName || 'User'}
            size="xl"
            showStatus
            statusType="online"
          />
          <p className="text-sm text-gray-400">Your avatar with current settings</p>
        </div>
      </GlassCard>

      {/* Avatar Upload */}
      <GlassCard className="p-6" variant="crystal" glow>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Avatar Image</h3>
          </div>
          <VisibilityBadge visible="others" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Upload New Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="block w-full cursor-pointer text-sm text-gray-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-700"
            />
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, or GIF. Max 2MB.</p>
          </div>

          {avatarPreview && (
            <div className="flex items-center gap-4">
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-primary-500"
              />
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAvatarUpload}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Upload
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-dark-600"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Banner Upload */}
      <GlassCard className="p-6" variant="crystal" glow>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Profile Banner</h3>
          </div>
          <VisibilityBadge visible="others" />
        </div>

        <div className="space-y-4">
          {(bannerPreview || user?.bannerUrl) && (
            <div className="h-32 w-full overflow-hidden rounded-lg ring-2 ring-gray-700">
              <img
                src={bannerPreview || user?.bannerUrl || undefined}
                alt="Banner preview"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Upload New Banner
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="block w-full cursor-pointer text-sm text-gray-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPG or PNG. Recommended: 1500x500px. Max 5MB.
            </p>
          </div>

          {bannerFile && (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBannerUpload}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                Upload Banner
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBannerFile(null);
                  setBannerPreview(null);
                }}
                className="rounded-lg bg-dark-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-dark-600"
              >
                Cancel
              </motion.button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Profile Information */}
      <GlassCard className="p-6" variant="holographic" glow>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircleIcon className="h-5 w-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Profile Information</h3>
          </div>
          <VisibilityBadge visible="others" />
        </div>

        <div className="space-y-4">
          {/* Bio */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">{bio.length}/500 characters</p>
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
              <MapPinIcon className="h-4 w-4" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              maxLength={100}
              className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Website */}
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
              <GlobeAltIcon className="h-4 w-4" />
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium text-gray-300">
              <BriefcaseIcon className="h-4 w-4" />
              Occupation
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Your profession or role"
              maxLength={100}
              className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Save Profile Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              handleProfileSave();
              HapticFeedback.success();
            }}
            className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 font-medium text-white shadow-lg shadow-primary-500/20 transition-all hover:from-primary-700 hover:to-primary-800"
          >
            Save Profile Information
          </motion.button>
        </div>
      </GlassCard>

      {/* Border Style */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="mb-4 text-lg font-semibold text-white">Border Style</h3>
        <div className="grid grid-cols-5 gap-3">
          {borderStyles.map((borderStyle) => (
            <motion.button
              key={borderStyle}
              onClick={() => {
                updateStyle('borderStyle', borderStyle);
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-lg p-3 text-sm capitalize transition-all ${
                style.borderStyle === borderStyle
                  ? 'border-2 border-primary-500 bg-primary-500/20 text-white'
                  : 'border border-dark-600 bg-dark-700/50 text-gray-400 hover:border-primary-500/50 hover:text-white'
              } `}
            >
              {borderStyle}
              {style.borderStyle === borderStyle && (
                <motion.div
                  layoutId="selectedBorderStyle"
                  className="absolute inset-0 rounded-lg bg-primary-500/10"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Border Width */}
      <GlassCard className="p-6" variant="frosted">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Border Width</h3>
          <span className="text-sm text-primary-400">{style.borderWidth}px</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={style.borderWidth}
          onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value))}
          className="slider-thumb-primary h-2 w-full cursor-pointer appearance-none rounded-lg bg-dark-700"
        />
      </GlassCard>

      {/* Border Color */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="mb-4 text-lg font-semibold text-white">Border Color</h3>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={style.borderColor}
            onChange={(e) => updateStyle('borderColor', e.target.value)}
            className="h-12 w-24 cursor-pointer rounded-lg border border-dark-600 bg-transparent"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-400">Selected Color</p>
            <p className="font-mono text-lg text-white">{style.borderColor}</p>
          </div>
        </div>
      </GlassCard>

      {/* Glow Intensity */}
      <GlassCard className="p-6" variant="frosted">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Glow Intensity</h3>
          <span className="text-sm text-primary-400">{style.glowIntensity}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={style.glowIntensity}
          onChange={(e) => updateStyle('glowIntensity', parseInt(e.target.value))}
          className="slider-thumb-primary h-2 w-full cursor-pointer appearance-none rounded-lg bg-dark-700"
        />
      </GlassCard>

      {/* Animation Speed */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="mb-4 text-lg font-semibold text-white">Animation Speed</h3>
        <div className="grid grid-cols-4 gap-3">
          {animationSpeeds.map((speed) => (
            <motion.button
              key={speed}
              onClick={() => {
                updateStyle('animationSpeed', speed);
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-lg p-3 text-sm capitalize transition-all ${
                style.animationSpeed === speed
                  ? 'border-2 border-primary-500 bg-primary-500/20 text-white'
                  : 'border border-dark-600 bg-dark-700/50 text-gray-400 hover:border-primary-500/50 hover:text-white'
              } `}
            >
              {speed}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Shape */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="mb-4 text-lg font-semibold text-white">Avatar Shape</h3>
        <div className="grid grid-cols-4 gap-3">
          {shapes.map((shape) => (
            <motion.button
              key={shape}
              onClick={() => {
                updateStyle('shape', shape);
                HapticFeedback.light();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-lg p-3 text-sm capitalize transition-all ${
                style.shape === shape
                  ? 'border-2 border-primary-500 bg-primary-500/20 text-white'
                  : 'border border-dark-600 bg-dark-700/50 text-gray-400 hover:border-primary-500/50 hover:text-white'
              } `}
            >
              {shape.replace('-', ' ')}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* Export/Import */}
      <GlassCard className="p-6" variant="frosted">
        <h3 className="mb-4 text-lg font-semibold text-white">Share Your Style</h3>
        <div className="space-y-4">
          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 bg-primary-500/20 px-4 py-3 text-white transition-colors hover:bg-primary-500/30"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export Avatar Style
          </motion.button>

          <div>
            <label className="mb-2 block text-sm text-gray-400">Import Style (Paste JSON)</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"borderStyle":"rainbow","borderWidth":3,...}'
              className="w-full rounded-lg border border-dark-600 bg-dark-700/50 px-4 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
              rows={4}
            />
            <motion.button
              onClick={handleImport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!importText.trim()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500 bg-purple-500/20 px-4 py-3 text-white transition-colors hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import Avatar Style
            </motion.button>
          </div>

          <motion.button
            onClick={() => {
              resetStyle();
              HapticFeedback.medium();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-lg border border-dark-600 bg-dark-700/50 px-4 py-3 text-gray-400 transition-colors hover:border-red-500 hover:text-red-400"
          >
            Reset to Defaults
          </motion.button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

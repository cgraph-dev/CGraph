/**
 * ProfileEditForm — Full profile editing with avatar cropping.
 *
 * Features:
 * - Avatar preview with crop modal (react-easy-crop, 1:1 aspect)
 * - Display name, bio, signature fields with validation
 * - Saves via PUT /api/v1/me and POST /api/v1/me/avatar
 *
 * @module
 */

import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { api } from '@/lib/api';
import { toast } from '@/components/feedback/toast';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ProfileEditForm');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileEditFormProps {
  /** Current user profile data */
  user: {
    avatar_url?: string | null;
    display_name?: string | null;
    bio?: string | null;
    signature?: string | null;
  };
  /** Called after a successful save with the updated fields */
  onSaved?: (updated: Record<string, unknown>) => void;
  /** Called when user cancels editing */
  onCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers — canvas crop
// ---------------------------------------------------------------------------

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (err) => reject(err));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, crop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.9,
    );
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileEditForm({ user, onSaved, onCancel }: ProfileEditFormProps) {
  // Form state
  const [displayName, setDisplayName] = useState(user.display_name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [signature, setSignature] = useState(user.signature ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url ?? null);

  // Crop state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Upload / save state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track pending avatar blob for upload on save
  const pendingAvatarBlobRef = useRef<Blob | null>(null);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset so re-selecting same file works
    e.target.value = '';
  }, []);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = useCallback(async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    try {
      const blob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      pendingAvatarBlobRef.current = blob;
      setAvatarPreview(URL.createObjectURL(blob));
      setCropImageSrc(null);
    } catch (err) {
      logger.error('Crop failed:', err);
      toast.error('Failed to crop image');
    }
  }, [cropImageSrc, croppedAreaPixels]);

  const handleCropCancel = useCallback(() => {
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const uploadAvatarBlob = useCallback(async (blob: Blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'avatar.jpg');

    await api.post('/api/v1/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsSaving(true);
    try {
      // Upload avatar if changed
      if (pendingAvatarBlobRef.current) {
        setIsUploadingAvatar(true);
        await uploadAvatarBlob(pendingAvatarBlobRef.current);
        pendingAvatarBlobRef.current = null;
        setIsUploadingAvatar(false);
      }

      // Update profile fields
      const payload: Record<string, string> = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        signature: signature.trim(),
      };

      await api.put('/api/v1/me', payload);
      toast.success('Profile updated!');
      onSaved?.(payload);
    } catch (err) {
      logger.error('Failed to save profile:', err);
      toast.error('Failed to save profile. Please try again.');
      setIsUploadingAvatar(false);
    } finally {
      setIsSaving(false);
    }
  }, [displayName, bio, signature, uploadAvatarBlob, onSaved]);

  const busy = isSaving || isUploadingAvatar;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* ---- Avatar ---- */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10 transition-all hover:ring-white/30"
          disabled={busy}
          aria-label="Change avatar"
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/[0.06] text-2xl text-gray-400">
              {displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs font-medium text-white">Change</span>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
          disabled={busy}
        >
          Change Avatar
        </button>
      </div>

      {/* ---- Display Name ---- */}
      <div className="space-y-1">
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
          Display Name <span className="text-red-400">*</span>
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
          maxLength={50}
          placeholder="Your display name"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={busy}
        />
        <p className="text-right text-xs text-gray-500">{displayName.length}/50</p>
      </div>

      {/* ---- Bio ---- */}
      <div className="space-y-1">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 500))}
          maxLength={500}
          rows={4}
          placeholder="Tell us about yourself..."
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={busy}
        />
        <p className="text-right text-xs text-gray-500">{bio.length}/500</p>
      </div>

      {/* ---- Signature ---- */}
      <div className="space-y-1">
        <label htmlFor="signature" className="block text-sm font-medium text-gray-300">
          Signature
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value.slice(0, 100))}
          maxLength={100}
          placeholder="A short tagline (optional)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={busy}
        />
        <p className="text-right text-xs text-gray-500">{signature.length}/100</p>
      </div>

      {/* ---- Actions ---- */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
            disabled={busy}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !displayName.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* ---- Crop Modal ---- */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-[rgb(30,32,40)] shadow-2xl">
            <div className="relative h-80 w-full">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="round"
                showGrid={false}
              />
            </div>

            {/* Zoom slider */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs text-gray-400">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={handleCropCancel}
                className="rounded-lg px-4 py-1.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileEditForm;

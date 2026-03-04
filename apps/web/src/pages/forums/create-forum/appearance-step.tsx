/**
 * AppearanceStep component - Step 2: Icon, banner, colors
 */

import { PaintBrushIcon, PhotoIcon } from '@heroicons/react/24/outline';
import type { ForumFormData } from './types';

interface AppearanceStepProps {
  formData: ForumFormData;
  onUpdateField: <K extends keyof ForumFormData>(key: K, value: ForumFormData[K]) => void;
}

/**
 * unknown for the forums module.
 */
/**
 * Appearance Step component.
 */
export function AppearanceStep({ formData, onUpdateField }: AppearanceStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <PaintBrushIcon className="h-6 w-6" />
        Appearance
      </h2>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Forum Icon URL</label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.06]">
            {formData.iconUrl ? (
              <img
                src={formData.iconUrl}
                alt="Icon preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <PhotoIcon className="h-8 w-8 text-gray-500" />
            )}
          </div>
          <input
            type="url"
            value={formData.iconUrl}
            onChange={(e) => onUpdateField('iconUrl', e.target.value)}
            placeholder="https://example.com/icon.png"
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-white placeholder-white/30 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Banner Image URL</label>
        <div className="mb-3 h-32 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.06]">
          {formData.bannerUrl ? (
            <img
              src={formData.bannerUrl}
              alt="Banner preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PhotoIcon className="h-12 w-12 text-gray-500" />
            </div>
          )}
        </div>
        <input
          type="url"
          value={formData.bannerUrl}
          onChange={(e) => onUpdateField('bannerUrl', e.target.value)}
          placeholder="https://example.com/banner.png"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-white placeholder-white/30 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Primary Color</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={formData.primaryColor}
            onChange={(e) => onUpdateField('primaryColor', e.target.value)}
            className="h-12 w-12 cursor-pointer rounded-lg"
          />
          <input
            type="text"
            value={formData.primaryColor}
            onChange={(e) => onUpdateField('primaryColor', e.target.value)}
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ConfirmStep component - Step 4: Preview and confirm
 */

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { FORUM_CATEGORIES } from './constants';
import type { ForumFormData } from './types';

interface ConfirmStepProps {
  formData: ForumFormData;
  subscriptionTier?: string;
}

/**
 * unknown for the forums module.
 */
/**
 * Confirm Step component.
 */
export function ConfirmStep({ formData, subscriptionTier = 'free' }: ConfirmStepProps) {
  const categoryLabel =
    FORUM_CATEGORIES.find((c) => c.value === formData.category)?.label || 'Other';

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <CheckCircleIcon className="h-6 w-6" />
        Confirm Your Forum
      </h2>

      <div className="overflow-hidden rounded-lg bg-dark-700">
        {/* Preview Banner */}
        <div
          className="h-32"
          style={{
            background: formData.bannerUrl
              ? `url(${formData.bannerUrl}) center/cover`
              : `linear-gradient(135deg, ${formData.primaryColor}, ${formData.primaryColor}88)`,
          }}
        />

        {/* Preview Content */}
        <div className="-mt-8 p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-dark-700"
              style={{ backgroundColor: formData.primaryColor }}
            >
              {formData.iconUrl ? (
                <img
                  src={formData.iconUrl}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {formData.name?.[0]?.toUpperCase() || 'F'}
                </span>
              )}
            </div>

            <div className="flex-1 pt-6">
              <h3 className="text-xl font-bold text-white">{formData.name || 'Your Forum'}</h3>
              <p className="text-sm text-gray-400">f/{formData.slug || 'your-forum'}</p>
              {formData.description && <p className="mt-2 text-gray-300">{formData.description}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded bg-dark-600 px-2 py-1 text-xs text-gray-300">
                  {categoryLabel}
                </span>
                {formData.isPublic ? (
                  <span className="rounded bg-green-600/20 px-2 py-1 text-xs text-green-400">
                    Public
                  </span>
                ) : (
                  <span className="rounded bg-yellow-600/20 px-2 py-1 text-xs text-yellow-400">
                    Private
                  </span>
                )}
                {formData.isNsfw && (
                  <span className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400">NSFW</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="rounded-lg border border-primary-500/30 bg-primary-600/20 p-4">
        <h4 className="mb-2 font-medium text-primary-300">Your Subscription</h4>
        <p className="text-sm text-gray-300">
          You're on the{' '}
          <span className="font-bold text-white">{subscriptionTier.toUpperCase()}</span> tier.
          {subscriptionTier === 'free' && (
            <span className="mt-1 block text-gray-400">
              Free tier includes up to 5 forums. Upgrade for unlimited forums and additional
              features!
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

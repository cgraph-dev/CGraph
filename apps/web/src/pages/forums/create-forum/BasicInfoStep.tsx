/**
 * BasicInfoStep component - Step 1: Name, slug, description, category
 */

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { FORUM_CATEGORIES, NAME_MIN_LENGTH, NAME_MAX_LENGTH, SLUG_MAX_LENGTH } from './constants';
import type { ForumFormData } from './types';

interface BasicInfoStepProps {
  formData: ForumFormData;
  onNameChange: (name: string) => void;
  onUpdateField: <K extends keyof ForumFormData>(key: K, value: ForumFormData[K]) => void;
}

export function BasicInfoStep({ formData, onNameChange, onUpdateField }: BasicInfoStepProps) {
  const nameInvalid =
    formData.name &&
    (formData.name.length < NAME_MIN_LENGTH || formData.name.length > NAME_MAX_LENGTH);

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
        Basic Information
      </h2>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Forum Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="MyAwesomeForum"
          className={`w-full rounded-lg border bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${
            nameInvalid ? 'border-red-500' : 'border-dark-600'
          }`}
          maxLength={NAME_MAX_LENGTH}
        />
        <div className="mt-1 flex justify-between">
          <p className="text-sm text-gray-500">
            {NAME_MIN_LENGTH}-{NAME_MAX_LENGTH} characters. Letters, numbers, underscores only.
          </p>
          <span
            className={`text-sm ${
              formData.name.length < NAME_MIN_LENGTH
                ? 'text-red-400'
                : formData.name.length > NAME_MAX_LENGTH
                  ? 'text-red-400'
                  : 'text-gray-500'
            }`}
          >
            {formData.name.length}/{NAME_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">URL Slug *</label>
        <div className="flex items-center">
          <span className="mr-2 text-gray-500">cgraph.com/forums/</span>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) =>
              onUpdateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            placeholder="my-awesome-forum"
            className="flex-1 rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            maxLength={SLUG_MAX_LENGTH}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => onUpdateField('description', e.target.value)}
          placeholder="Tell people what your forum is about..."
          rows={4}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          maxLength={500}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Category</label>
        <select
          value={formData.category}
          onChange={(e) => onUpdateField('category', e.target.value)}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          {FORUM_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

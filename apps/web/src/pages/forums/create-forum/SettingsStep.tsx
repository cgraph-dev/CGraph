/**
 * SettingsStep component - Step 3: Privacy, NSFW, registration
 */

import {
  CogIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import type { ForumFormData } from './types';

interface SettingsStepProps {
  formData: ForumFormData;
  onUpdateField: <K extends keyof ForumFormData>(key: K, value: ForumFormData[K]) => void;
}

interface ToggleSettingProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  onToggle: () => void;
  activeColor?: 'green' | 'red' | 'yellow';
}

function ToggleSetting({
  icon,
  activeIcon,
  title,
  description,
  isActive,
  onToggle,
  activeColor = 'green',
}: ToggleSettingProps) {
  const colorMap = {
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  };

  return (
    <div className="rounded-lg bg-dark-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive && activeIcon ? activeIcon : icon}
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? colorMap[activeColor] : 'bg-dark-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export function SettingsStep({ formData, onUpdateField }: SettingsStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white">
        <CogIcon className="h-6 w-6" />
        Forum Settings
      </h2>

      <div className="space-y-4">
        <ToggleSetting
          icon={<LockClosedIcon className="h-6 w-6 text-yellow-500" />}
          activeIcon={<GlobeAltIcon className="h-6 w-6 text-green-500" />}
          title={formData.isPublic ? 'Public Forum' : 'Private Forum'}
          description={
            formData.isPublic
              ? 'Anyone can view and join your forum'
              : 'Only approved members can access'
          }
          isActive={formData.isPublic}
          onToggle={() => onUpdateField('isPublic', !formData.isPublic)}
          activeColor="green"
        />

        <ToggleSetting
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-gray-500" />}
          activeIcon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
          title="NSFW Content"
          description="Mark if forum contains adult content"
          isActive={formData.isNsfw}
          onToggle={() => onUpdateField('isNsfw', !formData.isNsfw)}
          activeColor="red"
        />

        <ToggleSetting
          icon={<UsersIcon className="h-6 w-6 text-gray-500" />}
          activeIcon={<UsersIcon className="h-6 w-6 text-green-500" />}
          title="Open Registration"
          description="Allow anyone to join your forum"
          isActive={formData.registrationOpen}
          onToggle={() => onUpdateField('registrationOpen', !formData.registrationOpen)}
          activeColor="green"
        />
      </div>
    </div>
  );
}

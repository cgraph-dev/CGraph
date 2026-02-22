/**
 * Holographic v4.0 Demo Section
 */

import { useState } from 'react';
import {
  HoloProvider,
  HoloText,
  HoloButton,
  HoloCard,
  HoloAvatar,
  HoloInput,
  HoloProgress,
  HoloBadge,
  HoloTabs,
  HoloDivider,
  HoloModal,
  HoloNotification,
  HoloTooltip,
} from '@/components/enhanced/ui/holographic-ui-v4/index';
import type { HolographicV4DemoProps } from './types';

export function HolographicV4Demo({
  preset,
  setPreset,
  activeTab,
  setActiveTab,
  showModal,
  setShowModal,
}: HolographicV4DemoProps) {
  const [inputValue, setInputValue] = useState('');
  const [progress, setProgress] = useState(72);
  const [showNotification, setShowNotification] = useState(false);

  const presets: Array<'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight'> = [
    'cyan',
    'matrix',
    'purple',
    'gold',
    'midnight',
  ];
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'effects', label: 'Effects', icon: '✨' },
  ];

  return (
    <HoloProvider config={{ preset, intensity: 'medium' }}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-white">🚀 Holographic UI v4.0</h2>
            <p className="text-gray-400">
              Next-gen holographic components with theme engine integration
            </p>
          </div>

          {/* Preset Selector */}
          <div className="flex gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`rounded-lg px-4 py-2 capitalize transition-all ${
                  preset === p
                    ? 'border border-white/30 bg-white/20 text-white'
                    : 'border border-transparent bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Demo */}
        <HoloTabs
          tabs={tabs.map((t) => ({ id: t.id, label: `${t.icon} ${t.label}` }))}
          activeTab={activeTab}
          onChange={setActiveTab}
          preset={preset}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Container & Text */}
          <HoloCard
            preset={preset}
            header={
              <HoloText variant="subtitle" preset={preset}>
                Text Variants
              </HoloText>
            }
          >
            <div className="space-y-4">
              <HoloText variant="display" preset={preset} gradient>
                Display
              </HoloText>
              <HoloText variant="title" preset={preset}>
                Title Text
              </HoloText>
              <HoloText variant="subtitle" preset={preset}>
                Subtitle Text
              </HoloText>
              <HoloText variant="body" preset={preset}>
                Body text for content.
              </HoloText>
              <HoloText variant="caption" preset={preset}>
                Caption text
              </HoloText>
              <HoloText variant="label" preset={preset}>
                Label
              </HoloText>
            </div>
          </HoloCard>

          {/* Buttons */}
          <HoloCard
            preset={preset}
            header={
              <HoloText variant="subtitle" preset={preset}>
                Buttons
              </HoloText>
            }
          >
            <div className="space-y-3">
              <HoloButton preset={preset} variant="primary" fullWidth>
                Primary Button
              </HoloButton>
              <HoloButton preset={preset} variant="secondary" fullWidth>
                Secondary
              </HoloButton>
              <HoloButton preset={preset} variant="ghost" fullWidth>
                Ghost
              </HoloButton>
              <div className="flex gap-2">
                <HoloButton preset={preset} variant="success" size="sm">
                  Success
                </HoloButton>
                <HoloButton preset={preset} variant="danger" size="sm">
                  Danger
                </HoloButton>
              </div>
              <HoloButton preset={preset} loading fullWidth>
                Loading...
              </HoloButton>
            </div>
          </HoloCard>

          {/* Avatars */}
          <HoloCard
            preset={preset}
            header={
              <HoloText variant="subtitle" preset={preset}>
                Avatars
              </HoloText>
            }
          >
            <div className="flex flex-wrap items-end gap-4">
              <HoloAvatar name="Alice" size="xs" preset={preset} status="online" />
              <HoloAvatar name="Bob Wilson" size="sm" preset={preset} status="away" />
              <HoloAvatar name="Charlie" size="md" preset={preset} status="busy" />
              <HoloAvatar name="Diana King" size="lg" preset={preset} status="offline" />
              <HoloAvatar
                name="Echo"
                size="xl"
                preset={preset}
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=echo"
              />
            </div>
          </HoloCard>

          {/* Input & Progress */}
          <HoloCard
            preset={preset}
            header={
              <HoloText variant="subtitle" preset={preset}>
                Inputs & Progress
              </HoloText>
            }
          >
            <div className="space-y-4">
              <HoloInput
                value={inputValue}
                onChange={setInputValue}
                placeholder="Type something..."
                label="Holographic Input"
                preset={preset}
              />
              <div>
                <p className="mb-2 text-sm text-gray-400">Linear Progress</p>
                <HoloProgress value={progress} preset={preset} />
              </div>
              <div className="flex items-center gap-4">
                <HoloProgress value={progress} preset={preset} variant="circular" size="sm" />
                <HoloProgress value={progress} preset={preset} variant="circular" size="md" />
                <HoloProgress value={progress} preset={preset} variant="circular" size="lg" />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </HoloCard>

          {/* Badges & Tooltips */}
          <HoloCard
            preset={preset}
            header={
              <HoloText variant="subtitle" preset={preset}>
                Badges & Tooltips
              </HoloText>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <HoloBadge preset={preset}>Default</HoloBadge>
                <HoloBadge preset={preset} variant="success">
                  Success
                </HoloBadge>
                <HoloBadge preset={preset} variant="warning">
                  Warning
                </HoloBadge>
                <HoloBadge preset={preset} variant="error">
                  Error
                </HoloBadge>
                <HoloBadge preset={preset} variant="info" pulse>
                  Live
                </HoloBadge>
              </div>
              <HoloDivider preset={preset} />
              <div className="flex gap-4">
                <HoloTooltip content="This is a tooltip!" preset={preset}>
                  <HoloButton preset={preset} size="sm" variant="ghost">
                    Hover me
                  </HoloButton>
                </HoloTooltip>
                <HoloTooltip content="Bottom tooltip" preset={preset} position="bottom">
                  <HoloButton preset={preset} size="sm" variant="ghost">
                    Bottom
                  </HoloButton>
                </HoloTooltip>
              </div>
            </div>
          </HoloCard>

          {/* Modal & Notifications */}
          <HoloCard
            preset={preset}
            header={
              <HoloText variant="subtitle" preset={preset}>
                Modal & Notifications
              </HoloText>
            }
          >
            <div className="space-y-4">
              <HoloButton preset={preset} onClick={() => setShowModal(true)} fullWidth>
                Open Modal
              </HoloButton>
              <HoloButton
                preset={preset}
                variant="secondary"
                onClick={() => setShowNotification(true)}
                fullWidth
              >
                Show Notification
              </HoloButton>
            </div>
          </HoloCard>
        </div>

        {/* Modal */}
        <HoloModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Holographic Modal v4.0"
          preset={preset}
          footer={
            <>
              <HoloButton preset={preset} variant="ghost" onClick={() => setShowModal(false)}>
                Cancel
              </HoloButton>
              <HoloButton preset={preset} onClick={() => setShowModal(false)}>
                Confirm
              </HoloButton>
            </>
          }
        >
          <div className="space-y-4">
            <HoloText variant="body" preset={preset}>
              This is a holographic modal with the {preset} theme preset. It features animated
              borders, glow effects, and smooth transitions.
            </HoloText>
            <HoloInput value="" onChange={() => {}} placeholder="Modal input..." preset={preset} />
          </div>
        </HoloModal>

        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50">
            <HoloNotification
              message="Holographic Notification v4.0"
              description="This notification features the new holographic styling with smooth animations."
              type="success"
              preset={preset}
              duration={5000}
              onDismiss={() => setShowNotification(false)}
              action={{
                label: 'View Details',
                onClick: () => console.log('Action clicked'),
              }}
            />
          </div>
        )}
      </div>
    </HoloProvider>
  );
}

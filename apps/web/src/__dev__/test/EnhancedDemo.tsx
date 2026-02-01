/**
 * Enhanced Components Demo Page
 *
 * Showcases all v2.0, v3.0, and v4.0 enhanced components in one place
 * for testing and demonstration purposes.
 *
 * @version 4.0.0
 * @since v0.7.36
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

// Import all enhanced components (v2.0)
import GlassCard, {
  GlassCardNeon,
  GlassCardHolographic,
  GlassCardCrystal,
} from '@/components/ui/GlassCard';
import { AnimatedMessageWrapper } from '@/components/conversation/AnimatedMessageWrapper';
import {
  AnimatedReactionBubble,
  ReactionPicker,
} from '@/components/conversation/AnimatedReactionBubble';
import Matrix3DEnvironment from '@/components/three/Matrix3DEnvironment';
import ShaderBackground from '@/components/shaders/ShaderBackground';
import AdvancedVoiceVisualizer from '@/components/audio/AdvancedVoiceVisualizer';
import { themeEngine as aiThemeEngine } from '@/lib/ai/ThemeEngine';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

// Import v3.0 Holographic Components (legacy)
import {
  HolographicContainer,
  HolographicText,
  HolographicButton,
  HolographicCard,
  HolographicAvatar,
  HolographicInput,
  HolographicProgress,
  HolographicNotification,
} from '@/components/enhanced/ui/HolographicUI';

// Import v4.0 Holographic Components
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
} from '@/components/enhanced/ui/HolographicUIv4';

// Demo sections
type DemoSection =
  | 'glasscards'
  | 'messages'
  | 'reactions'
  | 'matrix3d'
  | 'shaders'
  | 'voice'
  | 'theme'
  | 'holographic'
  | 'holov4';

export default function EnhancedDemo() {
  const [activeSection, setActiveSection] = useState<DemoSection>('holographic');
  const [showBackground, setShowBackground] = useState(true);
  const [backgroundType, setBackgroundType] = useState<'matrix3d' | 'shader'>('shader');
  const [shaderVariant, setShaderVariant] = useState<
    'fluid' | 'particles' | 'waves' | 'neural' | 'matrix'
  >('matrix');
  const [matrixTheme, setMatrixTheme] = useState<
    'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow'
  >('matrix-green');

  // Holographic demo state
  const [holoTheme, setHoloTheme] = useState<'cyan' | 'green' | 'purple' | 'gold'>('cyan');
  const [holoProgress, setHoloProgress] = useState(65);
  const [holoInput, setHoloInput] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  // v4.0 demo state
  const [holoV4Preset, setHoloV4Preset] = useState<
    'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight'
  >('cyan');
  const [holoV4Tab, setHoloV4Tab] = useState('overview');
  const [showHoloModal, setShowHoloModal] = useState(false);

  const sections: { id: DemoSection; label: string }[] = [
    { id: 'holov4', label: '🚀 Holographic v4.0' },
    { id: 'holographic', label: '✨ Holographic v3.0' },
    { id: 'glasscards', label: '🃏 Glass Cards' },
    { id: 'messages', label: '💬 Messages' },
    { id: 'reactions', label: '🎉 Reactions' },
    { id: 'matrix3d', label: '🌐 Matrix 3D' },
    { id: 'shaders', label: '🎨 Shaders' },
    { id: 'voice', label: '🎤 Voice' },
    { id: 'theme', label: '🎭 AI Theme' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Background */}
      {showBackground && backgroundType === 'shader' && (
        <ShaderBackground
          variant={shaderVariant}
          color1="#00ff41"
          color2="#003b00"
          color3="#39ff14"
          speed={0.8}
          intensity={0.6}
          interactive
        />
      )}
      {showBackground && backgroundType === 'matrix3d' && (
        <Matrix3DEnvironment theme={matrixTheme} intensity="medium" interactive />
      )}

      {/* Fallback dark background */}
      {!showBackground && (
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      )}

      {/* Header */}
      <header className="relative z-20 border-b border-white/10 bg-black/30 p-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">✨ Enhanced Components v3.0</h1>
            <p className="mt-1 text-gray-400">Interactive demo of v0.7.35 HYPERTHINK components</p>
          </div>
          <Link
            to="/login"
            className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-500"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      {/* Background Controls */}
      <div className="relative z-20 border-b border-white/10 bg-black/20 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={showBackground}
              onChange={(e) => setShowBackground(e.target.checked)}
              className="rounded"
            />
            Show Background
          </label>

          {showBackground && (
            <>
              <select
                value={backgroundType}
                onChange={(e) => setBackgroundType(e.target.value as 'matrix3d' | 'shader')}
                className="rounded border border-white/20 bg-black/50 px-3 py-1.5 text-white"
              >
                <option value="shader">WebGL Shader</option>
                <option value="matrix3d">Matrix 3D</option>
              </select>

              {backgroundType === 'shader' && (
                <select
                  value={shaderVariant}
                  onChange={(e) => setShaderVariant(e.target.value as typeof shaderVariant)}
                  className="rounded border border-white/20 bg-black/50 px-3 py-1.5 text-white"
                >
                  <option value="matrix">Matrix</option>
                  <option value="fluid">Fluid</option>
                  <option value="particles">Particles</option>
                  <option value="waves">Waves</option>
                  <option value="neural">Neural</option>
                </select>
              )}

              {backgroundType === 'matrix3d' && (
                <select
                  value={matrixTheme}
                  onChange={(e) => setMatrixTheme(e.target.value as typeof matrixTheme)}
                  className="rounded border border-white/20 bg-black/50 px-3 py-1.5 text-white"
                >
                  <option value="matrix-green">Matrix Green</option>
                  <option value="cyber-blue">Cyber Blue</option>
                  <option value="purple-haze">Purple Haze</option>
                  <option value="amber-glow">Amber Glow</option>
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <nav className="relative z-20 border-b border-white/10 bg-black/20 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setActiveSection(section.id);
                HapticFeedback.light();
              }}
              className={`rounded-lg px-4 py-2 font-medium transition-all ${
                activeSection === section.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 p-6">
        <div className="mx-auto max-w-7xl">
          {activeSection === 'holov4' && (
            <HolographicV4Demo
              preset={holoV4Preset}
              setPreset={setHoloV4Preset}
              activeTab={holoV4Tab}
              setActiveTab={setHoloV4Tab}
              showModal={showHoloModal}
              setShowModal={setShowHoloModal}
            />
          )}
          {activeSection === 'holographic' && (
            <HolographicDemo
              theme={holoTheme}
              setTheme={setHoloTheme}
              progress={holoProgress}
              setProgress={setHoloProgress}
              inputValue={holoInput}
              setInputValue={setHoloInput}
              showNotification={showNotification}
              setShowNotification={setShowNotification}
            />
          )}
          {activeSection === 'glasscards' && <GlassCardsDemo />}
          {activeSection === 'messages' && <MessagesDemo />}
          {activeSection === 'reactions' && <ReactionsDemo />}
          {activeSection === 'matrix3d' && <Matrix3DDemo />}
          {activeSection === 'shaders' && <ShadersDemo />}
          {activeSection === 'voice' && <VoiceDemo />}
          {activeSection === 'theme' && <ThemeDemo />}
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// HOLOGRAPHIC DEMO (v3.0)
// =============================================================================

interface HolographicDemoProps {
  theme: 'cyan' | 'green' | 'purple' | 'gold';
  setTheme: (theme: 'cyan' | 'green' | 'purple' | 'gold') => void;
  progress: number;
  setProgress: (progress: number) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  showNotification: boolean;
  setShowNotification: (show: boolean) => void;
}

// =============================================================================
// HOLOGRAPHIC V4 DEMO
// =============================================================================

interface HolographicV4DemoProps {
  preset: 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight';
  setPreset: (preset: 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

function HolographicV4Demo({
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

// =============================================================================
// HOLOGRAPHIC V3 DEMO
// =============================================================================

function HolographicDemo({
  theme,
  setTheme,
  progress,
  setProgress,
  inputValue,
  setInputValue,
  showNotification,
  setShowNotification,
}: HolographicDemoProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-white">✨ Holographic UI v3.0</h2>
          <p className="text-gray-400">Futuristic interface components with 3D effects</p>
        </div>

        {/* Theme Selector */}
        <div className="flex gap-2">
          {(['cyan', 'green', 'purple', 'gold'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                theme === t
                  ? 'scale-110 border-white'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{
                background:
                  t === 'cyan'
                    ? '#00d4ff'
                    : t === 'green'
                      ? '#00ff88'
                      : t === 'purple'
                        ? '#8b5cf6'
                        : '#fbbf24',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Holographic Container */}
      <HolographicContainer
        config={{ colorTheme: theme, enableScanlines: true, enableFlicker: true }}
      >
        <div className="space-y-8 p-8">
          {/* Text Demo */}
          <div className="text-center">
            <HolographicText colorTheme={theme} variant="title" glowIntensity={2}>
              WELCOME TO THE FUTURE
            </HolographicText>
            <HolographicText colorTheme={theme} variant="subtitle" className="mt-2 opacity-70">
              CGraph v0.7.35 - HYPERTHINK Release
            </HolographicText>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <HolographicCard colorTheme={theme}>
              <div className="p-4 text-center">
                <div className="mb-2 text-3xl">🔐</div>
                <h3 className="font-semibold text-white">Signal Protocol</h3>
                <p className="mt-1 text-sm text-gray-400">End-to-end encryption</p>
              </div>
            </HolographicCard>

            <HolographicCard colorTheme={theme}>
              <div className="p-4 text-center">
                <div className="mb-2 text-3xl">🧠</div>
                <h3 className="font-semibold text-white">AI Intelligence</h3>
                <p className="mt-1 text-sm text-gray-400">Smart messaging</p>
              </div>
            </HolographicCard>

            <HolographicCard colorTheme={theme}>
              <div className="p-4 text-center">
                <div className="mb-2 text-3xl">🔊</div>
                <h3 className="font-semibold text-white">Spatial Audio</h3>
                <p className="mt-1 text-sm text-gray-400">3D positional sound</p>
              </div>
            </HolographicCard>
          </div>

          {/* Avatar Row */}
          <div className="flex justify-center gap-6">
            <HolographicAvatar colorTheme={theme} size="lg" status="online" name="User 1" />
            <HolographicAvatar colorTheme={theme} size="lg" status="away" name="User 2" />
            <HolographicAvatar colorTheme={theme} size="lg" status="busy" name="User 3" />
            <HolographicAvatar colorTheme={theme} size="lg" status="offline" name="Bot" />
          </div>

          {/* Input Demo */}
          <div className="mx-auto max-w-md">
            <HolographicInput
              colorTheme={theme}
              placeholder="Enter access code..."
              value={inputValue}
              onChange={setInputValue}
            />
          </div>

          {/* Progress Demo */}
          <div className="mx-auto max-w-md space-y-4">
            <HolographicProgress colorTheme={theme} value={progress} showLabel />
            <div className="flex justify-center gap-4">
              <HolographicButton
                colorTheme={theme}
                size="sm"
                onClick={() => setProgress(Math.max(0, progress - 10))}
              >
                -10%
              </HolographicButton>
              <HolographicButton
                colorTheme={theme}
                size="sm"
                onClick={() => setProgress(Math.min(100, progress + 10))}
              >
                +10%
              </HolographicButton>
            </div>
          </div>

          {/* Button Row */}
          <div className="flex flex-wrap justify-center gap-4">
            <HolographicButton colorTheme="cyan" onClick={() => setShowNotification(true)}>
              Show Notification
            </HolographicButton>
            <HolographicButton colorTheme="green">Connect</HolographicButton>
            <HolographicButton colorTheme="purple">Encrypt</HolographicButton>
            <HolographicButton colorTheme="gold">Premium</HolographicButton>
          </div>
        </div>
      </HolographicContainer>

      {/* Notification Demo */}
      {showNotification && (
        <HolographicNotification
          type="success"
          message="Connection Established - Neural link active!"
          duration={5000}
          onDismiss={() => setShowNotification(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// DEMO SECTIONS
// =============================================================================

function GlassCardsDemo() {
  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Glass Card Variants</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard variant="default" hover3D glow>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white">Default</h3>
            <p className="mt-2 text-gray-400">Standard glass effect with subtle blur</p>
          </div>
        </GlassCard>

        <GlassCard variant="frosted" hover3D shimmer>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white">Frosted</h3>
            <p className="mt-2 text-gray-400">Heavy blur with shimmer effect</p>
          </div>
        </GlassCard>

        <GlassCardCrystal hover3D glow borderGradient>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-emerald-400">Crystal</h3>
            <p className="mt-2 text-gray-400">Emerald-tinted crystal glass</p>
          </div>
        </GlassCardCrystal>

        <GlassCardNeon hover3D glow particles>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-pink-400">Neon</h3>
            <p className="mt-2 text-gray-400">Vibrant neon with particles</p>
          </div>
        </GlassCardNeon>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCardHolographic hover3D shimmer borderGradient className="col-span-1">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-white">Holographic</h3>
            <p className="mt-2 text-gray-400">
              Multi-color gradient with holographic shimmer effect. Move your mouse over the card to
              see the 3D tilt effect.
            </p>
          </div>
        </GlassCardHolographic>

        <GlassCard variant="crystal" hover3D glow glowColor="rgba(139, 92, 246, 0.5)" shimmer>
          <div className="p-8">
            <h3 className="text-xl font-semibold text-violet-400">Custom Glow</h3>
            <p className="mt-2 text-gray-400">
              Cards can have custom glow colors. This one uses violet. Combine with shimmer for
              extra sparkle.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MessagesDemo() {
  const [messages] = useState([
    { id: '1', text: 'Hey! Check out these new animations 🚀', isOwn: false },
    { id: '2', text: 'Wow, these look amazing! The spring physics feel so smooth', isOwn: true },
    { id: '3', text: 'Try swiping on a message to reply!', isOwn: false },
    { id: '4', text: 'And long press for more options 👀', isOwn: true },
  ]);

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Animated Messages</h2>
      <p className="mb-4 text-gray-400">
        Messages with spring physics, swipe gestures, and particle effects
      </p>

      <GlassCard variant="frosted" className="mx-auto max-w-lg">
        <div className="space-y-3 p-4">
          {messages.map((msg, index) => (
            <AnimatedMessageWrapper
              key={msg.id}
              isOwnMessage={msg.isOwn}
              index={index}
              isNew={index >= 2}
              messageId={msg.id}
              onSwipeReply={() => console.log('Reply to:', msg.id)}
              onLongPress={() => console.log('Long press:', msg.id)}
              enableGestures
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.isOwn ? 'ml-auto bg-primary-600 text-white' : 'bg-gray-700 text-white'
                }`}
              >
                {msg.text}
              </div>
            </AnimatedMessageWrapper>
          ))}
        </div>
      </GlassCard>

      <p className="text-center text-sm text-gray-500">
        💡 Drag left/right to swipe • Long press for context menu
      </p>
    </div>
  );
}

function ReactionsDemo() {
  const [reactions, setReactions] = useState([
    { emoji: '👍', count: 12, hasReacted: false },
    { emoji: '❤️', count: 8, hasReacted: true },
    { emoji: '😂', count: 5, hasReacted: false },
    { emoji: '🔥', count: 3, hasReacted: false },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  const handleReact = (emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
            : r
        );
      }
      return [...prev, { emoji, count: 1, hasReacted: true }];
    });
    setShowPicker(false);
  };

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Reaction System</h2>
      <p className="mb-4 text-gray-400">
        Animated reactions with spring physics and particle effects
      </p>

      <GlassCard variant="frosted" className="mx-auto max-w-lg p-6">
        <div className="mb-4 rounded-2xl bg-gray-700 p-4">
          <p className="text-white">This message has reactions! Click to toggle them.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reactions.map((reaction) => (
            <AnimatedReactionBubble
              key={reaction.emoji}
              reaction={reaction}
              isOwnMessage={false}
              onPress={() => handleReact(reaction.emoji)}
            />
          ))}

          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-600 text-gray-300 transition-colors hover:bg-gray-500 hover:text-white"
          >
            +
          </button>
        </div>

        {showPicker && (
          <div className="mt-4">
            <ReactionPicker onSelect={handleReact} onClose={() => setShowPicker(false)} />
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function Matrix3DDemo() {
  const [theme, setTheme] = useState<'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow'>(
    'matrix-green'
  );
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Matrix 3D Environment</h2>
      <p className="mb-4 text-gray-400">
        Immersive Three.js environment with post-processing effects
      </p>

      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-white"
        >
          <option value="matrix-green">Matrix Green</option>
          <option value="cyber-blue">Cyber Blue</option>
          <option value="purple-haze">Purple Haze</option>
          <option value="amber-glow">Amber Glow</option>
        </select>

        <select
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as typeof intensity)}
          className="rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-white"
        >
          <option value="low">Low (50 columns)</option>
          <option value="medium">Medium (100 columns)</option>
          <option value="high">High (200 columns)</option>
        </select>
      </div>

      <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10">
        <Matrix3DEnvironment
          theme={theme}
          intensity={intensity}
          interactive
          className="!relative !z-0"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <GlassCard variant="frosted" className="pointer-events-auto">
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-white">Embedded Content</h3>
              <p className="mt-2 text-gray-400">UI overlays the 3D scene</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function ShadersDemo() {
  const [variant, setVariant] = useState<'fluid' | 'particles' | 'waves' | 'neural' | 'matrix'>(
    'fluid'
  );

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">WebGL Shader Backgrounds</h2>
      <p className="mb-4 text-gray-400">
        High-performance animated backgrounds using custom GLSL shaders
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['fluid', 'particles', 'waves', 'neural', 'matrix'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded-lg px-4 py-2 capitalize ${
              variant === v
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="relative h-[400px] overflow-hidden rounded-2xl border border-white/10">
        <ShaderBackground
          variant={variant}
          color1="#00ff41"
          color2="#003b00"
          color3="#39ff14"
          speed={1}
          intensity={1}
          interactive
          className="!relative"
        />
      </div>
    </div>
  );
}

function VoiceDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [variant, setVariant] = useState<'waveform' | 'spectrum' | 'circular' | 'particles'>(
    'spectrum'
  );

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Voice Visualizer</h2>
      <p className="mb-4 text-gray-400">Audio visualization using Web Audio API and Canvas</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['waveform', 'spectrum', 'circular', 'particles'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded-lg px-4 py-2 capitalize ${
              variant === v
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <GlassCard variant="frosted" className="p-6">
        <div className="mb-4 text-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`rounded-full px-6 py-3 font-medium transition-all ${
              isPlaying
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-primary-600 text-white hover:bg-primary-500'
            }`}
          >
            {isPlaying ? '⏹ Stop' : '🎤 Start Microphone'}
          </button>
        </div>

        <div className="h-[200px] overflow-hidden rounded-lg bg-black/50">
          <AdvancedVoiceVisualizer
            variant={variant}
            theme="matrix-green"
            height={200}
            isPlaying={isPlaying}
          />
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Note: Requires microphone permission when started
        </p>
      </GlassCard>
    </div>
  );
}

function ThemeDemo() {
  const [generatedTheme, setGeneratedTheme] = useState<ReturnType<
    typeof aiThemeEngine.getRecommendedTheme
  > | null>(null);

  const generateTheme = () => {
    const theme = aiThemeEngine.getRecommendedTheme();
    setGeneratedTheme(theme);
    aiThemeEngine.applyTheme(theme);
    HapticFeedback.medium();
  };

  return (
    <div className="space-y-8">
      <h2 className="mb-6 text-2xl font-bold text-white">AI Theme Engine</h2>
      <p className="mb-4 text-gray-400">
        Generates adaptive color themes based on time, user preferences, and activity
      </p>

      <div className="mb-6 flex gap-4">
        <button
          onClick={generateTheme}
          className="rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-500"
        >
          🎨 Generate Theme
        </button>
      </div>

      {generatedTheme && (
        <GlassCard variant="frosted" className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Generated Theme</h3>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.entries(generatedTheme.colors)
              .slice(0, 8)
              .map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="mb-2 h-16 w-full rounded-lg border border-white/10"
                    style={{ background: color as string }}
                  />
                  <p className="text-xs capitalize text-gray-400">{name}</p>
                  <p className="font-mono text-xs text-gray-500">{color as string}</p>
                </div>
              ))}
          </div>

          <div className="mt-6 rounded-lg bg-black/30 p-4">
            <p className="text-sm text-gray-400">
              <strong>Mood:</strong> {generatedTheme.metadata.mood}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Name:</strong> {generatedTheme.metadata.name}
            </p>
            <p className="text-sm text-gray-400">
              <strong>Contrast Ratio:</strong> {generatedTheme.metadata.contrastRatio.toFixed(2)}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

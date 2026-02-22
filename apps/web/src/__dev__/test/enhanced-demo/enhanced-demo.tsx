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
import Matrix3DEnvironment from '@/components/three/matrix3-d-environment';
import ShaderBackground from '@/components/shaders/shader-background';
import { HapticFeedback } from '@/lib/animations/animation-engine';

// Import demo sections
import { HolographicV4Demo } from './holographic-v4-demo';
import { HolographicDemo } from './holographic-v3-demo';
import { GlassCardsDemo } from './glass-cards-demo';
import { MessagesDemo } from './messages-demo';
import { ReactionsDemo } from './reactions-demo';
import { Matrix3DDemo } from './matrix3-d-demo';
import { ShadersDemo } from './shaders-demo';
import { VoiceDemo } from './voice-demo';
import { ThemeDemo } from './theme-demo';

// Import constants and types
import { sections } from './constants';
import type {
  DemoSection,
  HoloTheme,
  HoloV4Preset,
  BackgroundType,
  ShaderVariant,
  MatrixTheme,
} from './types';

export default function EnhancedDemo() {
  const [activeSection, setActiveSection] = useState<DemoSection>('holographic');
  const [showBackground, setShowBackground] = useState(true);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('shader');
  const [shaderVariant, setShaderVariant] = useState<ShaderVariant>('matrix');
  const [matrixTheme, setMatrixTheme] = useState<MatrixTheme>('matrix-green');

  // Holographic demo state
  const [holoTheme, setHoloTheme] = useState<HoloTheme>('cyan');
  const [holoProgress, setHoloProgress] = useState(65);
  const [holoInput, setHoloInput] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  // v4.0 demo state
  const [holoV4Preset, setHoloV4Preset] = useState<HoloV4Preset>('cyan');
  const [holoV4Tab, setHoloV4Tab] = useState('overview');
  const [showHoloModal, setShowHoloModal] = useState(false);

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
                onChange={(e) => setBackgroundType(e.target.value as BackgroundType)}
                className="rounded border border-white/20 bg-black/50 px-3 py-1.5 text-white"
              >
                <option value="shader">WebGL Shader</option>
                <option value="matrix3d">Matrix 3D</option>
              </select>

              {backgroundType === 'shader' && (
                <select
                  value={shaderVariant}
                  onChange={(e) => setShaderVariant(e.target.value as ShaderVariant)}
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
                  onChange={(e) => setMatrixTheme(e.target.value as MatrixTheme)}
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

/**
 * Holographic v3.0 Demo Section
 */

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
import type { HolographicDemoProps } from './types';

export function HolographicDemo({
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

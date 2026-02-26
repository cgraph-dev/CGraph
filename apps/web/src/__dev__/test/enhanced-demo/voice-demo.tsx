/**
 * Voice Demo Section
 */

import { useState } from 'react';
import { GlassCard } from '@/shared/components/ui';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/advanced-voice-visualizer';

/**
 * unknown.
 */
/**
 * Voice Demo component.
 */
export function VoiceDemo() {
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

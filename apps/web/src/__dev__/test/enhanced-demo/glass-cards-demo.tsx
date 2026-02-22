/**
 * Glass Cards Demo Section
 */

import {
  GlassCard,
  GlassCardNeon,
  GlassCardHolographic,
  GlassCardCrystal,
} from '@/shared/components/ui';

export function GlassCardsDemo() {
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

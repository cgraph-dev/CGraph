/**
 * Storybook stories for the VoiceMessagePlayer component.
 * @module components/media/voice-message-player.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Isolated mock of voice player for Storybook rendering */
function MockVoicePlayer({
  state = 'paused',
  duration = '0:12',
  elapsed = '0:00',
  speed = 1,
}: {
  state?: 'playing' | 'paused' | 'loading';
  duration?: string;
  elapsed?: string;
  speed?: number;
}) {
  const progress = state === 'playing' ? 45 : 0;

  return (
    <div className="flex w-[280px] items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
      {/* Play/pause button */}
      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white">
        {state === 'loading' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : state === 'playing' ? (
          <span className="text-xs">❚❚</span>
        ) : (
          <span className="ml-0.5 text-xs">▶</span>
        )}
      </button>

      {/* Waveform / progress */}
      <div className="flex-1">
        <div className="relative flex h-6 items-end gap-[2px]">
          {Array.from({ length: 24 }).map((_, i) => {
            const height = 8 + Math.sin(i * 0.8) * 12 + Math.random() * 4;
            const filled = (i / 24) * 100 < progress;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full ${filled ? 'bg-primary-400' : 'bg-white/[0.12]'}`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>
      </div>

      {/* Time + speed */}
      <div className="flex flex-col items-end">
        <span className="text-xs text-gray-300">{state === 'playing' ? elapsed : duration}</span>
        <span className="text-[10px] text-gray-500">{speed}×</span>
      </div>
    </div>
  );
}

const meta: Meta<typeof MockVoicePlayer> = {
  title: 'Media/VoicePlayer',
  component: MockVoicePlayer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    state: { control: 'select', options: ['playing', 'paused', 'loading'] },
    speed: { control: 'select', options: [0.5, 1, 1.5, 2] },
  },
} satisfies Meta<typeof MockVoicePlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Paused: Story = {
  args: { state: 'paused', duration: '0:12' },
};

export const Playing: Story = {
  args: { state: 'playing', elapsed: '0:05', duration: '0:12' },
};

export const Loading: Story = {
  args: { state: 'loading', duration: '...' },
};

export const DoubleSpeed: Story = {
  args: { state: 'playing', speed: 2, elapsed: '0:03', duration: '0:12' },
};

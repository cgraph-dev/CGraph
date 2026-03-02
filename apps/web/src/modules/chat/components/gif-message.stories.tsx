/**
 * Storybook stories for the GifMessage component.
 * @module modules/chat/components/gif-message.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Isolated GIF message mock for Storybook */
function MockGifMessage({
  state = 'loaded',
  autoplay = true,
  alt = 'Funny reaction GIF',
}: {
  state?: 'loading' | 'loaded' | 'error';
  autoplay?: boolean;
  alt?: string;
}) {
  return (
    <div className="w-[260px] overflow-hidden rounded-xl border border-dark-700 bg-dark-800">
      {state === 'loading' && (
        <div className="flex h-[180px] items-center justify-center bg-dark-700">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
        </div>
      )}
      {state === 'loaded' && (
        <div className="relative">
          <div className="h-[180px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          {!autoplay && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur">
                ▶ GIF
              </button>
            </div>
          )}
        </div>
      )}
      {state === 'error' && (
        <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-gray-500">
          <span className="text-2xl">⚠️</span>
          <p className="text-xs">Failed to load GIF</p>
        </div>
      )}
      <p className="px-3 py-2 text-xs text-gray-400">{alt}</p>
    </div>
  );
}

const meta: Meta<typeof MockGifMessage> = {
  title: 'Chat/GifMessage',
  component: MockGifMessage,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    state: { control: 'select', options: ['loading', 'loaded', 'error'] },
    autoplay: { control: 'boolean' },
  },
} satisfies Meta<typeof MockGifMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { state: 'loaded', autoplay: true },
};

export const Loading: Story = {
  args: { state: 'loading' },
};

export const AutoplayOff: Story = {
  args: { state: 'loaded', autoplay: false },
};

export const Error: Story = {
  args: { state: 'error' },
};

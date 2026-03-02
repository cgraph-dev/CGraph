/**
 * Storybook stories for the MessageBubble component.
 * @module modules/chat/components/message-bubble.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Minimal mock to render message bubble variants in isolation */
function MockMessageBubble({
  type = 'text',
  content = 'Hello, world!',
  sender = 'Alice',
  isSent = false,
  isEdited = false,
  isDeleted = false,
  timestamp = '2:34 PM',
}: {
  type?: 'text' | 'image' | 'voice' | 'gif' | 'reply';
  content?: string;
  sender?: string;
  isSent?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  timestamp?: string;
}) {
  const alignment = isSent ? 'items-end' : 'items-start';
  const bg = isSent ? 'bg-primary-600' : 'bg-dark-700';
  const deleted = isDeleted ? 'italic text-gray-500' : 'text-white';

  return (
    <div className={`flex flex-col ${alignment} max-w-[320px]`}>
      {!isSent && <span className="mb-1 text-xs text-gray-400">{sender}</span>}
      <div className={`rounded-2xl px-4 py-2.5 ${bg}`}>
        {type === 'image' && (
          <div className="mb-2 h-40 w-56 rounded-lg bg-dark-600" />
        )}
        {type === 'voice' && (
          <div className="flex items-center gap-2">
            <button className="text-white">▶</button>
            <div className="h-1 w-32 rounded bg-white/30" />
            <span className="text-xs text-gray-300">0:12</span>
          </div>
        )}
        {type === 'gif' && (
          <div className="h-32 w-48 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500" />
        )}
        {type === 'reply' && (
          <div className="mb-2 border-l-2 border-primary-400 pl-2 text-xs text-gray-400">
            Replying to: Previous message...
          </div>
        )}
        <p className={`text-sm ${deleted}`}>
          {isDeleted ? 'This message was deleted' : content}
        </p>
      </div>
      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
        <span>{timestamp}</span>
        {isEdited && <span>(edited)</span>}
      </div>
    </div>
  );
}

const meta: Meta<typeof MockMessageBubble> = {
  title: 'Chat/MessageBubble',
  component: MockMessageBubble,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'image', 'voice', 'gif', 'reply'] },
    isSent: { control: 'boolean' },
    isEdited: { control: 'boolean' },
    isDeleted: { control: 'boolean' },
  },
} satisfies Meta<typeof MockMessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextReceived: Story = {
  args: { type: 'text', content: 'Hey, how are you?', sender: 'Bob', isSent: false },
};

export const TextSent: Story = {
  args: { type: 'text', content: 'I am great, thanks!', isSent: true },
};

export const ImageMessage: Story = {
  args: { type: 'image', content: 'Check this out', isSent: false, sender: 'Charlie' },
};

export const VoiceMessage: Story = {
  args: { type: 'voice', isSent: true },
};

export const GifMessage: Story = {
  args: { type: 'gif', isSent: false, sender: 'Diana' },
};

export const Reply: Story = {
  args: { type: 'reply', content: 'Absolutely agree!', isSent: true },
};

export const Edited: Story = {
  args: { type: 'text', content: 'Updated message', isEdited: true, isSent: false, sender: 'Eve' },
};

export const Deleted: Story = {
  args: { type: 'text', isDeleted: true, isSent: false, sender: 'Frank' },
};

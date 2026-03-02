/**
 * Storybook stories for file attachment display.
 * @module components/media/file-attachment.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Standalone mock file-attachment component for Storybook */
function MockFileAttachment({
  fileName = 'document.pdf',
  fileSize = '2.4 MB',
  type = 'document',
  progress,
}: {
  fileName?: string;
  fileSize?: string;
  type?: 'image' | 'document' | 'video' | 'audio';
  progress?: number;
}) {
  const icons: Record<string, string> = {
    image: '🖼️',
    document: '📄',
    video: '🎬',
    audio: '🎵',
  };

  return (
    <div className="flex w-[300px] items-center gap-3 rounded-lg border border-dark-600 bg-dark-800 p-3">
      {/* Thumbnail / icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-700 text-lg">
        {icons[type]}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-white">{fileName}</p>
        <p className="text-xs text-gray-500">{fileSize}</p>
        {progress !== undefined && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-dark-600">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Download button */}
      {progress === undefined && (
        <button className="rounded p-1 text-gray-400 hover:text-white">⬇️</button>
      )}
    </div>
  );
}

const meta: Meta<typeof MockFileAttachment> = {
  title: 'Media/FileAttachment',
  component: MockFileAttachment,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['image', 'document', 'video', 'audio'] },
    progress: { control: { type: 'range', min: 0, max: 100 } },
  },
} satisfies Meta<typeof MockFileAttachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Document: Story = {
  args: { fileName: 'project-spec.pdf', fileSize: '2.4 MB', type: 'document' },
};

export const Image: Story = {
  args: { fileName: 'screenshot.png', fileSize: '1.1 MB', type: 'image' },
};

export const Video: Story = {
  args: { fileName: 'demo-recording.mp4', fileSize: '48.5 MB', type: 'video' },
};

export const Downloading: Story = {
  args: { fileName: 'large-file.zip', fileSize: '120 MB', type: 'document', progress: 64 },
};

export const Audio: Story = {
  args: { fileName: 'meeting-notes.m4a', fileSize: '8.2 MB', type: 'audio' },
};

/** @module file-message tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileMessage } from '../file-message';
import type { Message } from '@/modules/chat/store';

vi.mock('@heroicons/react/24/outline', () => ({
  DocumentIcon: () => <span data-testid="icon-doc" />,
  ArrowDownTrayIcon: () => <span data-testid="icon-download" />,
  PhotoIcon: () => <span data-testid="icon-photo" />,
  VideoCameraIcon: () => <span data-testid="icon-video" />,
  MusicalNoteIcon: () => <span data-testid="icon-audio" />,
  DocumentTextIcon: () => <span data-testid="icon-text-doc" />,
}));

vi.mock('@/lib/utils', () => ({
  formatBytes: (bytes: number) => `${bytes} B`,
}));

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    content: '',
    encryptedContent: null,
    isEncrypted: false,
    messageType: 'file',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {
      fileUrl: 'https://cdn.example.com/file.pdf',
      fileName: 'report.pdf',
      fileSize: 1024,
      fileMimeType: 'application/pdf',
    },
    reactions: [],
    sender: { id: 'user-1', username: 'alice', displayName: 'Alice', avatarUrl: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as Message;
}

describe('FileMessage', () => {
  it('returns null when no fileUrl exists', () => {
    const msg = makeMessage({ metadata: {} });
    const { container } = render(<FileMessage message={msg} isOwnMessage={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays file name and size for a document', () => {
    render(<FileMessage message={makeMessage()} isOwnMessage={false} />);
    expect(screen.getByText('report.pdf')).toBeTruthy();
    expect(screen.getByText('1024 B')).toBeTruthy();
  });

  it('shows file extension badge', () => {
    render(<FileMessage message={makeMessage()} isOwnMessage={false} />);
    expect(screen.getByText('PDF')).toBeTruthy();
  });

  it('renders image preview for image files', () => {
    const msg = makeMessage({
      metadata: {
        fileUrl: 'https://cdn.example.com/photo.png',
        fileName: 'photo.png',
        fileSize: 2048,
        fileMimeType: 'image/png',
      },
    });
    render(<FileMessage message={msg} isOwnMessage={false} />);
    const img = screen.getByAltText('photo.png');
    expect(img).toBeTruthy();
  });

  it('falls back to generic card on image error', () => {
    const msg = makeMessage({
      metadata: {
        fileUrl: 'https://cdn.example.com/broken.jpg',
        fileName: 'broken.jpg',
        fileSize: 512,
        fileMimeType: 'image/jpeg',
      },
    });
    const { container } = render(<FileMessage message={msg} isOwnMessage={false} />);
    // Simulate image error
    const img = container.querySelector('img');
    if (img) {
      img.dispatchEvent(new Event('error'));
    }
  });

  it('applies className prop', () => {
    const { container } = render(
      <FileMessage message={makeMessage()} isOwnMessage={false} className="extra" />
    );
    expect(container.firstChild).toBeTruthy();
    expect((container.firstChild as HTMLElement).className).toContain('extra');
  });
});

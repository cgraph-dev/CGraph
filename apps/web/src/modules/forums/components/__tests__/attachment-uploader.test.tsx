/**
 * @file attachment-uploader.test.tsx
 * @description Tests for AttachmentUploader component — drag & drop file
 *   upload with thumbnails, progress, and error display.
 * @module forums/components/__tests__/AttachmentUploader
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── framer-motion mock ───────────────────────────────────────────────

// Mock sub-components (vi.hoisted so they're available when vi.mock is hoisted)
const { mockDropzone, mockErrorList, mockUploadProgressList, mockAttachmentList } = vi.hoisted(
  () => ({
    mockDropzone: vi.fn(({ maxFiles, maxSize }: Record<string, unknown>) => (
      <div data-testid="dropzone">
        Dropzone maxFiles={String(maxFiles)} maxSize={String(maxSize)}
      </div>
    )),
    mockErrorList: vi.fn(({ errors }: { errors: string[] }) => (
      <div data-testid="error-list">
        {errors?.map((e: string, i: number) => (
          <span key={i}>{e}</span>
        ))}
      </div>
    )),
    mockUploadProgressList: vi.fn(() => <div data-testid="progress-list" />),
    mockAttachmentList: vi.fn(({ attachments }: { attachments: unknown[] }) => (
      <div data-testid="attachment-list">{attachments?.length ?? 0} attachments</div>
    )),
  })
);

vi.mock('../attachment-uploader/index', () => ({
  useAttachmentUploader: (opts: Record<string, unknown>) => ({
    isDragging: false,
    maxFiles: opts.maxFiles || 10,
    maxSize: opts.maxSize || 10_485_760,
    allowedTypes: opts.allowedTypes || ['image/*'],
    fileInputRef: { current: null },
    handleDrop: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleFileSelect: vi.fn(),
    openFilePicker: vi.fn(),
    handleDelete: vi.fn(),
    errors: [],
    uploadProgress: [],
  }),
  Dropzone: mockDropzone,
  ErrorList: mockErrorList,
  UploadProgressList: mockUploadProgressList,
  AttachmentList: mockAttachmentList,
}));

import AttachmentUploader from '../attachment-uploader';

// ── Tests ──────────────────────────────────────────────────────────────
describe('AttachmentUploader', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the Dropzone sub-component', () => {
    render(<AttachmentUploader />);
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
  });

  it('renders ErrorList sub-component', () => {
    render(<AttachmentUploader />);
    expect(screen.getByTestId('error-list')).toBeInTheDocument();
  });

  it('renders UploadProgressList sub-component', () => {
    render(<AttachmentUploader />);
    expect(screen.getByTestId('progress-list')).toBeInTheDocument();
  });

  it('renders AttachmentList sub-component', () => {
    render(<AttachmentUploader />);
    expect(screen.getByTestId('attachment-list')).toBeInTheDocument();
  });

  it('passes maxSize to useAttachmentUploader', () => {
    render(<AttachmentUploader maxSize={5_000_000} />);
    expect(screen.getByTestId('dropzone')).toHaveTextContent('5000000');
  });

  it('passes maxFiles to useAttachmentUploader', () => {
    render(<AttachmentUploader maxFiles={3} />);
    expect(screen.getByTestId('dropzone')).toHaveTextContent('maxFiles=3');
  });

  it('passes attachments to AttachmentList', () => {
    const attachments = [
      { id: 'a1', filename: 'file.png', mimeType: 'image/png', url: '/f/a1', size: 1024 },
      { id: 'a2', filename: 'doc.pdf', mimeType: 'application/pdf', url: '/f/a2', size: 2048 },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<AttachmentUploader attachments={attachments as any} />);
    expect(screen.getByTestId('attachment-list')).toHaveTextContent('2 attachments');
  });

  it('applies custom className', () => {
    const { container } = render(<AttachmentUploader className="my-uploader" />);
    expect(container.firstElementChild).toHaveClass('my-uploader');
  });

  it('renders without postId', () => {
    const { container } = render(<AttachmentUploader />);
    expect(container.innerHTML).not.toBe('');
  });
});

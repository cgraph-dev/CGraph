/** @module confirm-modal tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ConfirmModal } from '../confirm-modal';

describe('ConfirmModal', () => {
  const defaultProps = {
    title: 'Delete Channel',
    message: 'Are you sure you want to delete this channel?',
    confirmLabel: 'Delete',
    danger: true,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Channel')).toBeInTheDocument();
  });

  it('renders message', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Are you sure you want to delete this channel?')).toBeInTheDocument();
  });

  it('renders confirm button with label', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('applies danger styling when danger is true', () => {
    render(<ConfirmModal {...defaultProps} />);
    const title = screen.getByText('Delete Channel');
    expect(title.className).toContain('text-red');
  });

  it('applies normal styling when danger is false', () => {
    render(<ConfirmModal {...defaultProps} danger={false} />);
    const title = screen.getByText('Delete Channel');
    expect(title.className).toContain('text-white');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidModal } from '../components/liquid-modal';

describe('LiquidModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  it('renders when open', () => {
    render(<LiquidModal {...defaultProps}>Modal content</LiquidModal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <LiquidModal open={false} onClose={vi.fn()}>
        Hidden
      </LiquidModal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <LiquidModal {...defaultProps} title="My Title">
        Body
      </LiquidModal>
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <LiquidModal {...defaultProps} title="Title" description="Some description">
        Body
      </LiquidModal>
    );
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(
      <LiquidModal {...defaultProps} footer={<button>Save</button>}>
        Body
      </LiquidModal>
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <LiquidModal open onClose={onClose}>
        Content
      </LiquidModal>
    );
    await user.click(screen.getByLabelText('Close dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <LiquidModal open onClose={onClose}>
        Content
      </LiquidModal>
    );
    // Focus within the modal container so the keydown handler fires
    const dialog = screen.getByRole('dialog');
    dialog.focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <LiquidModal open onClose={onClose}>
        Content
      </LiquidModal>
    );
    // Backdrop is the first motion.div with aria-hidden
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has correct ARIA attributes', () => {
    render(
      <LiquidModal {...defaultProps} title="ARIA Test" description="Desc">
        Body
      </LiquidModal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'liquid-modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'liquid-modal-desc');
  });

  it('applies size classes', () => {
    render(
      <LiquidModal {...defaultProps} size="xl">
        Large
      </LiquidModal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-xl');
  });

  it('defaults to md size', () => {
    render(<LiquidModal {...defaultProps}>Default</LiquidModal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('max-w-md');
  });

  it('locks body scroll when open', () => {
    render(<LiquidModal {...defaultProps}>Scroll lock</LiquidModal>);
    expect(document.body.style.overflow).toBe('hidden');
  });
});

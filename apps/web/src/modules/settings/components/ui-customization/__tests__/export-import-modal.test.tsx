/** @module export-import-modal tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">
      {children}
    </div>
  ),
}));

import { ExportImportModal } from '../export-import-modal';

describe('ExportImportModal', () => {
  const defaultProps = {
    exportData: '{"theme":"dark","accent":"#6366f1"}',
    onImport: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export data', () => {
    render(<ExportImportModal {...defaultProps} />);
    expect(screen.getByDisplayValue(/theme/)).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ExportImportModal {...defaultProps} />);
    expect(screen.getByTestId('icon-XMarkIcon')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<ExportImportModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Copy/ })).toBeInTheDocument();
  });

  it('renders import section', () => {
    render(<ExportImportModal {...defaultProps} />);
    expect(screen.getByText('Import Settings')).toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', () => {
    render(<ExportImportModal {...defaultProps} />);
    const backdrop = screen.getByTestId('glass-card').closest('.fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

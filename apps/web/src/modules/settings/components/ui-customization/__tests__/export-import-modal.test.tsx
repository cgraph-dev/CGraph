/** @module export-import-modal tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => {
  const motionProxy = new Proxy({}, {
    get: (_target, prop) => {
      if (typeof prop === 'string') {
        return ({ children, initial, animate, exit, transition, variants, whileHover, whileTap, whileInView, layout, layoutId, ...rest }: any) => {
          const Tag = prop as any;
          return <Tag {...rest}>{children}</Tag>;
        };
      }
      return undefined;
    },
  });
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useAnimation: () => ({ start: vi.fn() }),
    useInView: () => true,
    useMotionValue: () => ({ get: () => 0, set: vi.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0 }),
  };
});

const iconProxy = new Proxy({}, {
  get: (_target, prop) => {
    if (typeof prop === 'string' && prop !== '__esModule') {
      return (props: any) => <span data-testid={`icon-${prop}`} {...props} />;
    }
    return undefined;
  },
});
vi.mock('@heroicons/react/24/outline', () => iconProxy);
vi.mock('@heroicons/react/24/solid', () => iconProxy);

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} data-testid="glass-card">{children}</div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn() },
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
    expect(screen.getByText(/Copy/i)).toBeInTheDocument();
  });

  it('renders import section', () => {
    render(<ExportImportModal {...defaultProps} />);
    expect(screen.getByText(/Import/i)).toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', () => {
    render(<ExportImportModal {...defaultProps} />);
    const backdrop = screen.getByTestId('glass-card').closest('.fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

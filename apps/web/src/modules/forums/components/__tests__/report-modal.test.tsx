import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ReportModal from '../report-modal';

// ── Mocks ──────────────────────────────────────────────────────────────

const { mockReportItem, mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockReportItem: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn(() => ({ reportItem: mockReportItem })),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...stripMotion(props)}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...stripMotion(props)}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: (props: any) => <svg data-testid="x-icon" {...props} />,
  FlagIcon: (props: any) => <svg data-testid="flag-icon" {...props} />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
  toast: { error: mockToastError, success: mockToastSuccess },
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

function stripMotion(props: Record<string, any>) {
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(props)) {
    if (
      !k.startsWith('while') &&
      !k.startsWith('initial') &&
      !k.startsWith('animate') &&
      !k.startsWith('exit')
    ) {
      clean[k] = v;
    }
  }
  return clean;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('ReportModal', () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    itemType: 'post' as const,
    itemId: 'post-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReportItem.mockResolvedValue(undefined);
  });

  // ── Rendering ──────────────────────────────────────────────────────

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ReportModal {...baseProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal when isOpen is true', () => {
    render(<ReportModal {...baseProps} />);
    expect(screen.getByText('Report post')).toBeInTheDocument();
  });

  it('displays the item title when provided', () => {
    render(<ReportModal {...baseProps} itemTitle="Offensive thread" />);
    expect(screen.getByText('Offensive thread')).toBeInTheDocument();
  });

  it('renders all report reason options', () => {
    render(<ReportModal {...baseProps} />);
    expect(screen.getByText('Spam or advertising')).toBeInTheDocument();
    expect(screen.getByText('Harassment or hate speech')).toBeInTheDocument();
    expect(screen.getByText('Inappropriate content')).toBeInTheDocument();
    expect(screen.getByText('Misinformation')).toBeInTheDocument();
    expect(screen.getByText('Copyright violation')).toBeInTheDocument();
    expect(screen.getByText('Violence or threats')).toBeInTheDocument();
    expect(screen.getByText('Other (specify below)')).toBeInTheDocument();
  });

  it('renders the false-report warning', () => {
    render(<ReportModal {...baseProps} />);
    expect(screen.getByText(/False reports may result in action/)).toBeInTheDocument();
  });

  it('renders the details textarea', () => {
    render(<ReportModal {...baseProps} />);
    expect(screen.getByPlaceholderText(/Provide more information/)).toBeInTheDocument();
  });

  it('renders Cancel and Submit buttons', () => {
    render(<ReportModal {...baseProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('shows character count for details', () => {
    render(<ReportModal {...baseProps} />);
    expect(screen.getByText('0/1000')).toBeInTheDocument();
  });

  // ── User Interactions ──────────────────────────────────────────────

  it('selects a report reason when clicked', () => {
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Spam or advertising'));
    // The button that wraps "Spam or advertising" should gain the selected style
    const reasonBtn = screen.getByText('Spam or advertising').closest('button');
    expect(reasonBtn?.className).toContain('border-red-500');
  });

  it('updates the details textarea on input', () => {
    render(<ReportModal {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/Provide more information/);
    fireEvent.change(textarea, { target: { value: 'This is spam' } });
    expect(textarea).toHaveValue('This is spam');
  });

  it('updates the character counter when details are typed', () => {
    render(<ReportModal {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/Provide more information/);
    fireEvent.change(textarea, { target: { value: 'abcde' } });
    expect(screen.getByText('5/1000')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ReportModal {...baseProps} />);
    // Backdrop is the first overlay div with bg-black/60
    const backdrop = screen.getByText('Report post').closest('.relative.w-full')
      ?.previousElementSibling as HTMLElement;
    if (backdrop) fireEvent.click(backdrop);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when the X button is clicked', () => {
    render(<ReportModal {...baseProps} />);
    const xBtn = screen.getByTestId('x-icon').closest('button')!;
    fireEvent.click(xBtn);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  // ── Validation ─────────────────────────────────────────────────────

  it('disables submit button when no reason is selected', () => {
    render(<ReportModal {...baseProps} />);
    const submitBtn = screen.getByText('Submit Report').closest('button')!;
    expect(submitBtn).toBeDisabled();
    expect(mockReportItem).not.toHaveBeenCalled();
  });

  it('shows error toast when "Other" is selected with no details', () => {
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Other (specify below)'));
    fireEvent.click(screen.getByText('Submit Report'));
    expect(mockToastError).toHaveBeenCalledWith('Please provide details for "Other" reason');
  });

  it('marks details as required when "Other" is selected', () => {
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Other (specify below)'));
    expect(screen.getByText(/\(required\)/)).toBeInTheDocument();
  });

  // ── Submission ─────────────────────────────────────────────────────

  it('submits successfully with a selected reason', async () => {
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Spam or advertising'));
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(mockReportItem).toHaveBeenCalledWith({
        reportType: 'post',
        itemId: 'post-123',
        reason: 'spam',
        details: undefined,
      });
    });
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('includes trimmed details in the report payload', async () => {
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Misinformation'));
    const textarea = screen.getByPlaceholderText(/Provide more information/);
    fireEvent.change(textarea, { target: { value: '  Fake data  ' } });
    fireEvent.click(screen.getByText('Submit Report'));

    await waitFor(() => {
      expect(mockReportItem).toHaveBeenCalledWith(
        expect.objectContaining({ details: 'Fake data' })
      );
    });
  });

  it('shows "Submitting..." text while submitting', async () => {
    mockReportItem.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Spam or advertising'));
    fireEvent.click(screen.getByText('Submit Report'));
    expect(await screen.findByText('Submitting...')).toBeInTheDocument();
  });

  it('shows error toast on submission failure', async () => {
    mockReportItem.mockRejectedValueOnce(new Error('Server down'));
    render(<ReportModal {...baseProps} />);
    fireEvent.click(screen.getByText('Harassment or hate speech'));
    fireEvent.click(screen.getByText('Submit Report'));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to submit report');
    });
  });

  it('renders the correct itemType in the heading', () => {
    render(<ReportModal {...baseProps} itemType="user" />);
    expect(screen.getByText('Report user')).toBeInTheDocument();
  });
});

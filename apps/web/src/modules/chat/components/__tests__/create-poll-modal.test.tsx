/** @module create-poll-modal tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatePollModal } from '../create-poll-modal';

vi.mock('framer-motion', () => {
  // Cache component functions so React reconciliation works across re-renders
  const cache = new Map<
    string | symbol,
    (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
  >();
  const motionProxy = new Proxy(
    {} as Record<
      string,
      (p: React.PropsWithChildren<Record<string, unknown>>) => React.ReactElement
    >,
    {
      get: (_target, prop) => {
        if (!cache.has(prop)) {
          const Tag = (
            typeof prop === 'string' ? prop : 'div'
          ) as keyof React.JSX.IntrinsicElements;
          cache.set(
            prop,
            function MotionMock({ children, className, onClick, disabled, ..._rest }) {
              return (
                <Tag
                  className={className as string}
                  onClick={onClick as React.MouseEventHandler}
                  disabled={disabled as boolean}
                >
                  {children}
                </Tag>
              );
            }
          );
        }
        return cache.get(prop);
      },
    }
  );
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('@/lib/animation-presets', () => ({
  entranceVariants: { fadeUp: {} },
  springs: { gentle: {} },
}));

vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <span data-testid="x-icon" />,
  PlusIcon: () => <span data-testid="plus-icon" />,
  TrashIcon: () => <span data-testid="trash-icon" />,
  ChartBarIcon: () => <span data-testid="chart-icon" />,
}));

function getSubmitButton(): HTMLButtonElement {
  const buttons = screen.getAllByRole('button');
  return buttons.find((b) => b.textContent === 'Create Poll') as HTMLButtonElement;
}

describe('CreatePollModal', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <CreatePollModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });

  it('renders header and form when open', () => {
    render(<CreatePollModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByText('Question')).toBeTruthy();
    expect(screen.getByText('Options')).toBeTruthy();
    expect(getSubmitButton()).toBeTruthy();
  });

  it('starts with 2 empty option inputs', () => {
    render(<CreatePollModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
    expect(optionInputs).toHaveLength(2);
  });

  it('adds an option when "Add option" is clicked', () => {
    render(<CreatePollModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText('Add option'));
    const optionInputs = screen.getAllByPlaceholderText(/Option \d/);
    expect(optionInputs).toHaveLength(3);
  });

  it('removes an option when trash button is clicked', () => {
    render(<CreatePollModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    // Add a third option first (need > 2 to delete)
    fireEvent.click(screen.getByText('Add option'));
    expect(screen.getAllByPlaceholderText(/Option \d/)).toHaveLength(3);

    // Click first trash icon
    const trashButtons = screen.getAllByTestId('trash-icon');
    fireEvent.click(trashButtons[0].closest('button')!);
    expect(screen.getAllByPlaceholderText(/Option \d/)).toHaveLength(2);
  });

  it('disables submit when form is invalid', () => {
    render(<CreatePollModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(getSubmitButton().hasAttribute('disabled')).toBe(true);
  });

  it('calls onSubmit with poll data when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<CreatePollModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />);

    // Fill question using userEvent for proper state updates
    const questionInput = screen.getByPlaceholderText('Ask a question...');
    await user.clear(questionInput);
    await user.type(questionInput, 'Fav?');

    // Fill options — re-query after each to avoid stale refs
    const opt1 = screen.getAllByPlaceholderText(/Option \d/)[0];
    await user.type(opt1, 'Red');
    const opt2 = screen.getAllByPlaceholderText(/Option \d/)[1];
    await user.type(opt2, 'Blue');

    // Submit should now be enabled
    const submitBtn = getSubmitButton();
    await user.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'Fav?',
        multipleChoice: false,
        anonymous: false,
      })
    );
  });

  it('toggles multiple choice and anonymous checkboxes', () => {
    render(<CreatePollModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);
    const multiCheckbox = screen.getByLabelText(/Allow multiple selections/);
    const anonCheckbox = screen.getByLabelText(/Anonymous voting/);

    expect((multiCheckbox as HTMLInputElement).checked).toBe(false);
    expect((anonCheckbox as HTMLInputElement).checked).toBe(false);

    fireEvent.click(multiCheckbox);
    fireEvent.click(anonCheckbox);

    expect((multiCheckbox as HTMLInputElement).checked).toBe(true);
    expect((anonCheckbox as HTMLInputElement).checked).toBe(true);
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CreatePollModal isOpen={true} onClose={onClose} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

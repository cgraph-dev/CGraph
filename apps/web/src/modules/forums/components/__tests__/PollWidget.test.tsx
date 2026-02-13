import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: () => <span data-testid="check-icon" />,
  XCircleIcon: () => <span data-testid="x-icon" />,
  ChevronUpIcon: () => <span data-testid="up-icon" />,
  ChevronDownIcon: () => <span data-testid="down-icon" />,
}));

describe('PollWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('module can be imported', async () => {
    const mod = await import('../PollWidget');
    expect(mod).toBeTruthy();
  });
});

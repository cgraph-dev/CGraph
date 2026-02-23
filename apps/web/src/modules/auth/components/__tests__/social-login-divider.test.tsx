/** @module social-login-divider tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ..._props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div>{children}</div>
    ),
    span: ({ children, ..._props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import { SocialLoginDivider } from '../social-login-divider';

describe('SocialLoginDivider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default text', () => {
    render(<SocialLoginDivider variant="default" />);
    expect(screen.getByText('or continue with')).toBeInTheDocument();
  });

  it('renders custom text', () => {
    render(<SocialLoginDivider variant="default" text="or sign up with" />);
    expect(screen.getByText('or sign up with')).toBeInTheDocument();
  });

  it('renders gradient variant', () => {
    render(<SocialLoginDivider variant="gradient" />);
    expect(screen.getByText('or continue with')).toBeInTheDocument();
  });

  it('renders dots variant', () => {
    render(<SocialLoginDivider variant="dots" />);
    expect(screen.getByText('or continue with')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SocialLoginDivider variant="default" className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});

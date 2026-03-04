import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiquidUserCard, LiquidAvatar } from '../components/liquid-user-card';

describe('LiquidAvatar', () => {
  it('renders image when src is provided', () => {
    render(<LiquidAvatar src="https://example.com/avatar.png" alt="User" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
    expect(img).toHaveAttribute('alt', 'User');
  });

  it('renders initials when no src', () => {
    render(<LiquidAvatar fallback="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    render(<LiquidAvatar fallback="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders ? when no name', () => {
    render(<LiquidAvatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders status dot with aria-label', () => {
    render(<LiquidAvatar fallback="Jane" status="online" />);
    expect(screen.getByLabelText('online')).toBeInTheDocument();
  });

  it('does not render status dot when status is null', () => {
    render(<LiquidAvatar fallback="Jane" status={null} />);
    expect(screen.queryByLabelText('online')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('offline')).not.toBeInTheDocument();
  });

  it('applies sm size', () => {
    render(<LiquidAvatar fallback="Alpha Beta" size="sm" />);
    const el = screen.getByText('AB');
    expect(el.className).toContain('h-8');
  });

  it('applies lg size', () => {
    render(<LiquidAvatar fallback="Alpha Beta" size="lg" />);
    const el = screen.getByText('AB');
    expect(el.className).toContain('h-14');
  });
});

describe('LiquidUserCard', () => {
  it('renders the user name', () => {
    render(<LiquidUserCard name="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<LiquidUserCard name="John" subtitle="Admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders avatar with image', () => {
    render(<LiquidUserCard name="Jane" avatarSrc="https://example.com/jane.png" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/jane.png');
  });

  it('renders avatar fallback initials when no src', () => {
    render(<LiquidUserCard name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders status dot', () => {
    render(<LiquidUserCard name="Jane" status="away" />);
    expect(screen.getByLabelText('away')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(
      <LiquidUserCard name="Jane" action={<button data-testid="action-btn">Follow</button>} />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('applies sm size', () => {
    const { container } = render(<LiquidUserCard name="Jane" size="sm" />);
    expect(container.firstElementChild?.className).toContain('px-3');
  });

  it('applies lg size', () => {
    const { container } = render(<LiquidUserCard name="Jane" size="lg" />);
    expect(container.firstElementChild?.className).toContain('px-5');
  });

  it('applies interactive cursor-pointer class', () => {
    const { container } = render(<LiquidUserCard name="Jane" interactive />);
    expect(container.firstElementChild?.className).toContain('cursor-pointer');
  });

  it('does not apply cursor-pointer when not interactive', () => {
    const { container } = render(<LiquidUserCard name="Jane" />);
    expect(container.firstElementChild?.className).not.toContain('cursor-pointer');
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<LiquidUserCard name="Jane" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});

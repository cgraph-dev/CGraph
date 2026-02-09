import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import Badge, {
  NewBadge,
  HotBadge,
  NsfwBadge,
  PinnedBadge,
  PrivateBadge,
  PublicBadge,
  OwnerBadge,
  ModeratorBadge,
  MemberBadge,
  CountBadge,
} from '../Badge';

// =============================================================================
// Badge component
// =============================================================================

describe('Badge', () => {
  // ── Basic rendering ──────────────────────────────────────────────────

  it('renders children text', () => {
    render(<Badge>Status</Badge>);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders as an inline span', () => {
    render(<Badge>Tag</Badge>);
    const badge = screen.getByText('Tag');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies custom className', () => {
    render(<Badge className="extra-class">X</Badge>);
    expect(screen.getByText('X')).toHaveClass('extra-class');
  });

  // ── Variants ─────────────────────────────────────────────────────────

  const variants = [
    'default',
    'primary',
    'success',
    'warning',
    'danger',
    'info',
    'destructive',
    'secondary',
    'outline',
  ] as const;

  it.each(variants)('renders "%s" variant without crashing', (variant) => {
    render(<Badge variant={variant}>V</Badge>);
    expect(screen.getByText('V')).toBeInTheDocument();
  });

  it('applies default variant styles when no variant specified', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-dark-600');
  });

  it('applies primary variant styles', () => {
    render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary').className).toContain('text-primary-400');
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">Ok</Badge>);
    expect(screen.getByText('Ok').className).toContain('text-green-400');
  });

  it('applies danger variant styles', () => {
    render(<Badge variant="danger">Err</Badge>);
    expect(screen.getByText('Err').className).toContain('text-red-400');
  });

  it('applies outline variant styles', () => {
    render(<Badge variant="outline">Outlined</Badge>);
    const el = screen.getByText('Outlined');
    expect(el.className).toContain('bg-transparent');
    expect(el.className).toContain('border-dark-600');
  });

  // ── Sizes ────────────────────────────────────────────────────────────

  it('applies small size styles', () => {
    render(<Badge size="sm">SM</Badge>);
    expect(screen.getByText('SM').className).toContain('px-1.5');
  });

  it('applies medium size styles (default)', () => {
    render(<Badge>MD</Badge>);
    expect(screen.getByText('MD').className).toContain('px-2');
  });

  it('applies large size styles', () => {
    render(<Badge size="lg">LG</Badge>);
    expect(screen.getByText('LG').className).toContain('px-2.5');
  });

  // ── Dot indicator ────────────────────────────────────────────────────

  it('renders a dot when dot=true', () => {
    const { container } = render(<Badge dot>Active</Badge>);
    const dot = container.querySelector('.w-1\\.5.h-1\\.5.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('does not render a dot by default', () => {
    const { container } = render(<Badge>No Dot</Badge>);
    const dot = container.querySelector('.w-1\\.5.h-1\\.5.rounded-full');
    expect(dot).not.toBeInTheDocument();
  });

  // ── Icon ─────────────────────────────────────────────────────────────

  it('renders an icon when provided', () => {
    render(<Badge icon={<span data-testid="badge-icon">★</span>}>Star</Badge>);
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  // ── Always rounded-full ──────────────────────────────────────────────

  it('has rounded-full class', () => {
    render(<Badge>Round</Badge>);
    expect(screen.getByText('Round')).toHaveClass('rounded-full');
  });
});

// =============================================================================
// Predefined badge variants
// =============================================================================

describe('Predefined badges', () => {
  it('NewBadge renders "New"', () => {
    render(<NewBadge />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('HotBadge renders "🔥 Hot"', () => {
    render(<HotBadge />);
    expect(screen.getByText('🔥 Hot')).toBeInTheDocument();
  });

  it('NsfwBadge renders "NSFW"', () => {
    render(<NsfwBadge />);
    expect(screen.getByText('NSFW')).toBeInTheDocument();
  });

  it('PinnedBadge renders "📌 Pinned"', () => {
    render(<PinnedBadge />);
    expect(screen.getByText('📌 Pinned')).toBeInTheDocument();
  });

  it('PrivateBadge renders "🔒 Private"', () => {
    render(<PrivateBadge />);
    expect(screen.getByText('🔒 Private')).toBeInTheDocument();
  });

  it('PublicBadge renders "🌐 Public"', () => {
    render(<PublicBadge />);
    expect(screen.getByText('🌐 Public')).toBeInTheDocument();
  });

  it('OwnerBadge renders "👑 Owner"', () => {
    render(<OwnerBadge />);
    expect(screen.getByText('👑 Owner')).toBeInTheDocument();
  });

  it('ModeratorBadge renders "🛡️ Mod"', () => {
    render(<ModeratorBadge />);
    expect(screen.getByText('🛡️ Mod')).toBeInTheDocument();
  });

  it('MemberBadge renders "Member"', () => {
    render(<MemberBadge />);
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('CountBadge renders small numbers as-is', () => {
    render(<CountBadge count={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('CountBadge formats large numbers with k suffix', () => {
    render(<CountBadge count={1500} />);
    expect(screen.getByText('1.5k')).toBeInTheDocument();
  });

  it('CountBadge formats exactly 1000', () => {
    render(<CountBadge count={1000} />);
    expect(screen.getByText('1.0k')).toBeInTheDocument();
  });

  it('CountBadge renders 0', () => {
    render(<CountBadge count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('predefined badges accept custom className', () => {
    render(<NewBadge className="ml-2" />);
    expect(screen.getByText('New').closest('span')).toHaveClass('ml-2');
  });
});

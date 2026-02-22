import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TitleBadge } from '../title-badge/title-badge';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockTitleData = {
  id: 'champion',
  name: 'Champion',
  displayName: 'Champion',
  rarity: 'epic' as const,
  category: 'achievement' as const,
  description: 'Won a tournament',
  color: '#a855f7',
  animation: { type: 'glow' as const, speed: 2, intensity: 50 },
};

const mockLegendaryTitle = {
  id: 'legend',
  name: 'Legend',
  displayName: 'Legend',
  rarity: 'legendary' as const,
  category: 'special' as const,
  description: 'Legendary status',
  color: '#f59e0b',
  animation: { type: 'shimmer' as const, speed: 1, intensity: 80 },
};

const mockRainbowTitle = {
  id: 'rainbow-master',
  name: 'Rainbow Master',
  displayName: 'Rainbow Master',
  rarity: 'mythic' as const,
  category: 'special' as const,
  description: 'Master of colors',
  color: '#ec4899',
  animation: { type: 'rainbow' as const, speed: 1.5, intensity: 90 },
};

vi.mock('@/data/titles', () => ({
  RARITY_COLORS: {
    common: { primary: '#9ca3af', secondary: '#6b7280', glow: 'rgba(156,163,175,0.3)' },
    uncommon: { primary: '#22c55e', secondary: '#16a34a', glow: 'rgba(34,197,94,0.3)' },
    rare: { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59,130,246,0.4)' },
    epic: { primary: '#a855f7', secondary: '#9333ea', glow: 'rgba(168,85,247,0.4)' },
    legendary: { primary: '#f59e0b', secondary: '#d97706', glow: 'rgba(245,158,11,0.5)' },
    mythic: { primary: '#ef4444', secondary: '#dc2626', glow: 'rgba(239,68,68,0.5)' },
    unique: { primary: '#ec4899', secondary: '#db2777', glow: 'rgba(236,72,153,0.5)' },
  },
  getTitleById: vi.fn((id: string) => {
    const map: Record<string, any> = {
      champion: mockTitleData,
      legend: mockLegendaryTitle,
      'rainbow-master': mockRainbowTitle,
    };
    return map[id];
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, animate, whileHover, whileTap, ...rest }: any) => (
      <button {...rest}>{children}</button>
    ),
    span: ({ children, animate, ...rest }: any) => <span {...rest}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: (props: any) => <svg data-testid="sparkle-icon" {...props} />,
}));

vi.mock('../title-badge/hooks/useAnimationConfig', () => ({
  useAnimationConfig: () => ({ getAnimation: () => ({}) }),
}));

vi.mock('../title-badge/TitleBadgeTooltip', () => ({
  TitleBadgeTooltip: ({ title }: any) => <div data-testid="tooltip">{title.description}</div>,
}));

vi.mock('../title-badge/animations', () => ({
  sparkleAnimation: {},
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// ── Tests ──────────────────────────────────────────────────────────────

describe('TitleBadge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders title display name from object', () => {
    render(<TitleBadge title={mockTitleData} />);
    expect(screen.getByText('Champion')).toBeInTheDocument();
  });

  it('resolves title by ID string', () => {
    render(<TitleBadge title="champion" />);
    expect(screen.getByText('Champion')).toBeInTheDocument();
  });

  it('returns null for unknown title ID', () => {
    const { container } = render(<TitleBadge title="nonexistent" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders sparkle icon for legendary rarity', () => {
    render(<TitleBadge title={mockLegendaryTitle} />);
    expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument();
  });

  it('renders sparkle icon for mythic rarity', () => {
    render(<TitleBadge title={mockRainbowTitle} />);
    expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument();
  });

  it('does NOT render sparkle icon for epic rarity', () => {
    render(<TitleBadge title={mockTitleData} />);
    expect(screen.queryByTestId('sparkle-icon')).not.toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<TitleBadge title={mockTitleData} onClick={onClick} />);
    fireEvent.click(screen.getByText('Champion'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows tooltip on hover when showTooltip is true', () => {
    render(<TitleBadge title={mockTitleData} showTooltip />);
    const btn = screen.getByText('Champion').closest('button')!;
    fireEvent.mouseEnter(btn);
    expect(screen.getByTestId('tooltip')).toHaveTextContent('Won a tournament');
  });

  it('hides tooltip on mouse leave', () => {
    render(<TitleBadge title={mockTitleData} showTooltip />);
    const btn = screen.getByText('Champion').closest('button')!;
    fireEvent.mouseEnter(btn);
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('does not show tooltip when showTooltip is false', () => {
    render(<TitleBadge title={mockTitleData} showTooltip={false} />);
    const btn = screen.getByText('Champion').closest('button')!;
    fireEvent.mouseEnter(btn);
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<TitleBadge title={mockTitleData} className="my-custom" />);
    const btn = screen.getByText('Champion').closest('button')!;
    expect(btn.className).toContain('my-custom');
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(<TitleBadge title={mockTitleData} size="xs" />);
    expect(container.querySelector('button')).toBeInTheDocument();
    rerender(<TitleBadge title={mockTitleData} size="lg" />);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('renders rainbow title with rainbow style', () => {
    render(<TitleBadge title={mockRainbowTitle} animated />);
    expect(screen.getByText('Rainbow Master')).toBeInTheDocument();
  });

  it('disables animations when animated is false', () => {
    render(<TitleBadge title={mockLegendaryTitle} animated={false} />);
    expect(screen.getByText('Legend')).toBeInTheDocument();
  });
});

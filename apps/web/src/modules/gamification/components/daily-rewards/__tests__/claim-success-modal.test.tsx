/** @module claim-success-modal tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { slow: {} },
  loop: () => ({}),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  SparklesIcon: () => <span data-testid="sparkles-icon" />,
}));

import { ClaimSuccessModal } from '../claim-success-modal';

describe('ClaimSuccessModal', () => {
  const claimedReward = {
    day: 1,
    xp: 50,
    coins: 10,
    special: null,
  };

  it('renders Reward Claimed heading when reward exists', () => {
    render(<ClaimSuccessModal claimedReward={claimedReward} />);
    expect(screen.getByText('Reward Claimed!')).toBeInTheDocument();
  });

  it('renders gift emoji', () => {
    render(<ClaimSuccessModal claimedReward={claimedReward} />);
    expect(screen.getByText('🎁')).toBeInTheDocument();
  });

  it('renderss XP amount', () => {
    render(<ClaimSuccessModal claimedReward={claimedReward} />);
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('renders nothing when no claimed reward', () => {
    const { container } = render(<ClaimSuccessModal claimedReward={null} />);
    expect(container.textContent).toBe('');
  });
});

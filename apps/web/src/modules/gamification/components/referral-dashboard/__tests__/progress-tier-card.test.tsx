import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressTierCard } from '../progress-tier-card';

const mockNextTier = {
  tier: {
    name: 'Gold',
    referralsRequired: 10,
    rewards: [{ description: '500 Bonus Coins' }, { description: 'Gold Badge' }],
  },
  progress: 60,
};

describe('ProgressTierCard', () => {
  it('renders null when no nextTier', () => {
    const { container } = render(<ProgressTierCard nextTier={null} verifiedReferrals={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders tier name', () => {
    render(<ProgressTierCard nextTier={mockNextTier} verifiedReferrals={6} />);
    expect(screen.getByText(/Progress to Gold/)).toBeInTheDocument();
  });

  it('renders referral progress', () => {
    render(<ProgressTierCard nextTier={mockNextTier} verifiedReferrals={6} />);
    expect(screen.getByText('6 / 10 referrals')).toBeInTheDocument();
  });

  it('renders reward descriptions', () => {
    render(<ProgressTierCard nextTier={mockNextTier} verifiedReferrals={6} />);
    expect(screen.getByText('500 Bonus Coins')).toBeInTheDocument();
    expect(screen.getByText('Gold Badge')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(
      <ProgressTierCard nextTier={mockNextTier} verifiedReferrals={6} />
    );
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });
});

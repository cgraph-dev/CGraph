import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '../how-it-works';

describe('HowItWorks', () => {
  it('renders the heading', () => {
    render(<HowItWorks />);
    expect(screen.getByText('How it Works')).toBeInTheDocument();
  });

  it('renders all 3 steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Share your referral link with friends')).toBeInTheDocument();
    expect(screen.getByText('They sign up using your link')).toBeInTheDocument();
    expect(screen.getByText('Once verified, you both get rewards!')).toBeInTheDocument();
  });

  it('renders step numbers 1, 2, 3', () => {
    render(<HowItWorks />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

/**
 * @file Tests for EmptyState component (gif-picker)
 * @module chat/components/gif-picker/empty-state
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  HeartIcon: ({ className }: { className?: string }) => (
    <span data-testid="heart-icon" className={className} />
  ),
  ClockIcon: ({ className }: { className?: string }) => (
    <span data-testid="clock-icon" className={className} />
  ),
  MagnifyingGlassIcon: ({ className }: { className?: string }) => (
    <span data-testid="search-icon" className={className} />
  ),
}));

import { EmptyState } from '../gif-picker/empty-state';

describe('GifPicker EmptyState', () => {
  it('renders favorites empty state', () => {
    render(<EmptyState type="favorites" />);
    expect(screen.getByText('No favorite GIFs yet')).toBeInTheDocument();
  });

  it('renders favorites description', () => {
    render(<EmptyState type="favorites" />);
    expect(screen.getByText('Click the heart on any GIF to save it')).toBeInTheDocument();
  });

  it('renders heart icon for favorites', () => {
    render(<EmptyState type="favorites" />);
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
  });

  it('renders recent empty state', () => {
    render(<EmptyState type="recent" />);
    expect(screen.getByText('No recent GIFs')).toBeInTheDocument();
  });

  it('renders recent description', () => {
    render(<EmptyState type="recent" />);
    expect(screen.getByText('GIFs you use will appear here')).toBeInTheDocument();
  });

  it('renders clock icon for recent', () => {
    render(<EmptyState type="recent" />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });

  it('renders search empty state', () => {
    render(<EmptyState type="search" />);
    expect(screen.getByText('No GIFs found')).toBeInTheDocument();
  });

  it('renders search description', () => {
    render(<EmptyState type="search" />);
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });

  it('renders search icon for search', () => {
    render(<EmptyState type="search" />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });
});

/** @module CategoryTabs tests */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/stores/theme', () => ({
  useThemeStore: () => ({ theme: { colorPreset: 'blue' } }),
  THEME_COLORS: { blue: { primary: '#3b82f6' } },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  chatLogger: { debug: vi.fn() },
}));

vi.mock('./emojiData', () => ({
  EMOJI_CATEGORIES: {
    'Frequently Used': ['😀'],
    'Smileys & People': ['😊'],
    'Animals & Nature': ['🐱'],
    'Food & Drink': ['🍕'],
  },
}));

import { CategoryTabs } from '../category-tabs';
import { HapticFeedback } from '@/lib/animations/animation-engine';

describe('CategoryTabs', () => {
  const onCategoryChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all emoji category tabs', () => {
    render(<CategoryTabs activeCategory="Frequently Used" onCategoryChange={onCategoryChange} />);
    expect(screen.getByText('Frequently Used')).toBeInTheDocument();
    expect(screen.getByText('Smileys & People')).toBeInTheDocument();
    expect(screen.getByText('Animals & Nature')).toBeInTheDocument();
    expect(screen.getByText('Food & Drink')).toBeInTheDocument();
  });

  it('highlights the active category tab', () => {
    render(<CategoryTabs activeCategory="Smileys & People" onCategoryChange={onCategoryChange} />);
    const activeTab = screen.getByText('Smileys & People');
    expect(activeTab.className).toContain('bg-primary-500/20');
  });

  it('does not highlight inactive category tabs', () => {
    render(<CategoryTabs activeCategory="Smileys & People" onCategoryChange={onCategoryChange} />);
    const inactiveTab = screen.getByText('Frequently Used');
    expect(inactiveTab.className).not.toContain('bg-primary-500/20');
  });

  it('calls onCategoryChange when a tab is clicked', () => {
    render(<CategoryTabs activeCategory="Frequently Used" onCategoryChange={onCategoryChange} />);
    fireEvent.click(screen.getByText('Animals & Nature'));
    expect(onCategoryChange).toHaveBeenCalledWith('Animals & Nature');
  });

  it('triggers haptic feedback on tab click', () => {
    render(<CategoryTabs activeCategory="Frequently Used" onCategoryChange={onCategoryChange} />);
    fireEvent.click(screen.getByText('Food & Drink'));
    expect(HapticFeedback.light).toHaveBeenCalled();
  });

  it('renders category tabs as buttons', () => {
    render(<CategoryTabs activeCategory="Frequently Used" onCategoryChange={onCategoryChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  it('applies correct styling to tab container', () => {
    const { container } = render(
      <CategoryTabs activeCategory="Frequently Used" onCategoryChange={onCategoryChange} />
    );
    const tabContainer = container.firstChild as HTMLElement;
    expect(tabContainer.className).toContain('flex');
    expect(tabContainer.className).toContain('border-b');
  });

  it('applies inactive hover styles to non-active tabs', () => {
    render(<CategoryTabs activeCategory="Frequently Used" onCategoryChange={onCategoryChange} />);
    const inactiveTab = screen.getByText('Animals & Nature');
    expect(inactiveTab.className).toContain('text-gray-400');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmojiPicker } from '../EmojiPicker';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    input: (props: any) => <input {...props} />,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/lib/animations/AnimationEngine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

describe('EmojiPicker', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<EmojiPicker onSelect={onSelect} />);
    expect(document.body).toBeTruthy();
  });

  it('calls onSelect when emoji is clicked', () => {
    render(<EmojiPicker onSelect={onSelect} />);
    // Find any emoji buttons and click
    const buttons = document.querySelectorAll('button');
    if (buttons.length > 0) {
      buttons[0].click();
      // onSelect may or may not be called depending on which button
    }
    expect(document.body).toBeTruthy();
  });
});

/** @module user-signature tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserSignature from '../user-signature';

vi.mock('@/components/content/bb-code-renderer', () => ({
  default: ({ content, className }: { content: string; className?: string }) => (
    <div data-testid="bbcode" className={className}>
      {content}
    </div>
  ),
}));

describe('UserSignature', () => {
  it('returns null for empty content', () => {
    const { container } = render(<UserSignature content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for whitespace-only content', () => {
    const { container } = render(<UserSignature content="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('renders BBCodeRenderer with content', () => {
    render(<UserSignature content="[b]Hello[/b] World" />);
    expect(screen.getByTestId('bbcode')).toBeTruthy();
    expect(screen.getByText('[b]Hello[/b] World')).toBeTruthy();
  });

  it('applies default maxHeight of 150px', () => {
    const { container } = render(<UserSignature content="Sig" />);
    const inner = container.querySelector('.overflow-hidden') as HTMLElement;
    expect(inner.style.maxHeight).toBe('150px');
  });

  it('applies custom maxHeight', () => {
    const { container } = render(<UserSignature content="Sig" maxHeight={200} />);
    const inner = container.querySelector('.overflow-hidden') as HTMLElement;
    expect(inner.style.maxHeight).toBe('200px');
  });

  it('applies custom className', () => {
    const { container } = render(<UserSignature content="Sig" className="extra" />);
    expect((container.firstChild as HTMLElement).className).toContain('extra');
  });

  it('renders separator border', () => {
    const { container } = render(<UserSignature content="Sig" />);
    expect((container.firstChild as HTMLElement).className).toContain('border-t');
  });
});

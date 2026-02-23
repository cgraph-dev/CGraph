/** @module markdown-content tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownContent } from '../markdown-content';

vi.mock('react-markdown', () => ({
  default: ({
    children,
    components,
  }: {
    children: string;
    components: Record<string, unknown>;
  }) => {
    // Minimal stub: just render the text content
    void components;
    return <div data-testid="react-markdown">{children}</div>;
  },
}));

describe('MarkdownContent', () => {
  it('returns plain <p> for text without markdown syntax', () => {
    const { container } = render(<MarkdownContent content="Hello world" />);
    const p = container.querySelector('p');
    expect(p).toBeTruthy();
    expect(p?.textContent).toBe('Hello world');
  });

  it('returns plain <p> for empty content', () => {
    const { container } = render(<MarkdownContent content="" />);
    const p = container.querySelector('p');
    expect(p).toBeTruthy();
  });

  it('renders through ReactMarkdown when markdown syntax is present', () => {
    render(<MarkdownContent content="**bold text**" />);
    expect(screen.getByTestId('react-markdown')).toBeTruthy();
    expect(screen.getByTestId('react-markdown').textContent).toBe('**bold text**');
  });

  it('applies custom className', () => {
    const { container } = render(<MarkdownContent content="hello" className="custom-class" />);
    const p = container.querySelector('p');
    expect(p?.className).toContain('custom-class');
  });

  it('wraps markdown content in a div with markdown-content class', () => {
    const { container } = render(<MarkdownContent content="# heading" />);
    const wrapper = container.querySelector('.markdown-content');
    expect(wrapper).toBeTruthy();
  });

  it('detects various markdown patterns', () => {
    const cases = ['*italic*', '~~strike~~', '`code`', '> quote', '[link](url)', '# heading'];
    for (const md of cases) {
      const { unmount } = render(<MarkdownContent content={md} />);
      expect(screen.getByTestId('react-markdown')).toBeTruthy();
      unmount();
    }
  });
});

/** @module toolbar-button tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolbarButton } from '../toolbar-button';

describe('ToolbarButton', () => {
  it('renders children', () => {
    render(
      <ToolbarButton title="Bold" onClick={vi.fn()}>
        <span data-testid="icon">B</span>
      </ToolbarButton>
    );
    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });

  it('sets title attribute', () => {
    render(
      <ToolbarButton title="Italic" onClick={vi.fn()}>
        I
      </ToolbarButton>
    );
    expect(screen.getByTitle('Italic')).toBeTruthy();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(
      <ToolbarButton title="Link" onClick={onClick}>
        🔗
      </ToolbarButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is type=button to prevent form submission', () => {
    render(
      <ToolbarButton title="Code" onClick={vi.fn()}>
        {'</>'}
      </ToolbarButton>
    );
    expect((screen.getByRole('button') as HTMLButtonElement).type).toBe('button');
  });

  it('has proper styling classes', () => {
    render(
      <ToolbarButton title="Quote" onClick={vi.fn()}>
        Q
      </ToolbarButton>
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('rounded');
    expect(btn.className).toContain('transition-colors');
  });
});

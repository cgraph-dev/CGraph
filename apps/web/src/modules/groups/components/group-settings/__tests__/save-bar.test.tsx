/** @module save-bar tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveBar } from '../save-bar';

describe('SaveBar', () => {
  it('renders nothing when no changes', () => {
    const { container } = render(
      <SaveBar hasChanges={false} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />
    );
    expect(container.textContent).toBe('');
  });

  it('shows unsaved changes message', () => {
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('You have unsaved changes')).toBeTruthy();
  });

  it('shows Save Changes button', () => {
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('shows Saving... when isSaving', () => {
    render(<SaveBar hasChanges={true} isSaving={true} onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it('calls onSave when Save clicked', () => {
    const onSave = vi.fn();
    render(<SaveBar hasChanges={true} isSaving={false} onSave={onSave} onReset={vi.fn()} />);
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onReset when Reset clicked', () => {
    const onReset = vi.fn();
    render(<SaveBar hasChanges={true} isSaving={false} onSave={vi.fn()} onReset={onReset} />);
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
  });

  it('disables save button when isSaving', () => {
    render(<SaveBar hasChanges={true} isSaving={true} onSave={vi.fn()} onReset={vi.fn()} />);
    const btn = screen.getByText('Saving...').closest('button');
    expect(btn?.disabled).toBe(true);
  });
});

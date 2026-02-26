/** @module message-edit-form tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageEditForm } from '../message-bubble/message-edit-form';

describe('MessageEditForm', () => {
  const defaultProps = {
    editContent: 'Original message text',
    onEditContentChange: vi.fn(),
    onSaveEdit: vi.fn(),
    onCancelEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea with edit content', () => {
    render(<MessageEditForm {...defaultProps} />);
    expect(screen.getByDisplayValue('Original message text')).toBeInTheDocument();
  });

  it('renders Save and Cancel buttons', () => {
    render(<MessageEditForm {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onEditContentChange when typing', () => {
    render(<MessageEditForm {...defaultProps} />);
    const textarea = screen.getByDisplayValue('Original message text');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    expect(defaultProps.onEditContentChange).toHaveBeenCalledWith('New text');
  });

  it('calls onSaveEdit when Save clicked', () => {
    render(<MessageEditForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Save'));
    expect(defaultProps.onSaveEdit).toHaveBeenCalled();
  });

  it('calls onCancelEdit when Cancel clicked', () => {
    render(<MessageEditForm {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancelEdit).toHaveBeenCalled();
  });

  it('textarea has autoFocus', () => {
    render(<MessageEditForm {...defaultProps} />);
    const textarea = screen.getByDisplayValue('Original message text');
    expect(textarea).toHaveFocus();
  });

  it('renders without optional handlers', () => {
    render(<MessageEditForm editContent="hello" />);
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });
});

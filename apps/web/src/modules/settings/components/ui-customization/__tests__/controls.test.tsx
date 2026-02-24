/** @module color-picker and slider controls tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ColorPicker } from '../controls';

describe('ColorPicker', () => {
  const defaultProps = {
    label: 'Background',
    value: '#ff0000',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders label text', () => {
    render(<ColorPicker {...defaultProps} />);
    expect(screen.getByText('Background')).toBeInTheDocument();
  });

  it('renders color input with value', () => {
    render(<ColorPicker {...defaultProps} />);
    const colorInput = screen.getByDisplayValue('#ff0000');
    expect(colorInput).toBeInTheDocument();
  });

  it('calls onChange when color input changes', () => {
    render(<ColorPicker {...defaultProps} />);
    const inputs = screen.getAllByDisplayValue('#ff0000');
    fireEvent.change(inputs[0]!, { target: { value: '#00ff00' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('#00ff00');
  });

  it('renders text input with hex value', () => {
    render(<ColorPicker {...defaultProps} />);
    const inputs = screen.getAllByDisplayValue('#ff0000');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onChange when text input changes', () => {
    render(<ColorPicker {...defaultProps} />);
    const inputs = screen.getAllByDisplayValue('#ff0000');
    const textInput = inputs[1];
    if (textInput) {
      fireEvent.change(textInput, { target: { value: '#0000ff' } });
      expect(defaultProps.onChange).toHaveBeenCalledWith('#0000ff');
    }
  });
});

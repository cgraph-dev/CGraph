import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidInput } from '../components/liquid-input';

describe('LiquidInput', () => {
  it('renders an input element', () => {
    render(<LiquidInput placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders a label when provided', () => {
    render(<LiquidInput label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<LiquidInput label="Email" />);
    const label = screen.getByText('Email');
    const input = document.getElementById(label.getAttribute('for')!);
    expect(input).toBeInTheDocument();
    expect(input?.tagName).toBe('INPUT');
  });

  it('uses custom id when provided', () => {
    render(<LiquidInput id="my-input" label="Name" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'my-input');
  });

  it('renders error message', () => {
    render(<LiquidInput error="Required field" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required field');
  });

  it('sets aria-invalid when error is present', () => {
    render(<LiquidInput error="Bad input" placeholder="test" />);
    expect(screen.getByPlaceholderText('test')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders hint when no error', () => {
    render(<LiquidInput hint="Min 8 characters" id="h" />);
    expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
  });

  it('prefers error over hint when both provided', () => {
    render(<LiquidInput error="Bad" hint="Hint" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Bad');
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
  });

  it('applies sm size', () => {
    render(<LiquidInput inputSize="sm" placeholder="sm" />);
    expect(screen.getByPlaceholderText('sm').className).toContain('h-8');
  });

  it('applies lg size', () => {
    render(<LiquidInput inputSize="lg" placeholder="lg" />);
    expect(screen.getByPlaceholderText('lg').className).toContain('h-12');
  });

  it('applies error state classes', () => {
    render(<LiquidInput state="error" placeholder="err" />);
    expect(screen.getByPlaceholderText('err').className).toContain('border-red');
  });

  it('applies success state classes', () => {
    render(<LiquidInput state="success" placeholder="ok" />);
    expect(screen.getByPlaceholderText('ok').className).toContain('border-green');
  });

  it('renders iconLeft', () => {
    render(<LiquidInput iconLeft={<span data-testid="icon-left">🔍</span>} />);
    expect(screen.getByTestId('icon-left')).toBeInTheDocument();
  });

  it('renders iconRight', () => {
    render(<LiquidInput iconRight={<span data-testid="icon-right">✓</span>} />);
    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<LiquidInput disabled placeholder="dis" />);
    expect(screen.getByPlaceholderText('dis')).toBeDisabled();
  });

  it('calls onChange on typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidInput onChange={onChange} placeholder="type" />);
    await user.type(screen.getByPlaceholderText('type'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards ref', () => {
    const ref = vi.fn();
    render(<LiquidInput ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});

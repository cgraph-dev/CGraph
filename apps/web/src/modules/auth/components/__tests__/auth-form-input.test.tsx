/** @module auth-form-input tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props };
      for (const key of Object.keys(clean)) {
        if (['initial', 'animate', 'exit', 'transition', 'variants', 'layout'].includes(key)) {
          delete clean[key];
        }
      }
      return <div {...clean}>{children}</div>;
    },
    label: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props };
      for (const key of Object.keys(clean)) {
        if (['initial', 'animate', 'transition', 'style'].includes(key)) {
          delete clean[key];
        }
      }
      return <label {...clean}>{children}</label>;
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const clean = { ...props };
      for (const key of Object.keys(clean)) {
        if (['initial', 'animate', 'exit', 'transition'].includes(key)) {
          delete clean[key];
        }
      }
      return <p {...clean}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

import { AuthFormInput } from '../auth-form-input';

describe('AuthFormInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with a label', () => {
    render(<AuthFormInput label="Email" variant="default" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders an input element', () => {
    render(<AuthFormInput label="Username" variant="default" placeholder="Enter username" />);
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<AuthFormInput label="Email" variant="default" error="Invalid email address" />);
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('displays helper text', () => {
    render(<AuthFormInput label="Password" variant="default" helperText="Must be 8+ characters" />);
    expect(screen.getByText('Must be 8+ characters')).toBeInTheDocument();
  });

  it('renders password toggle for password input', () => {
    render(<AuthFormInput label="Password" variant="default" type="password" />);
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles password visibility on button click', () => {
    render(<AuthFormInput label="Password" variant="default" type="password" />);
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('renders floating variant', () => {
    render(<AuthFormInput label="Email" variant="floating" placeholder="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders filled variant', () => {
    render(<AuthFormInput label="Email" variant="filled" placeholder="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('accepts and displays input value', () => {
    render(<AuthFormInput label="Email" variant="default" defaultValue="test@example.com" />);
    const input = screen.getByDisplayValue('test@example.com');
    expect(input).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    render(<AuthFormInput label="Email" variant="default" disabled />);
    const input = document.querySelector('input') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});

/**
 * Input & Tabs Component Tests
 *
 * Tests for Input (text input with error state) and
 * Tabs/TabsList/TabsTrigger/TabsContent components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Input } from '../input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

// =============================================================================
// INPUT COMPONENT
// =============================================================================

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through standard input props', () => {
    render(<Input type="email" name="email" data-testid="email-input" />);
    const input = screen.getByTestId('email-input');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('applies disabled state', () => {
    render(<Input disabled data-testid="disabled-input" />);
    expect(screen.getByTestId('disabled-input')).toBeDisabled();
  });

  it('shows hint text when provided', () => {
    render(<Input hint="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('does not show hint text when not provided', () => {
    const { container } = render(<Input />);
    const helperEls = container.querySelectorAll('p');
    expect(helperEls.length).toBe(0);
  });

  it('applies error styling when error is set', () => {
    render(<Input error="Invalid input" data-testid="err-input" />);
    const input = screen.getByTestId('err-input');
    expect(input.className).toContain('border-red-500/60');
  });

  it('applies normal border when no error', () => {
    render(<Input data-testid="ok-input" />);
    const input = screen.getByTestId('ok-input');
    expect(input.className).toContain('border-white/[0.08]');
    expect(input.className).not.toContain('border-red-500/60');
  });

  it('error message has error color', () => {
    render(<Input error="Invalid" />);
    const errorMsg = screen.getByText('Invalid');
    expect(errorMsg.className).toContain('text-red-600');
  });

  it('hint text has muted color', () => {
    render(<Input hint="Hint" />);
    const hint = screen.getByText('Hint');
    expect(hint.className).toContain('text-gray-500');
  });

  it('applies custom className', () => {
    render(<Input className="my-custom-class" data-testid="custom" />);
    expect(screen.getByTestId('custom').className).toContain('my-custom-class');
  });

  it('handles onChange events', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} data-testid="change-input" />);
    fireEvent.change(screen.getByTestId('change-input'), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('has display name Input', () => {
    expect(Input.displayName).toBe('Input');
  });
});

// =============================================================================
// TABS COMPONENTS
// =============================================================================

describe('Tabs', () => {
  const renderTabs = (defaultValue = 'tab1', onValueChange?: (v: string) => void) =>
    render(
      <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3" disabled>
            Tab 3
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

  it('renders tab triggers', () => {
    renderTabs();
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('shows content for the default tab', () => {
    renderTabs('tab1');
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('switches content when clicking a different tab', () => {
    renderTabs();
    fireEvent.click(screen.getByText('Tab 2'));
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('calls onValueChange when tab is clicked', () => {
    const onChange = vi.fn();
    renderTabs('tab1', onChange);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('does not switch when clicking disabled tab', () => {
    renderTabs();
    fireEvent.click(screen.getByText('Tab 3'));
    // Tab 3 is disabled, content should not change
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  it('sets aria-selected on active trigger', () => {
    renderTabs('tab1');
    const tab1 = screen.getByText('Tab 1');
    const tab2 = screen.getByText('Tab 2');
    expect(tab1).toHaveAttribute('aria-selected', 'true');
    expect(tab2).toHaveAttribute('aria-selected', 'false');
  });

  it('updates aria-selected on tab switch', () => {
    renderTabs();
    fireEvent.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Tab 1')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('Tab 2')).toHaveAttribute('aria-selected', 'true');
  });

  it('triggers have role=tab', () => {
    renderTabs();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
  });

  it('content has role=tabpanel', () => {
    renderTabs();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('disabled trigger has disabled attribute', () => {
    renderTabs();
    expect(screen.getByText('Tab 3')).toBeDisabled();
  });
});

describe('Tabs (controlled)', () => {
  it('works with controlled value prop', () => {
    const { rerender } = render(
      <Tabs value="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content A')).toBeInTheDocument();

    rerender(
      <Tabs value="b">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Content B')).toBeInTheDocument();
    expect(screen.queryByText('Content A')).not.toBeInTheDocument();
  });
});

describe('TabsList', () => {
  it('has role=tablist', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content</TabsContent>
      </Tabs>
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList className="custom-list">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content</TabsContent>
      </Tabs>
    );
    expect(screen.getByRole('tablist').className).toContain('custom-list');
  });
});

describe('TabsTrigger error handling', () => {
  it('throws when used outside Tabs', () => {
    expect(() => {
      render(<TabsTrigger value="x">X</TabsTrigger>);
    }).toThrow('TabsTrigger must be used within Tabs');
  });
});

describe('TabsContent error handling', () => {
  it('throws when used outside Tabs', () => {
    expect(() => {
      render(<TabsContent value="x">X</TabsContent>);
    }).toThrow('TabsContent must be used within Tabs');
  });
});

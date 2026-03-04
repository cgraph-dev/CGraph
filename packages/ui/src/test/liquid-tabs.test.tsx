import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LiquidTabs, type LiquidTab } from '../components/liquid-tabs';

const tabs: LiquidTab[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];

describe('LiquidTabs', () => {
  it('renders a tablist', () => {
    render(<LiquidTabs tabs={tabs} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders all tab buttons', () => {
    render(<LiquidTabs tabs={tabs} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('first tab is selected by default', () => {
    render(<LiquidTabs tabs={tabs} />);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled value selects correct tab', () => {
    render(<LiquidTabs tabs={tabs} value="two" />);
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when clicking a tab', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LiquidTabs tabs={tabs} onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(onChange).toHaveBeenCalledWith('two');
  });

  it('renders children as render prop', () => {
    render(
      <LiquidTabs tabs={tabs} value="one">
        {(active) => <div data-testid="panel">Active: {active}</div>}
      </LiquidTabs>
    );
    expect(screen.getByTestId('panel')).toHaveTextContent('Active: one');
  });

  it('renders tabpanel with correct aria-labelledby', () => {
    render(
      <LiquidTabs tabs={tabs} value="one">
        {() => <div>Content</div>}
      </LiquidTabs>
    );
    const panel = screen.getByRole('tabpanel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('aria-labelledby');
  });

  it('disabled tab cannot be clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const tabsWithDisabled: LiquidTab[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    render(<LiquidTabs tabs={tabsWithDisabled} onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selected tab has tabIndex 0, others have -1', () => {
    render(<LiquidTabs tabs={tabs} value="two" />);
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('tabindex', '-1');
  });

  it('applies sm size classes', () => {
    render(<LiquidTabs tabs={tabs} size="sm" />);
    const tab = screen.getByRole('tab', { name: 'One' });
    expect(tab.className).toContain('h-8');
  });
});

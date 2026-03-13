/**
 * Storybook stories for the SearchBar component.
 * @module modules/search/components/search-bar.stories
 */
import type { Meta, StoryObj } from '@storybook/react';

/** Standalone search bar mock for story isolation */
function MockSearchBar({
  placeholder = 'Search...',
  hasQuery = false,
  query = '',
  showSuggestions = false,
  showFilters = false,
}: {
  placeholder?: string;
  hasQuery?: boolean;
  query?: string;
  showSuggestions?: boolean;
  showFilters?: boolean;
}) {
  const displayQuery = hasQuery ? query || 'react hooks' : '';

  return (
    <div className="w-[400px]">
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2">
        <span className="text-gray-500">🔍</span>
        <input
          type="text"
          defaultValue={displayQuery}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
        {hasQuery && <button className="text-xs text-gray-400 hover:text-white">✕</button>}
      </div>

      {showFilters && (
        <div className="mt-2 flex gap-2">
          {['Messages', 'People', 'Files', 'Channels'].map((f) => (
            <button
              key={f}
              className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-gray-300 hover:bg-white/[0.08]"
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {showSuggestions && (
        <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
          {['react hooks tutorial', 'react native setup', 'react context api'].map((s) => (
            <button
              key={s}
              className="block w-full rounded px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/[0.08]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof MockSearchBar> = {
  title: 'UI/SearchBar',
  component: MockSearchBar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MockSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { placeholder: 'Search messages, people, channels...' },
};

export const WithQuery: Story = {
  args: { hasQuery: true, query: 'project roadmap' },
};

export const WithSuggestions: Story = {
  args: { hasQuery: true, query: 'react', showSuggestions: true },
};

export const WithFilters: Story = {
  args: { hasQuery: true, query: 'design system', showFilters: true },
};

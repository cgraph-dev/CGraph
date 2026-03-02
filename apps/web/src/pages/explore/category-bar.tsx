/**
 * Category Bar Component
 *
 * Horizontal scrollable category chip bar for filtering
 * communities on the explore page.
 *
 * @module pages/explore/category-bar
 */

interface CategoryBarProps {
  /** Available categories from the API. */
  categories: string[];
  /** Currently selected category (null = "All"). */
  selected: string | null;
  /** Callback when a category chip is clicked. */
  onSelect: (category: string | null) => void;
}

/**
 * Horizontally scrollable chip bar for explore category filtering.
 */
export default function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* "All" chip */}
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          selected === null
            ? 'bg-primary-600 text-white'
            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
        }`}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat === selected ? null : cat)}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
            selected === cat
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

/**
 * CategoryFilter component - filter buttons for shop categories
 */

import { CATEGORY_LABELS } from './constants';
import type { ShopCategory } from './types';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange('all')}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          activeCategory === 'all'
            ? 'bg-primary-500 text-white'
            : 'bg-dark-700 text-gray-400 hover:text-white'
        }`}
      >
        All
      </button>
      {(Object.entries(CATEGORY_LABELS) as [ShopCategory, string][]).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onCategoryChange(key)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeCategory === key
              ? 'bg-primary-500 text-white'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

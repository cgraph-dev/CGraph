/**
 * TabsFilter Component
 *
 * Tab buttons for filtering owned/all/purchasable titles
 */

import type { TabsFilterProps } from './types';
import { TABS } from './constants';

export function TabsFilter({ selectedTab, onTabSelect }: TabsFilterProps) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      {TABS.map((tab) => {
        const isSelected = selectedTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 transition-all ${
              isSelected
                ? 'bg-accent-primary text-white'
                : 'bg-surface-secondary hover:bg-surface-tertiary text-text-secondary'
            }`}
          >
            {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

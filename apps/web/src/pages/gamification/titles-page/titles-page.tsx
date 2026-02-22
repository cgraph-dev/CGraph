/**
 * TitlesPage Component
 *
 * Main page component that orchestrates all titles functionality
 */

import { TitlesHeader } from './titles-header';
import { RarityStats } from './rarity-stats';
import { TabsFilter } from './tabs-filter';
import { TitlesGrid } from './titles-grid';
import { useTitlesData } from './hooks';

export function TitlesPage() {
  const {
    selectedTab,
    selectedRarity,
    isLoading,
    actionLoading,
    equippedTitleId,
    filteredTitles,
    stats,
    setSelectedTab,
    setSelectedRarity,
    isOwned,
    handleEquip,
    handleUnequip,
    handlePurchase,
  } = useTitlesData();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <TitlesHeader stats={stats} equippedTitleId={equippedTitleId} />

      <RarityStats
        stats={stats}
        selectedRarity={selectedRarity}
        onRaritySelect={setSelectedRarity}
      />

      <TabsFilter selectedTab={selectedTab} onTabSelect={setSelectedTab} />

      <TitlesGrid
        titles={filteredTitles}
        isLoading={isLoading}
        actionLoading={actionLoading}
        equippedTitleId={equippedTitleId}
        selectedTab={selectedTab}
        isOwned={isOwned}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
        onPurchase={handlePurchase}
      />
    </div>
  );
}

export default TitlesPage;

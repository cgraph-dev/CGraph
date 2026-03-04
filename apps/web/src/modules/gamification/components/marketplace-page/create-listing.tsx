/**
 * CreateListing — 3-step wizard for creating a marketplace listing.
 *
 * Step 1: Select cosmetic item
 * Step 2: Set price
 * Step 3: Confirm and list
 *
 * @module modules/gamification/components/marketplace-page/create-listing
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ItemType } from '@/modules/gamification/store';

export interface OwnedCosmetic {
  id: string;
  name: string;
  type: ItemType;
  rarity: string;
  previewUrl?: string;
  icon?: string;
}

export interface CreateListingProps {
  ownedCosmetics: OwnedCosmetic[];
  onCreateListing: (params: {
    itemType: string;
    itemId: string;
    price: number;
    currency: string;
    acceptsTrades: boolean;
  }) => Promise<{ success: boolean; listingFee?: number }>;
  isCreating?: boolean;
  suggestedPrices: Record<string, { min: number; max: number; suggested: number }>;
}

const STEPS = [
  { id: 1, label: 'Select Item', icon: SparklesIcon },
  { id: 2, label: 'Set Price', icon: CurrencyDollarIcon },
  { id: 3, label: 'Confirm', icon: ShieldCheckIcon },
];

const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400/30 text-gray-400',
  uncommon: 'border-green-400/30 text-green-400',
  rare: 'border-blue-400/30 text-blue-400',
  epic: 'border-purple-400/30 text-purple-400',
  legendary: 'border-yellow-400/30 text-yellow-400',
};

/**
 * 3-step marketplace listing creation wizard.
 */
export function CreateListing({
  ownedCosmetics,
  onCreateListing,
  isCreating = false,
  suggestedPrices,
}: CreateListingProps) {
  const [step, setStep] = useState(1);
  const [selectedItem, setSelectedItem] = useState<OwnedCosmetic | null>(null);
  const [price, setPrice] = useState(0);
  const [acceptsTrades, setAcceptsTrades] = useState(false);
  const [result, setResult] = useState<{ success: boolean; listingFee?: number } | null>(null);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleConfirm = useCallback(async () => {
    if (!selectedItem || price <= 0) return;

    const res = await onCreateListing({
      itemType: selectedItem.type,
      itemId: selectedItem.id,
      price,
      currency: 'coins',
      acceptsTrades,
    });

    setResult(res);
    if (res.success) {
      // Reset wizard
      setTimeout(() => {
        setStep(1);
        setSelectedItem(null);
        setPrice(0);
        setAcceptsTrades(false);
        setResult(null);
      }, 3000);
    }
  }, [selectedItem, price, acceptsTrades, onCreateListing]);

  const suggested = selectedItem
    ? suggestedPrices[selectedItem.rarity] ?? { min: 10, max: 1000, suggested: 100 }
    : null;

  return (
    <GlassCard variant="frosted" className="p-6">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-4">
        {STEPS.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step >= s.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-gray-500'
              }`}
            >
              {step > s.id ? <CheckIcon className="h-4 w-4" /> : s.id}
            </div>
            <span className={`text-sm ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>
              {s.label}
            </span>
            {s.id < 3 && (
              <div className={`h-px w-8 ${step > s.id ? 'bg-primary-500' : 'bg-dark-700'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Cosmetic */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="mb-4 text-lg font-bold text-white">Select a Cosmetic to Sell</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {ownedCosmetics.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-dark-700 text-2xl">
                    {item.icon ?? '🎨'}
                  </div>
                  <div className="truncate text-sm font-medium text-white">{item.name}</div>
                  <div className={`text-xs capitalize ${RARITY_COLORS[item.rarity] ?? 'text-gray-400'}`}>
                    {item.rarity}
                  </div>
                </button>
              ))}
            </div>
            {ownedCosmetics.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No cosmetics available to sell
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Set Price */}
        {step === 2 && selectedItem && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="mb-4 text-lg font-bold text-white">Set Your Price</h3>
            <div className="mx-auto max-w-md space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedItem.icon ?? '🎨'}</span>
                  <div>
                    <div className="font-medium text-white">{selectedItem.name}</div>
                    <div className={`text-xs capitalize ${RARITY_COLORS[selectedItem.rarity] ?? ''}`}>
                      {selectedItem.rarity}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Price (coins)</label>
                <input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  min={1}
                  className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white"
                  placeholder="Enter price..."
                />
                {suggested && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>Suggested: {suggested.suggested} coins</span>
                    <span>|</span>
                    <span>Range: {suggested.min} - {suggested.max}</span>
                    <button
                      onClick={() => setPrice(suggested.suggested)}
                      className="text-primary-400 hover:underline"
                    >
                      Use suggested
                    </button>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={acceptsTrades}
                  onChange={(e) => setAcceptsTrades(e.target.checked)}
                  className="rounded border-white/20 bg-dark-700"
                />
                <span className="text-sm text-gray-400">Accept trade offers</span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedItem && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="mb-4 text-lg font-bold text-white">Confirm Listing</h3>
            <div className="mx-auto max-w-md space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Item</span>
                    <span className="text-white">{selectedItem.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rarity</span>
                    <span className={`capitalize ${RARITY_COLORS[selectedItem.rarity] ?? ''}`}>
                      {selectedItem.rarity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price</span>
                    <span className="font-bold text-white">{price.toLocaleString()} coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Listing Fee (5%)</span>
                    <span className="text-yellow-400">{Math.ceil(price * 0.05)} coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accepts Trades</span>
                    <span className="text-white">{acceptsTrades ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {result?.success && (
                <div className="rounded-lg bg-green-500/20 p-3 text-center text-sm text-green-400">
                  Listed successfully! Listing fee: {result.listingFee} coins
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-400 transition-colors hover:text-white disabled:invisible"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={handleNext}
            disabled={(step === 1 && !selectedItem) || (step === 2 && price <= 0)}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-400 disabled:opacity-50"
          >
            Next
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={isCreating || !selectedItem || price <= 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-2 font-medium text-white transition-colors hover:from-green-400 hover:to-emerald-400 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Confirm & List'}
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </GlassCard>
  );
}

/**
 * FilterChips — Filter controls for in-conversation message search.
 *
 * Displays compact filter chips for sender, date range, and message type.
 *
 * @module modules/search/components/in-conversation-search/filter-chips
 */

import { useState, useCallback } from 'react';
import { UserIcon, CalendarDaysIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { ConversationSearchFilters } from '../../hooks/useConversationSearch';

interface FilterChipsProps {
  filters: ConversationSearchFilters;
  onFiltersChange: (filters: ConversationSearchFilters) => void;
  participants?: Array<{ id: string; username: string; display_name: string }>;
}

/**
 * Filter chips row for in-conversation search.
 */
export function FilterChips({ filters, onFiltersChange, participants = [] }: FilterChipsProps) {
  const [showSenderPicker, setShowSenderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const clearFilter = useCallback(
    (key: keyof ConversationSearchFilters) => {
      onFiltersChange({ ...filters, [key]: undefined });
    },
    [filters, onFiltersChange]
  );

  const setSender = useCallback(
    (senderId: string) => {
      onFiltersChange({ ...filters, senderId });
      setShowSenderPicker(false);
    },
    [filters, onFiltersChange]
  );

  const setDateRange = useCallback(
    (dateFrom: string, dateTo: string) => {
      onFiltersChange({ ...filters, dateFrom, dateTo });
      setShowDatePicker(false);
    },
    [filters, onFiltersChange]
  );

  const setType = useCallback(
    (type: string | undefined) => {
      onFiltersChange({ ...filters, type: filters.type === type ? undefined : type });
    },
    [filters, onFiltersChange]
  );

  const selectedParticipant = participants.find((p) => p.id === filters.senderId);

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2">
      {/* Sender filter chip */}
      <div className="relative">
        <button
          onClick={() => setShowSenderPicker((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur-sm transition-all duration-150 ${
            filters.senderId
              ? 'border-purple-400/30 bg-purple-500/15 text-purple-300 shadow-[0_0_8px_rgba(192,132,252,0.12)]'
              : 'border-white/[0.08] bg-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:bg-white/[0.10]'
          }`}
        >
          <UserIcon className="h-3.5 w-3.5" />
          {selectedParticipant ? selectedParticipant.display_name : 'From'}
          {filters.senderId && (
            <XMarkIcon
              className="h-3 w-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                clearFilter('senderId');
              }}
            />
          )}
        </button>

        {showSenderPicker && (
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-xl border border-white/[0.08] bg-[rgb(30,32,40)]/[0.92] p-1 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[16px]">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setSender(p.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                  filters.senderId === p.id
                    ? 'bg-purple-500/15 text-white'
                    : 'text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                <UserIcon className="h-3.5 w-3.5 text-gray-500" />
                {p.display_name || p.username}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date filter chip */}
      <div className="relative">
        <button
          onClick={() => setShowDatePicker((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs backdrop-blur-sm transition-all duration-150 ${
            filters.dateFrom || filters.dateTo
              ? 'border-blue-400/30 bg-blue-500/15 text-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.12)]'
              : 'border-white/[0.08] bg-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:bg-white/[0.10]'
          }`}
        >
          <CalendarDaysIcon className="h-3.5 w-3.5" />
          {filters.dateFrom
            ? `${new Date(filters.dateFrom).toLocaleDateString()}${filters.dateTo ? ` - ${new Date(filters.dateTo).toLocaleDateString()}` : ''}`
            : 'Date'}
          {(filters.dateFrom || filters.dateTo) && (
            <XMarkIcon
              className="h-3 w-3 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                clearFilter('dateFrom');
                clearFilter('dateTo');
              }}
            />
          )}
        </button>

        {showDatePicker && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-white/[0.08] bg-[rgb(30,32,40)]/[0.92] p-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[16px]">
            <label className="mb-1 block text-[10px] uppercase text-gray-500">From</label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
              }
              className="mb-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-2 py-1 text-xs text-white"
            />
            <label className="mb-1 block text-[10px] uppercase text-gray-500">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
              className="mb-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.06] px-2 py-1 text-xs text-white"
            />
            <button
              onClick={() => setDateRange(filters.dateFrom ?? '', filters.dateTo ?? '')}
              className="w-full rounded-lg bg-blue-500 px-2 py-1 text-xs text-white shadow-[0_0_12px_rgba(59,130,246,0.2)] transition-colors hover:bg-blue-400"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Type filter chips */}
      {['text', 'image', 'voice', 'attachment'].map((t) => (
        <button
          key={t}
          onClick={() => setType(t)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs capitalize backdrop-blur-sm transition-all duration-150 ${
            filters.type === t
              ? 'border-green-400/30 bg-green-500/15 text-green-300 shadow-[0_0_8px_rgba(134,239,172,0.12)]'
              : 'border-white/[0.08] bg-white/[0.06] text-gray-400 hover:border-white/[0.12] hover:bg-white/[0.10]'
          }`}
        >
          {t === 'image' && <PhotoIcon className="h-3.5 w-3.5" />}
          {t}
        </button>
      ))}
    </div>
  );
}

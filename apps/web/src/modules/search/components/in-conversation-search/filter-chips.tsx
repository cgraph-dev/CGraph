/**
 * FilterChips — Filter controls for in-conversation message search.
 *
 * Displays compact filter chips for sender, date range, and message type.
 *
 * @module modules/search/components/in-conversation-search/filter-chips
 */

import { useState, useCallback } from 'react';
import {
  UserIcon,
  CalendarDaysIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
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
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            filters.senderId
              ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
              : 'border-gray-600 bg-dark-700 text-gray-400 hover:border-gray-500'
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
          <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-700 bg-dark-800 p-1 shadow-xl">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setSender(p.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                  filters.senderId === p.id ? 'bg-primary-600/20 text-white' : 'text-gray-300 hover:bg-dark-700'
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
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
            filters.dateFrom || filters.dateTo
              ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
              : 'border-gray-600 bg-dark-700 text-gray-400 hover:border-gray-500'
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
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-700 bg-dark-800 p-3 shadow-xl">
            <label className="mb-1 block text-[10px] uppercase text-gray-500">From</label>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
              className="mb-2 w-full rounded border border-gray-600 bg-dark-700 px-2 py-1 text-xs text-white"
            />
            <label className="mb-1 block text-[10px] uppercase text-gray-500">To</label>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
              className="mb-2 w-full rounded border border-gray-600 bg-dark-700 px-2 py-1 text-xs text-white"
            />
            <button
              onClick={() => setDateRange(filters.dateFrom ?? '', filters.dateTo ?? '')}
              className="w-full rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-500"
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
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
            filters.type === t
              ? 'border-primary-500/50 bg-primary-500/10 text-primary-300'
              : 'border-gray-600 bg-dark-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          {t === 'image' && <PhotoIcon className="h-3.5 w-3.5" />}
          {t}
        </button>
      ))}
    </div>
  );
}

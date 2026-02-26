/**
 * Forum post poll creation component.
 * @module
 */
import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS, POLL_DURATION_OPTIONS } from './constants';
import type { PollCreatorProps } from './types';

/**
 * PollCreator Component
 *
 * Form for creating polls with multiple options, duration settings,
 * and allow-multiple-choices toggle
 */
export function PollCreator({
  pollQuestion,
  setPollQuestion,
  pollOptions,
  addPollOption,
  removePollOption,
  updatePollOption,
  pollAllowMultiple,
  setPollAllowMultiple,
  pollDuration,
  setPollDuration,
  onClose,
  primaryColor,
}: PollCreatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="border-t border-dark-700 bg-dark-800/50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium">
            <SparklesIcon className="h-5 w-5" style={{ color: primaryColor }} />
            Poll
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="mb-3 w-full rounded-lg bg-dark-700 p-3 outline-none focus:ring-2"
           
          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties} // safe downcast – CSS custom properties
        />

        <div className="mb-3 space-y-2">
          {pollOptions.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span className="w-6 text-gray-500">{index + 1}.</span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updatePollOption(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 rounded-lg bg-dark-700 p-2 outline-none focus:ring-2"
                 
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties} // safe downcast – CSS custom properties
              />
              {pollOptions.length > MIN_POLL_OPTIONS && (
                <button
                  onClick={() => removePollOption(option.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {pollOptions.length < MAX_POLL_OPTIONS && (
          <button
            onClick={addPollOption}
            className="mb-3 text-sm hover:underline"
            style={{ color: primaryColor }}
          >
            + Add option
          </button>
        )}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pollAllowMultiple}
              onChange={(e) => setPollAllowMultiple(e.target.checked)}
              className="rounded"
            />
            Allow multiple choices
          </label>

          <select
            value={pollDuration ?? ''}
            onChange={(e) => setPollDuration(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded bg-dark-700 px-2 py-1 text-sm"
          >
            {POLL_DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
}

export default PollCreator;

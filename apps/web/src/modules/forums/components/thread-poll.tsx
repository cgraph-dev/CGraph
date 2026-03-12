/**
 * ThreadPoll Component
 *
 * Enhanced poll creation + voting UI that composes with existing
 * PollWidget and PollCard components.
 *
 * Features:
 * - Create form: question + add/remove options + settings toggles
 * - Vote buttons (radio for single, checkbox for multiple)
 * - Results as horizontal bar chart with percentages
 * - Live updates placeholder
 * - Delegates rendering to PollWidget (full) or PollCard (compact)
 *
 * @module modules/forums/components/thread-poll
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlusIcon,
  XMarkIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { type Poll } from '@/modules/forums/store';

interface CreatePollData {
  question: string;
  options: string[];
  allowMultiple: boolean;
  maxSelections?: number;
  timeout?: string;
  public: boolean;
}
import PollWidget from './poll-widget';
import { PollCard } from './poll-card';

// ── Types ──────────────────────────────────────────────────────────────

interface ThreadPollProps {
  /** Existing poll to view/vote on */
  poll?: Poll | null;
  /** Thread ID for context */
  threadId: string;
  /** Whether current user is the poll creator */
  isCreator?: boolean;
  /** Create mode — show creation form instead of voting UI */
  mode?: 'view' | 'create';
  /** Compact variant uses PollCard, full uses PollWidget */
  variant?: 'compact' | 'full';
  /** Called when a new poll is created */
  onCreate?: (data: CreatePollData) => void;
  className?: string;
}

// ── Create Form Sub-component ──────────────────────────────────────────

interface PollCreateFormProps {
  onCreate: (data: CreatePollData) => void;
  className?: string;
}

function PollCreateForm({ onCreate, className }: PollCreateFormProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [maxSelections, setMaxSelections] = useState<number | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(true);
  const [timeout, setTimeout_] = useState('');

  const addOption = () => {
    if (options.length >= 20) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const isValid =
    question.trim().length > 0 &&
    options.filter((o) => o.trim().length > 0).length >= 2;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    const data: CreatePollData = {
      question: question.trim(),
      options: options.filter((o) => o.trim()).map((o) => o.trim()),
      allowMultiple,
      maxSelections: allowMultiple ? maxSelections : undefined,
      timeout: timeout || undefined,
      public: isPublic,
    };

    onCreate(data);
  }, [question, options, allowMultiple, maxSelections, isPublic, timeout, isValid, onCreate]);

  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.03] p-4',
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-primary-400" />
        <h3 className="text-sm font-bold text-white">Create Poll</h3>
      </div>

      {/* Question */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Question
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What do you want to ask?"
          maxLength={200}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30"
        />
      </div>

      {/* Options */}
      <div className="mb-4 space-y-2">
        <label className="mb-1 block text-xs font-medium text-gray-400">
          Options ({options.length}/20)
        </label>
        <AnimatePresence mode="popLayout">
          {options.map((opt, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                maxLength={100}
                className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/50"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="rounded p-1 text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-400"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {options.length < 20 && (
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 rounded-lg border border-dashed border-white/[0.12] px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-primary-500/50 hover:text-primary-400"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add Option
          </button>
        )}
      </div>

      {/* Settings */}
      <div className="mb-4 space-y-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Cog6ToothIcon className="h-4 w-4" />
          <span className="font-medium">Settings</span>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-300">Allow multiple selections</span>
        </label>

        {allowMultiple && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="ml-7"
          >
            <label className="text-xs text-gray-400">
              Max selections
              <input
                type="number"
                min={2}
                max={options.length}
                value={maxSelections ?? ''}
                onChange={(e) =>
                  setMaxSelections(e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="No limit"
                className="ml-2 w-20 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-sm text-white outline-none"
              />
            </label>
          </motion.div>
        )}

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-300">Public votes (show who voted)</span>
        </label>

        <div>
          <label className="text-xs text-gray-400">
            Close after (optional)
            <input
              type="datetime-local"
              value={timeout}
              onChange={(e) => setTimeout_(e.target.value)}
              className="ml-2 rounded border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-sm text-white outline-none"
            />
          </label>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid}
        whileHover={isValid ? { scale: 1.01 } : undefined}
        whileTap={isValid ? { scale: 0.99 } : undefined}
        className={cn(
          'w-full rounded-lg py-2.5 text-sm font-semibold transition-all',
          isValid
            ? 'bg-primary-600 text-white hover:bg-primary-500'
            : 'cursor-not-allowed bg-white/[0.04] text-gray-600',
        )}
      >
        Create Poll
      </motion.button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export default function ThreadPoll({
  poll,
  threadId,
  isCreator = false,
  mode = 'view',
  variant = 'full',
  onCreate,
  className,
}: ThreadPollProps) {
  // Create mode
  if (mode === 'create' && onCreate) {
    return <PollCreateForm onCreate={onCreate} className={className} />;
  }

  // View mode — no poll yet
  if (!poll) {
    return null;
  }

  // View mode — full variant uses PollWidget
  if (variant === 'full') {
    return (
      <PollWidget
        poll={poll}
        threadId={threadId}
        isCreator={isCreator}
        className={className}
      />
    );
  }

  // View mode — compact variant uses PollCard
  return (
    <PollCard
      question={poll.question}
      options={poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        voteCount: o.votes,
      }))}
      totalVoters={poll.options.reduce((s, o) => s + o.votes, 0)}
      userVotes={[]}
      multiVote={poll.allowMultiple}
      expiresAt={poll.timeout}
      isClosed={poll.closed}
      className={className}
    />
  );
}

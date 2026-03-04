/**
 * CreatePollModal - Create a poll within a chat conversation
 * Supports single and multiple choice
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { entranceVariants, springs } from '@/lib/animation-presets';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (poll: PollData) => void;
}

export interface PollData {
  question: string;
  options: string[];
  multipleChoice: boolean;
  anonymous: boolean;
}

/**
 * unknown for the chat module.
 */
/**
 * Create Poll Modal dialog component.
 */
export function CreatePollModal({ isOpen, onClose, onSubmit }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    onSubmit({
      question: question.trim(),
      options: validOptions,
      multipleChoice,
      anonymous,
    });
    // reset
    setQuestion('');
    setOptions(['', '']);
    setMultipleChoice(false);
    setAnonymous(false);
    onClose();
  };

  const isValid = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            variants={entranceVariants.fadeUp}
            initial="initial"
            animate="animate"
            exit="initial"
            transition={springs.gentle}
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-primary-400" />
                <h2 className="text-lg font-bold text-white">Create Poll</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Question */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-white/60">Question</label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                maxLength={200}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Options */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-white/60">Options</label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs text-white/30">{i + 1}.</span>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={100}
                      className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => removeOption(i)}
                        className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-primary-400 hover:bg-primary-500/10"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add option
                </button>
              )}
            </div>

            {/* Settings */}
            <div className="mb-5 space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={multipleChoice}
                  onChange={(e) => setMultipleChoice(e.target.checked)}
                  className="rounded border-white/20 bg-white/[0.06] text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-white/70">Allow multiple selections</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded border-white/20 bg-white/[0.06] text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-white/70">Anonymous voting</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-40"
              >
                Create Poll
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

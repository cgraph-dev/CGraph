/**
 * Forum admin rules management panel.
 * @module
 */
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { ForumRule } from '../types';

interface RulesPanelProps {
  rules: ForumRule[];
  editingRule: string | null;
  onAddRule: () => void;
  onEditRule: (ruleId: string | null) => void;
  onUpdateRule: (ruleId: string, field: keyof ForumRule, value: string | number) => void;
  onRemoveRule: (ruleId: string) => void;
}

export function RulesPanel({
  rules,
  editingRule,
  onAddRule,
  onEditRule,
  onUpdateRule,
  onRemoveRule,
}: RulesPanelProps) {
  return (
    <motion.div
      key="rules"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Community Rules</h2>
        <p className="text-gray-400">Define guidelines for your community.</p>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Rules</h3>
          <motion.button
            onClick={onAddRule}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusIcon className="h-5 w-5" />
            Add Rule
          </motion.button>
        </div>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <motion.div key={rule.id} className="group rounded-lg bg-dark-700/50 p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/20 font-bold text-primary-400">
                  {index + 1}
                </span>
                <div className="flex-1">
                  {editingRule === rule.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={rule.title}
                        onChange={(e) => onUpdateRule(rule.id, 'title', e.target.value)}
                        className="w-full rounded-lg border border-dark-500 bg-dark-600 px-3 py-2 font-medium text-white"
                        placeholder="Rule title"
                      />
                      <textarea
                        value={rule.description}
                        onChange={(e) => onUpdateRule(rule.id, 'description', e.target.value)}
                        className="w-full resize-none rounded-lg border border-dark-500 bg-dark-600 px-3 py-2 text-white"
                        rows={2}
                        placeholder="Rule description"
                      />
                      <button
                        onClick={() => onEditRule(null)}
                        className="rounded bg-primary-600 px-3 py-1 text-sm text-white"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-white">{rule.title}</h4>
                      <p className="mt-1 text-sm text-gray-400">{rule.description}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onEditRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onRemoveRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-400"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

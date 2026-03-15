/**
 * Auto-Rule Editor
 *
 * List auto-rules, create/edit rules, evaluate now, rule templates.
 * Supports milestone, time_based, subscription, and custom rule types.
 *
 * @module modules/forums/components/user-groups/auto-rule-editor
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BoltIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import {
  useUserGroupsStore,
  type AutoRule,
  type CreateAutoRuleData,
} from '../../store/forumStore.userGroups';

// ── Rule Templates ───────────────────────────────────────────────────────

const RULE_TEMPLATES: { name: string; data: Partial<CreateAutoRuleData> }[] = [
  {
    name: '100 Posts Milestone',
    data: { ruleType: 'milestone', threshold: 100, name: '100 Posts Achievement' },
  },
  {
    name: '1 Year Member',
    data: { ruleType: 'time_based', threshold: 365, name: '1 Year Anniversary' },
  },
  {
    name: 'Active Subscriber',
    data: { ruleType: 'subscription', threshold: 1, name: 'Active Subscriber' },
  },
  {
    name: '500 Reputation',
    data: { ruleType: 'milestone', threshold: 500, name: 'Reputation Star' },
  },
];

const RULE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  milestone: {
    label: 'Milestone',
    description: 'Triggered when user reaches a threshold (posts, reputation, etc.)',
  },
  time_based: {
    label: 'Time Based',
    description: 'Triggered after a duration of membership (in days)',
  },
  subscription: { label: 'Subscription', description: 'Triggered by active subscription status' },
  custom: { label: 'Custom', description: 'Custom criteria-based rule' },
};

interface AutoRuleEditorProps {
  forumId: string;
}

/** Description. */
/** Auto Rule Editor component. */
export function AutoRuleEditor({ forumId }: AutoRuleEditorProps) {
  const {
    groups,
    autoRules,
    isLoadingRules,
    fetchGroups,
    fetchAutoRules,
    createAutoRule,
    updateAutoRule,
    deleteAutoRule,
    evaluateRules,
  } = useUserGroupsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoRule | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateResult, setEvaluateResult] = useState<{ usersAssigned: number } | null>(null);

  useEffect(() => {
    fetchAutoRules(forumId);
    if (groups.length === 0) fetchGroups(forumId);
  }, [forumId, fetchAutoRules, fetchGroups, groups.length]);

  const handleEvaluate = useCallback(async () => {
    setEvaluating(true);
    setEvaluateResult(null);
    try {
      const result = await evaluateRules(forumId);
      setEvaluateResult(result);
      setTimeout(() => setEvaluateResult(null), 5000);
    } finally {
      setEvaluating(false);
    }
  }, [forumId, evaluateRules]);

  const handleDelete = useCallback(
    async (ruleId: string) => {
      if (!window.confirm('Delete this auto-rule?')) return;
      await deleteAutoRule(forumId, ruleId);
    },
    [forumId, deleteAutoRule]
  );

  const handleToggleActive = useCallback(
    async (rule: AutoRule) => {
      await updateAutoRule(forumId, rule.id, { isActive: !rule.isActive });
    },
    [forumId, updateAutoRule]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BoltIcon className="h-6 w-6 text-amber-500" />
          <h2 className="text-xl font-bold">Auto-Rules</h2>
          <span className="text-sm text-gray-400">({autoRules.length} rules)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            <PlayIcon className={`h-4 w-4 ${evaluating ? 'animate-pulse' : ''}`} />
            Evaluate Now
          </button>
          <button
            onClick={() => {
              setEditingRule(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Create Rule
          </button>
        </div>
      </div>

      {/* Evaluation result toast */}
      <AnimatePresence>
        {evaluateResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-lg border border-green-700 bg-green-900/50 p-3"
          >
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-300">
              Evaluation complete. {evaluateResult.usersAssigned} user
              {evaluateResult.usersAssigned !== 1 ? 's' : ''} assigned to groups.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rule Templates */}
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-300">Quick Templates</h3>
        <div className="flex flex-wrap gap-2">
          {RULE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => {
                setEditingRule(null);
                setShowForm(true);
                // Template data will be applied via the form
              }}
              className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/[0.10]"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      {isLoadingRules && autoRules.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {autoRules.map((rule) => (
            <motion.div
              key={rule.id}
              layout
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Active indicator */}
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`h-3 w-3 flex-shrink-0 rounded-full transition-colors ${
                      rule.isActive ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    title={
                      rule.isActive ? 'Active — click to disable' : 'Inactive — click to enable'
                    }
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{rule.name}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          rule.isActive
                            ? 'bg-green-900 text-green-300'
                            : 'bg-white/[0.06] text-gray-400'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-gray-300">
                        {RULE_TYPE_LABELS[rule.ruleType]?.label || rule.ruleType}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-400">
                      <span>Threshold: {rule.threshold}</span>
                      <span>→ {rule.targetGroupName}</span>
                      <span>{rule.usersAssigned} assigned</span>
                      {rule.lastEvaluatedAt && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          Last: {new Date(rule.lastEvaluatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setShowForm(true);
                    }}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-red-400"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {autoRules.length === 0 && !isLoadingRules && (
        <div className="py-8 text-center text-gray-400">
          <BoltIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>No auto-rules configured. Create rules to automatically assign users to groups.</p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <RuleForm
            forumId={forumId}
            groups={groups}
            rule={editingRule}
            onSave={async (data) => {
              if (editingRule) {
                await updateAutoRule(forumId, editingRule.id, data);
              } else {
                await createAutoRule(forumId, data);
              }
              setShowForm(false);
              setEditingRule(null);
            }}
            onClose={() => {
              setShowForm(false);
              setEditingRule(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Rule Form ────────────────────────────────────────────────────────────

interface RuleFormProps {
  forumId: string;
  groups: { id: string; name: string }[];
  rule: AutoRule | null;
  onSave: (data: CreateAutoRuleData) => Promise<void>;
  onClose: () => void;
}

function RuleForm({ groups, rule, onSave, onClose }: RuleFormProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [ruleType, setRuleType] = useState<CreateAutoRuleData['ruleType']>(
    rule?.ruleType || 'milestone'
  );
  const [threshold, setThreshold] = useState(rule?.threshold || 0);
  const [targetGroupId, setTargetGroupId] = useState(rule?.targetGroupId || groups[0]?.id || '');
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetGroupId) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        ruleType,
        threshold,
        targetGroupId,
        isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-white/[0.04] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold">{rule ? 'Edit Rule' : 'Create Auto-Rule'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Rule Type</label>
              <select
                value={ruleType}
                 
                onChange={(e) => setRuleType(e.target.value as CreateAutoRuleData['ruleType'])}
                className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
              >
                {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {RULE_TYPE_LABELS[ruleType]?.description}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">Threshold</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Target Group</label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[rgb(30,32,40)] px-3 py-2 text-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Active</span>
          </label>

          <div className="flex justify-end gap-3 border-t border-white/[0.08] pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !targetGroupId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : rule ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AutoRuleEditor;

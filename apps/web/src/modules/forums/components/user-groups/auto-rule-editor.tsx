/**
 * Auto-Rule Editor
 *
 * List auto-rules, create/edit rules, evaluate now, rule templates.
 * Supports milestone, time_based, subscription, and custom rule types.
 *
 * @module modules/forums/components/user-groups/auto-rule-editor
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  milestone: { label: 'Milestone', description: 'Triggered when user reaches a threshold (posts, reputation, etc.)' },
  time_based: { label: 'Time Based', description: 'Triggered after a duration of membership (in days)' },
  subscription: { label: 'Subscription', description: 'Triggered by active subscription status' },
  custom: { label: 'Custom', description: 'Custom criteria-based rule' },
};

interface AutoRuleEditorProps {
  forumId: string;
}

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
    [forumId, deleteAutoRule],
  );

  const handleToggleActive = useCallback(
    async (rule: AutoRule) => {
      await updateAutoRule(forumId, rule.id, { isActive: !rule.isActive });
    },
    [forumId, updateAutoRule],
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
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <PlayIcon className={`h-4 w-4 ${evaluating ? 'animate-pulse' : ''}`} />
            Evaluate Now
          </button>
          <button
            onClick={() => { setEditingRule(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
            className="bg-green-900/50 border border-green-700 rounded-lg p-3 flex items-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <span className="text-green-300 text-sm">
              Evaluation complete. {evaluateResult.usersAssigned} user{evaluateResult.usersAssigned !== 1 ? 's' : ''} assigned to groups.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rule Templates */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Quick Templates</h3>
        <div className="flex flex-wrap gap-2">
          {RULE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              onClick={() => {
                setEditingRule(null);
                setShowForm(true);
                // Template data will be applied via the form
              }}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      {isLoadingRules && autoRules.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {autoRules.map((rule) => (
            <motion.div
              key={rule.id}
              layout
              className="bg-gray-800 rounded-lg border border-gray-700 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Active indicator */}
                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
                      rule.isActive ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    title={rule.isActive ? 'Active — click to disable' : 'Inactive — click to enable'}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{rule.name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        rule.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                        {RULE_TYPE_LABELS[rule.ruleType]?.label || rule.ruleType}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
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
                    onClick={() => { setEditingRule(rule); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700 transition-colors"
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
        <div className="text-center py-8 text-gray-400">
          <BoltIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
            onClose={() => { setShowForm(false); setEditingRule(null); }}
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
  const [ruleType, setRuleType] = useState<CreateAutoRuleData['ruleType']>(rule?.ruleType || 'milestone');
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
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">{rule ? 'Edit Rule' : 'Create Auto-Rule'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rule Type</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as CreateAutoRuleData['ruleType'])}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
              >
                {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {RULE_TYPE_LABELS[ruleType]?.description}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Threshold</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Target Group</label>
            <select
              value={targetGroupId}
              onChange={(e) => setTargetGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
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

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !targetGroupId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors"
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

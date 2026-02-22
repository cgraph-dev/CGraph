/**
 * AutomodSettings - Configure automated content moderation rules
 * Part of group settings
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store/authStore.impl';

interface AutomodRule {
  id: string;
  name: string;
  rule_type: 'word_filter' | 'link_filter' | 'spam_detection' | 'caps_filter';
  pattern: string;
  action: 'delete' | 'warn' | 'mute' | 'flag_for_review';
  is_enabled: boolean;
}

const RULE_TYPES = [
  {
    value: 'word_filter',
    label: 'Word Filter',
    desc: 'Block messages containing specific words (regex)',
  },
  { value: 'link_filter', label: 'Link Filter', desc: 'Block messages with specific domains' },
  { value: 'spam_detection', label: 'Spam Detection', desc: 'Rate limit rapid messages' },
  { value: 'caps_filter', label: 'Caps Filter', desc: 'Filter excessive capitalization' },
];

const ACTIONS = [
  { value: 'delete', label: 'Delete message' },
  { value: 'warn', label: 'Warn user' },
  { value: 'mute', label: 'Mute user' },
  { value: 'flag_for_review', label: 'Flag for review' },
];

export function AutomodSettings({ groupId }: { groupId: string }) {
  const [rules, setRules] = useState<AutomodRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<AutomodRule>>({});

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/automod`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.data || []);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSave = async () => {
    const method = editingRule.id ? 'PUT' : 'POST';
    const url = editingRule.id
      ? `/api/v1/groups/${groupId}/automod/${editingRule.id}`
      : `/api/v1/groups/${groupId}/automod`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify(editingRule),
      });
      if (res.ok) {
        fetchRules();
        setShowEditor(false);
        setEditingRule({});
      }
    } catch {
      // noop
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/v1/groups/${groupId}/automod/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // noop
    }
  };

  const handleToggle = async (rule: AutomodRule) => {
    try {
      await fetch(`/api/v1/groups/${groupId}/automod/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ is_enabled: !rule.is_enabled }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: !r.is_enabled } : r))
      );
    } catch {
      // noop
    }
  };

  const typeLabel = (t: string) => RULE_TYPES.find((rt) => rt.value === t)?.label || t;
  const actionLabel = (a: string) => ACTIONS.find((ac) => ac.value === a)?.label || a;

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">AutoMod Rules</h3>
        </div>
        <button
          onClick={() => {
            setEditingRule({ rule_type: 'word_filter', action: 'delete', is_enabled: true });
            setShowEditor(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500"
        >
          <PlusIcon className="h-4 w-4" />
          Add Rule
        </button>
      </div>

      {/* Rule editor modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden rounded-xl border border-white/10 bg-dark-700 p-4"
          >
            <div className="space-y-3">
              <input
                value={editingRule.name || ''}
                onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                placeholder="Rule name"
                className="w-full rounded-lg border border-white/10 bg-dark-800 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editingRule.rule_type || 'word_filter'}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      rule_type: e.target.value as AutomodRule['rule_type'],
                    })
                  }
                  className="rounded-lg border border-white/10 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                >
                  {RULE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  value={editingRule.action || 'delete'}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      action: e.target.value as AutomodRule['action'],
                    })
                  }
                  className="rounded-lg border border-white/10 bg-dark-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                >
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={editingRule.pattern || ''}
                onChange={(e) => setEditingRule({ ...editingRule, pattern: e.target.value })}
                placeholder="Pattern (regex for word filter, domains for link filter)"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-dark-800 px-3 py-2 font-mono text-sm text-white placeholder-white/30 focus:border-primary-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingRule({});
                  }}
                  className="rounded-lg px-4 py-1.5 text-sm text-white/40 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!editingRule.name || !editingRule.pattern}
                  className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-40"
                >
                  {editingRule.id ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 py-8 text-center">
          <ShieldCheckIcon className="mx-auto mb-2 h-8 w-8 text-white/10" />
          <p className="text-sm text-white/30">No automod rules configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                rule.is_enabled
                  ? 'border-white/10 bg-dark-700/50'
                  : 'border-white/5 bg-dark-800/50 opacity-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{rule.name}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40">
                    {typeLabel(rule.rule_type)}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40">
                    {actionLabel(rule.action)}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-xs text-white/30">{rule.pattern}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(rule)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rule.is_enabled ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'
                  }`}
                >
                  {rule.is_enabled ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => {
                    setEditingRule(rule);
                    setShowEditor(true);
                  }}
                  className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="rounded-lg p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

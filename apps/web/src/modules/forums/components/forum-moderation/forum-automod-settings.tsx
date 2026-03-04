/**
 * Forum Automod Settings Panel
 *
 * Word filter editor, link filter, spam thresholds, caps filter.
 *
 * @module modules/forums/components/forum-moderation/forum-automod-settings
 */
import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import toast from 'react-hot-toast';

const logger = createLogger('ForumAutomodSettings');

interface ForumAutomodSettingsProps {
  forumId: string;
}

interface AutomodRules {
  word_filter: {
    enabled: boolean;
    banned_words: string[];
    action: string;
  };
  link_filter: {
    enabled: boolean;
    whitelist: string[];
    blacklist: string[];
    block_all_links: boolean;
    action: string;
  };
  spam_detection: {
    enabled: boolean;
    max_posts_per_minute: number;
    max_duplicate_content: number;
    action: string;
  };
  caps_filter: {
    enabled: boolean;
    max_caps_percentage: number;
    min_length: number;
    action: string;
  };
}

const DEFAULT_RULES: AutomodRules = {
  word_filter: { enabled: false, banned_words: [], action: 'flag' },
  link_filter: {
    enabled: false,
    whitelist: [],
    blacklist: [],
    block_all_links: false,
    action: 'flag',
  },
  spam_detection: {
    enabled: false,
    max_posts_per_minute: 3,
    max_duplicate_content: 2,
    action: 'block',
  },
  caps_filter: { enabled: false, max_caps_percentage: 70, min_length: 10, action: 'flag' },
};

const ACTION_OPTIONS = [
  { value: 'flag', label: 'Flag for review' },
  { value: 'block', label: 'Block posting' },
  { value: 'shadow_ban', label: 'Shadow ban' },
];

/**
 * Automod rules editor for a forum.
 */
export default function ForumAutomodSettings({ forumId }: ForumAutomodSettingsProps) {
  const [rules, setRules] = useState<AutomodRules>(DEFAULT_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [domainInput, setDomainInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { api } = await import('@/lib/api');
        const response = await api.get(`/api/v1/forums/${forumId}/moderation/automod`);
        if (response.data?.data) {
          setRules({ ...DEFAULT_RULES, ...response.data.data });
        }
      } catch (error) {
        logger.error(error instanceof Error ? error : new Error(String(error)), 'loadAutomod');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [forumId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const { api } = await import('@/lib/api');
      await api.put(`/api/v1/forums/${forumId}/moderation/automod`, rules);
      toast.success('Automod rules saved');
    } catch (error) {
      logger.error(error instanceof Error ? error : new Error(String(error)), 'saveAutomod');
      toast.error('Failed to save automod rules');
    } finally {
      setIsSaving(false);
    }
  }, [forumId, rules]);

  const updateFilter = useCallback(
    <K extends keyof AutomodRules>(filter: K, updates: Partial<AutomodRules[K]>) => {
      setRules((prev) => ({
        ...prev,
        [filter]: { ...prev[filter], ...updates },
      }));
    },
    []
  );

  const addBannedWord = useCallback(() => {
    const word = wordInput.trim().toLowerCase();
    if (word && !rules.word_filter.banned_words.includes(word)) {
      updateFilter('word_filter', {
        banned_words: [...rules.word_filter.banned_words, word],
      });
      setWordInput('');
    }
  }, [wordInput, rules.word_filter.banned_words, updateFilter]);

  const removeBannedWord = useCallback(
    (word: string) => {
      updateFilter('word_filter', {
        banned_words: rules.word_filter.banned_words.filter((w) => w !== word),
      });
    },
    [rules.word_filter.banned_words, updateFilter]
  );

  const addBlacklistDomain = useCallback(() => {
    const domain = domainInput.trim().toLowerCase();
    if (domain && !rules.link_filter.blacklist.includes(domain)) {
      updateFilter('link_filter', {
        blacklist: [...rules.link_filter.blacklist, domain],
      });
      setDomainInput('');
    }
  }, [domainInput, rules.link_filter.blacklist, updateFilter]);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading automod settings…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Word Filter */}
      <FilterSection
        title="Word Filter"
        description="Block or flag posts containing banned words"
        enabled={rules.word_filter.enabled}
        onToggle={(v) => updateFilter('word_filter', { enabled: v })}
        action={rules.word_filter.action}
        onActionChange={(v) => updateFilter('word_filter', { action: v })}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addBannedWord()}
            placeholder="Add banned word…"
            className="flex-1 rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
          />
          <button
            onClick={addBannedWord}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        {rules.word_filter.banned_words.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {rules.word_filter.banned_words.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                {word}
                <button onClick={() => removeBannedWord(word)} className="hover:text-red-900">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </FilterSection>

      {/* Link Filter */}
      <FilterSection
        title="Link Filter"
        description="Control which links are allowed in posts"
        enabled={rules.link_filter.enabled}
        onToggle={(v) => updateFilter('link_filter', { enabled: v })}
        action={rules.link_filter.action}
        onActionChange={(v) => updateFilter('link_filter', { action: v })}
      >
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={rules.link_filter.block_all_links}
            onChange={(e) => updateFilter('link_filter', { block_all_links: e.target.checked })}
            className="h-4 w-4 rounded text-blue-600"
          />
          Block all links
        </label>
        {!rules.link_filter.block_all_links && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addBlacklistDomain()}
              placeholder="Add blacklisted domain…"
              className="flex-1 rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
            />
            <button
              onClick={addBlacklistDomain}
              className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        )}
      </FilterSection>

      {/* Spam Detection */}
      <FilterSection
        title="Spam Detection"
        description="Rate-limiting and duplicate content detection"
        enabled={rules.spam_detection.enabled}
        onToggle={(v) => updateFilter('spam_detection', { enabled: v })}
        action={rules.spam_detection.action}
        onActionChange={(v) => updateFilter('spam_detection', { action: v })}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Max posts per minute</label>
            <input
              type="number"
              value={rules.spam_detection.max_posts_per_minute}
              onChange={(e) =>
                updateFilter('spam_detection', {
                  max_posts_per_minute: Number(e.target.value),
                })
              }
              className="w-full rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Max duplicate content</label>
            <input
              type="number"
              value={rules.spam_detection.max_duplicate_content}
              onChange={(e) =>
                updateFilter('spam_detection', {
                  max_duplicate_content: Number(e.target.value),
                })
              }
              className="w-full rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
            />
          </div>
        </div>
      </FilterSection>

      {/* Caps Filter */}
      <FilterSection
        title="Caps Filter"
        description="Detect excessive capitalization"
        enabled={rules.caps_filter.enabled}
        onToggle={(v) => updateFilter('caps_filter', { enabled: v })}
        action={rules.caps_filter.action}
        onActionChange={(v) => updateFilter('caps_filter', { action: v })}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Max caps percentage</label>
            <input
              type="number"
              value={rules.caps_filter.max_caps_percentage}
              onChange={(e) =>
                updateFilter('caps_filter', { max_caps_percentage: Number(e.target.value) })
              }
              className="w-full rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Min text length to check</label>
            <input
              type="number"
              value={rules.caps_filter.min_length}
              onChange={(e) =>
                updateFilter('caps_filter', { min_length: Number(e.target.value) })
              }
              className="w-full rounded border p-2 text-sm dark:bg-white/[0.06] dark:border-white/[0.08]"
            />
          </div>
        </div>
      </FilterSection>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t dark:border-white/[0.08]">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save Automod Rules'}
        </button>
      </div>
    </div>
  );
}

// ── Filter Section Component ───────────────────────────────────────────

function FilterSection({
  title,
  description,
  enabled,
  onToggle,
  action,
  onActionChange,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  action: string;
  onActionChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4 dark:border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Action:</span>
            <select
              value={action}
              onChange={(e) => onActionChange(e.target.value)}
              className="rounded border px-2 py-1 text-xs dark:bg-white/[0.06] dark:border-white/[0.08]"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {children}
        </>
      )}
    </div>
  );
}

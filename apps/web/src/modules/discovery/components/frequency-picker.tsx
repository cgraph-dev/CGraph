/**
 * Frequency Picker — Multi-select topic grid with weight sliders
 *
 * Used in both onboarding and settings to configure discovery preferences.
 *
 * @module modules/discovery/components/frequency-picker
 */

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TopicCard } from './topic-card';
import { useTopics, useUserFrequencies, useUpdateFrequencies } from '../hooks/useFrequencies';
import type { Topic } from '../hooks/useFrequencies';

interface FrequencyEntry {
  topic_id: string;
  weight: number;
}

interface FrequencyPickerProps {
  className?: string;
  onSaved?: () => void;
}

/** Description. */
/** Frequency Picker component. */
export function FrequencyPicker({ className, onSaved }: FrequencyPickerProps) {
  const { data: topics = [], isLoading: topicsLoading } = useTopics();
  const { data: existing = [] } = useUserFrequencies();
  const updateMutation = useUpdateFrequencies();

  const [entries, setEntries] = useState<FrequencyEntry[]>([]);

  // Seed from existing frequencies
  useEffect(() => {
    if (existing.length > 0 && entries.length === 0) {
      setEntries(existing.map((f) => ({ topic_id: f.topic_id, weight: f.weight })));
    }
  }, [existing, entries.length]);

  const isSelected = useCallback(
    (topicId: string) => entries.some((e) => e.topic_id === topicId),
    [entries]
  );

  const toggleTopic = useCallback((topicId: string) => {
    setEntries((prev) => {
      if (prev.some((e) => e.topic_id === topicId)) {
        return prev.filter((e) => e.topic_id !== topicId);
      }
      return [...prev, { topic_id: topicId, weight: 50 }];
    });
  }, []);

  const setWeight = useCallback((topicId: string, weight: number) => {
    setEntries((prev) => prev.map((e) => (e.topic_id === topicId ? { ...e, weight } : e)));
  }, []);

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync(entries);
    onSaved?.();
  }, [entries, updateMutation, onSaved]);

  if (topicsLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/40">Loading topics...</div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Topic grid */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-white/60">
          Select topics you're interested in
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {topics.map((topic: Topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              selected={isSelected(topic.id)}
              onToggle={toggleTopic}
            />
          ))}
        </div>
      </div>

      {/* Weight sliders for selected topics */}
      {entries.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-white/60">Adjust interest levels</h3>
          <div className="space-y-3">
            {entries.map((entry) => {
              const topic = topics.find((t: Topic) => t.id === entry.topic_id);
              if (!topic) return null;
              return (
                <div key={entry.topic_id} className="flex items-center gap-3">
                  <span className="w-6 text-center">{topic.icon}</span>
                  <span className="w-24 truncate text-sm text-white/80">{topic.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={entry.weight}
                    onChange={(e) => setWeight(entry.topic_id, Number(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-indigo-500"
                  />
                  <span className="w-8 text-right text-xs text-white/40">{entry.weight}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={updateMutation.isPending || entries.length === 0}
        className={cn(
          'rounded-lg px-6 py-2.5 text-sm font-medium transition-all',
          entries.length > 0
            ? 'bg-indigo-500 text-white hover:bg-indigo-400'
            : 'cursor-not-allowed bg-white/5 text-white/30'
        )}
      >
        {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}

export default FrequencyPicker;

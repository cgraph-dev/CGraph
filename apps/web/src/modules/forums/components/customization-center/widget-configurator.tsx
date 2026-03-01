/**
 * Widget Configurator — Sidebar Widgets category
 *
 * Widget enable/disable toggles with drag-to-reorder,
 * per-widget visibility settings, and custom HTML widget.
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useCallback, useEffect } from 'react';
import {
  CheckIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  TrophyIcon,
  ChartPieIcon,
  CodeBracketIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

interface WidgetConfiguratorProps {
  options: Record<string, unknown>;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

interface WidgetConfig {
  key: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  optionKey: string;
}

const WIDGETS: WidgetConfig[] = [
  { key: 'statistics', label: 'Forum Statistics', icon: ChartBarIcon, optionKey: 'widget_statistics' },
  { key: 'recent_threads', label: 'Recent Threads', icon: ChatBubbleLeftRightIcon, optionKey: 'widget_recent_threads' },
  { key: 'online_users', label: 'Online Users', icon: UserGroupIcon, optionKey: 'widget_online_users' },
  { key: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon, optionKey: 'widget_leaderboard' },
  { key: 'poll', label: 'Active Poll', icon: ChartPieIcon, optionKey: 'widget_poll' },
  { key: 'custom_html', label: 'Custom HTML', icon: CodeBracketIcon, optionKey: 'widget_custom_html' },
];

export function WidgetConfigurator({ options, onSave, saving }: WidgetConfiguratorProps) {
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [widgetOrder, setWidgetOrder] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    setDraft({ ...options });
    const order = (options.widget_order as string[]) ?? WIDGETS.map((w) => w.key);
    setWidgetOrder(order);
  }, [options]);

  const toggleWidget = useCallback((optionKey: string) => {
    setDraft((prev) => ({ ...prev, [optionKey]: !prev[optionKey] }));
  }, []);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    setWidgetOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved!);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((key: string) => {
    setDraggedItem(key);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem !== targetKey) {
      const fromIndex = widgetOrder.indexOf(draggedItem);
      const toIndex = widgetOrder.indexOf(targetKey);
      if (fromIndex !== -1 && toIndex !== -1) {
        moveWidget(fromIndex, toIndex);
      }
    }
  }, [draggedItem, widgetOrder, moveWidget]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleSave = useCallback(() => {
    onSave({ ...draft, widget_order: widgetOrder });
  }, [draft, widgetOrder, onSave]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/50">
        Enable, disable, and reorder sidebar widgets. Drag to reorder.
      </p>

      {/* Widget List */}
      <div className="space-y-2">
        {widgetOrder.map((key) => {
          const widget = WIDGETS.find((w) => w.key === key);
          if (!widget) return null;
          const Icon = widget.icon;
          const enabled = draft[widget.optionKey] as boolean;

          return (
            <div
              key={key}
              draggable
              onDragStart={() => handleDragStart(key)}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-move ${
                enabled
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white/[0.02] border-white/5 opacity-50'
              } ${draggedItem === key ? 'ring-2 ring-blue-500' : ''}`}
            >
              <ArrowsUpDownIcon className="w-4 h-4 text-white/30 flex-shrink-0" />
              <Icon className="w-5 h-5 text-white/60 flex-shrink-0" />
              <span className="flex-1 text-sm text-white/80">{widget.label}</span>
              <button
                onClick={() => toggleWidget(widget.optionKey)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  enabled ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Widget Visibility */}
      <div>
        <h4 className="text-sm font-semibold text-white/80 mb-2">Widget Visibility</h4>
        <div className="flex gap-4">
          {['guests', 'members', 'mods'].map((role) => {
            const visibility = (draft.widget_visibility as Record<string, boolean>) ?? {};
            const enabled = visibility[role] !== false;
            return (
              <div key={role} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = (draft.widget_visibility as Record<string, boolean>) ?? {};
                    setDraft((prev) => ({
                      ...prev,
                      widget_visibility: { ...current, [role]: !enabled },
                    }));
                  }}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    enabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                      enabled ? 'left-4' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-xs text-white/60 capitalize">{role}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <CheckIcon className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Widgets'}
        </button>
      </div>
    </div>
  );
}

export default WidgetConfigurator;

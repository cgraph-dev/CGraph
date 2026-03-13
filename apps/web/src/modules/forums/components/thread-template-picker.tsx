/**
 * ThreadTemplatePicker Component
 *
 * Grid/list of thread templates for a forum with preview and apply functionality.
 *
 * Features:
 * - Grid/list view toggle
 * - Preview section showing template structure
 * - Apply button to fill editor with template content
 *
 * @module modules/forums/components/thread-template-picker
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DocumentTextIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface TemplateSection {
  heading: string;
  placeholder?: string;
}

interface ThreadTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sections: TemplateSection[];
  /** Raw content to insert into editor */
  content: string;
}

interface ThreadTemplatePickerProps {
  forumId: string;
  templates: ThreadTemplate[];
  /** Called when user applies a template */
  onApply: (template: ThreadTemplate) => void;
  className?: string;
}

// ── Component ──────────────────────────────────────────────────────────

/** Thread Template Picker component. */
export default function ThreadTemplatePicker({
  forumId: _forumId,
  templates,
  onApply,
  className,
}: ThreadTemplatePickerProps) {
  void _forumId;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const previewTemplate = templates.find((t) => t.id === previewId);

  const handleApply = (template: ThreadTemplate) => {
    onApply(template);
    setAppliedId(template.id);
    // Reset after brief visual feedback
    setTimeout(() => setAppliedId(null), 1500);
  };

  if (templates.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 text-center',
          className
        )}
      >
        <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-600" />
        <p className="mt-2 text-sm text-gray-500">No templates available for this forum</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.03] p-4', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-sm font-bold text-white">Thread Templates</h3>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-gray-500">
            {templates.length}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-white/[0.08] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-white/[0.1] text-white'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-white/[0.1] text-white'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Template Grid / List */}
      <div
        className={cn(viewMode === 'grid' ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'space-y-2')}
      >
        {templates.map((template) => {
          const isApplied = appliedId === template.id;
          const isPreviewing = previewId === template.id;

          return (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.01 }}
              className={cn(
                'group relative rounded-lg border p-3 transition-all',
                isPreviewing
                  ? 'border-primary-500/40 bg-primary-600/10'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
              )}
            >
              <div className={cn(viewMode === 'list' ? 'flex items-center gap-3' : '')}>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-white">{template.name}</h4>
                  {template.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-1 text-[10px] text-gray-600">
                    {template.sections.length} section{template.sections.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className={cn('flex gap-1.5', viewMode === 'grid' ? 'mt-2' : 'flex-shrink-0')}>
                  <button
                    type="button"
                    onClick={() => setPreviewId(isPreviewing ? null : template.id)}
                    className="rounded-md px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <EyeIcon className="inline h-3.5 w-3.5" />
                  </button>

                  <motion.button
                    type="button"
                    onClick={() => handleApply(template)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all',
                      isApplied
                        ? 'bg-green-600 text-white'
                        : 'bg-primary-600 text-white hover:bg-primary-500'
                    )}
                  >
                    {isApplied ? (
                      <span className="flex items-center gap-1">
                        <CheckIcon className="h-3 w-3" /> Applied
                      </span>
                    ) : (
                      'Apply'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02]"
          >
            <div className="border-b border-white/[0.06] px-4 py-2">
              <span className="text-xs font-semibold text-gray-400">
                Preview: {previewTemplate.name}
              </span>
            </div>

            <div className="space-y-3 p-4">
              {previewTemplate.sections.map((section, i) => (
                <div key={i}>
                  <h5 className="mb-1 text-xs font-bold text-primary-400">{section.heading}</h5>
                  <div className="rounded border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs italic text-gray-500">
                    {section.placeholder ?? 'Enter content here…'}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/[0.06] px-4 py-2">
              <motion.button
                type="button"
                onClick={() => handleApply(previewTemplate)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-500"
              >
                Use This Template
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Post Composer — Rich text thread creation form
 *
 * Features:
 * - Toolbar: bold, italic, strikethrough, code, quote, lists, heading, link, image, mention
 * - Markdown preview toggle (side-by-side on desktop)
 * - Image upload with previews
 * - Tag selector (multi-select)
 * - Poll creation toggle
 * - Title field (required, max 120 chars)
 * - Submit + Draft buttons
 * - Character count
 *
 * @module modules/forums/components/post-composer
 */

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BoldIcon,
  ItalicIcon,
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  PhotoIcon,
  AtSymbolIcon,
  EyeIcon,
  PencilIcon,
  ChartBarIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  label: string;
  color: string;
}

interface PollOption {
  id: string;
  text: string;
}

interface PostComposerProps {
  boardId?: string;
  availableTags?: Tag[];
  onSubmit?: (data: {
    title: string;
    content: string;
    tags: string[];
    poll?: { options: string[]; multiVote: boolean };
  }) => void;
  onSaveDraft?: () => void;
  className?: string;
}

// ── Toolbar Button ─────────────────────────────────────────────────────

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={label}
      className={cn(
        'rounded p-1.5 transition-colors',
        active ? 'bg-primary-600/20 text-primary-400' : 'text-gray-500 hover:bg-white/[0.06] hover:text-gray-300',
      )}
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  );
}

// ── Strikethrough Icon (custom) ────────────────────────────────────────

function StrikethroughIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M16 4H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H8" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

function HeadingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M6 4v16M18 4v16M6 12h12" />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function PostComposer({
  availableTags = [],
  onSubmit,
  onSaveDraft,
  className,
}: PostComposerProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ]);
  const [multiVote, setMultiVote] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_TITLE = 120;
  const MAX_CONTENT = 10000;

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = '') => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = content.substring(start, end);
      const newText =
        content.substring(0, start) + prefix + selected + suffix + content.substring(end);
      setContent(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 0);
    },
    [content],
  );

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }, []);

  const addPollOption = useCallback(() => {
    if (pollOptions.length >= 10) return;
    setPollOptions((prev) => [...prev, { id: String(Date.now()), text: '' }]);
  }, [pollOptions.length]);

  const removePollOption = useCallback((id: string) => {
    if (pollOptions.length <= 2) return;
    setPollOptions((prev) => prev.filter((o) => o.id !== id));
  }, [pollOptions.length]);

  const updatePollOption = useCallback((id: string, text: string) => {
    setPollOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim()) return;
    const poll = showPoll
      ? { options: pollOptions.map((o) => o.text).filter(Boolean), multiVote }
      : undefined;
    onSubmit?.({
      title: title.trim(),
      content: content.trim(),
      tags: [...selectedTags],
      poll,
    });
  }, [title, content, selectedTags, showPoll, pollOptions, multiVote, onSubmit]);

  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.03]', className)}>
      {/* Title */}
      <div className="border-b border-white/[0.04] p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
          placeholder="Thread title..."
          className="w-full bg-transparent text-lg font-bold text-white placeholder-gray-600 outline-none"
        />
        <div className="mt-1 text-right text-[10px] text-gray-600">
          {title.length}/{MAX_TITLE}
        </div>
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-white/[0.04] px-4 py-2">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all',
                selectedTags.has(tag.id) ? 'ring-1 ring-white/20' : 'opacity-50 hover:opacity-100',
              )}
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.label}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/[0.04] px-3 py-1.5">
        <ToolButton icon={BoldIcon} label="Bold" onClick={() => insertMarkdown('**', '**')} />
        <ToolButton icon={ItalicIcon} label="Italic" onClick={() => insertMarkdown('*', '*')} />
        <ToolButton icon={StrikethroughIcon} label="Strikethrough" onClick={() => insertMarkdown('~~', '~~')} />
        <div className="mx-1 h-4 w-px bg-white/[0.06]" />
        <ToolButton icon={HeadingIcon} label="Heading" onClick={() => insertMarkdown('## ')} />
        <ToolButton icon={CodeBracketIcon} label="Code" onClick={() => insertMarkdown('`', '`')} />
        <ToolButton icon={ChatBubbleBottomCenterTextIcon} label="Quote" onClick={() => insertMarkdown('> ')} />
        <div className="mx-1 h-4 w-px bg-white/[0.06]" />
        <ToolButton icon={ListBulletIcon} label="Bullet List" onClick={() => insertMarkdown('- ')} />
        <ToolButton icon={NumberedListIcon} label="Numbered List" onClick={() => insertMarkdown('1. ')} />
        <div className="mx-1 h-4 w-px bg-white/[0.06]" />
        <ToolButton icon={LinkIcon} label="Link" onClick={() => insertMarkdown('[', '](url)')} />
        <ToolButton icon={PhotoIcon} label="Image" onClick={() => insertMarkdown('![alt](', ')')} />
        <ToolButton icon={AtSymbolIcon} label="Mention" onClick={() => insertMarkdown('@')} />

        <div className="flex-1" />

        <ToolButton
          icon={ChartBarIcon}
          label="Add Poll"
          onClick={() => setShowPoll((p) => !p)}
          active={showPoll}
        />
        <button
          onClick={() => setShowPreview((p) => !p)}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            showPreview ? 'bg-primary-600/20 text-primary-400' : 'text-gray-500 hover:text-gray-300',
          )}
        >
          {showPreview ? <PencilIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Content area */}
      <div className={cn('flex', showPreview ? 'min-h-[300px]' : '')}>
        {/* Editor */}
        {!showPreview && (
          <div className="flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              placeholder="Write your thread content... (Markdown supported)"
              className="min-h-[250px] w-full resize-none bg-transparent text-sm leading-relaxed text-gray-300 placeholder-gray-600 outline-none"
            />
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="flex-1 border-l border-white/[0.04] p-4">
            <div className="prose prose-invert prose-sm max-w-none text-gray-300">
              {content || <span className="text-gray-600">Nothing to preview</span>}
            </div>
          </div>
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 border-t border-white/[0.04] px-4 py-2">
          {images.map((img, i) => (
            <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5"
              >
                <XMarkIcon className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Poll creator */}
      <AnimatePresence>
        {showPoll && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snappy}
            className="overflow-hidden border-t border-white/[0.04]"
          >
            <div className="space-y-2 p-4">
              <h4 className="text-xs font-bold text-gray-300">Poll Options</h4>
              {pollOptions.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs text-gray-600">{i + 1}.</span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updatePollOption(opt.id, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:bg-white/[0.06]"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOption(opt.id)}
                      className="rounded p-1 text-gray-600 hover:text-red-400"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                {pollOptions.length < 10 && (
                  <button
                    onClick={addPollOption}
                    className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Add Option
                  </button>
                )}
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={multiVote}
                    onChange={(e) => setMultiVote(e.target.checked)}
                    className="rounded"
                  />
                  Allow multiple votes
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-3">
        <span className="text-[10px] text-gray-600">
          {content.length}/{MAX_CONTENT}
        </span>
        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <button
              onClick={onSaveDraft}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/[0.04] hover:text-gray-300"
            >
              Save Draft
            </button>
          )}
          <motion.button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white',
              (!title.trim() || !content.trim()) && 'cursor-not-allowed opacity-40',
            )}
          >
            Post Thread
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default PostComposer;

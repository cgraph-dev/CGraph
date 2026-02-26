/**
 * Rich text post editor component.
 * @module
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, PaperClipIcon } from '@heroicons/react/24/outline';

import { GlassCard } from '@/shared/components/ui';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';

import { usePostEditor } from './usePostEditor';
import { EditorToolbar } from './editor-toolbar';
import { ContentPreview } from './content-preview';
import { PollCreator } from './poll-creator';
import { AttachmentsList } from './attachments-list';
import { EditorActions } from './editor-actions';
import type { PostEditorProps } from './types';

/**
 * PostEditor Component
 *
 * Rich text editor for creating forum posts with:
 * - Markdown/BBCode support
 * - Live preview
 * - File attachments with drag & drop
 * - Thread prefix selection
 * - Category selection
 * - Poll creation
 * - Autosave drafts
 * - Character count
 */
export function PostEditor({
  initialTitle = '',
  initialContent = '',
  initialCategory,
  initialPrefix,
  prefixes = [],
  categories = [],
  maxTitleLength = 300,
  maxContentLength = 40000,
  allowPoll = true,
  allowAttachments = true,
  allowNsfw = true,
  onSubmit,
  onCancel,
  onSaveDraft,
  submitLabel = 'Post',
  isEditing: _isEditing = false,
  className = '',
}: PostEditorProps) {
  void _isEditing;
  const { theme } = useThemeStore();
  const primaryColor = THEME_COLORS[theme.colorPreset]?.primary || '#10B981';

  const editor = usePostEditor({
    initialTitle,
    initialContent,
    initialCategory,
    initialPrefix,
    maxTitleLength,
    maxContentLength,
    onSubmit,
    onSaveDraft,
  });

  return (
    <div className={className}>
      <GlassCard variant="frosted" className="overflow-hidden">
        {/* Title Input */}
        <div className="border-b border-dark-700 p-4">
          <div className="mb-3 flex gap-3">
            {/* Prefix Selector */}
            {prefixes.length > 0 && (
              <div className="relative">
                <select
                  value={editor.prefixId || ''}
                  onChange={(e) => editor.setPrefixId(e.target.value || undefined)}
                  className="appearance-none rounded-lg bg-dark-700 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2"
                  style={
                     
                    {
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties /* safe downcast – CSS custom property */
                  }
                >
                  <option value="">No Prefix</option>
                  {prefixes.map((prefix) => (
                    <option key={prefix.id} value={prefix.id}>
                      {prefix.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            )}

            {/* Category Selector */}
            {categories.length > 0 && (
              <div className="relative">
                <select
                  value={editor.categoryId || ''}
                  onChange={(e) => editor.setCategoryId(e.target.value || undefined)}
                  className="appearance-none rounded-lg bg-dark-700 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2"
                  style={
                     
                    {
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties /* safe downcast – CSS custom property */
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            )}
          </div>

          <input
            type="text"
            value={editor.title}
            onChange={(e) => editor.setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full bg-transparent text-xl font-semibold placeholder-gray-500 outline-none"
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {editor.title.length}/{maxTitleLength}
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar
          isPreview={editor.isPreview}
          setIsPreview={editor.setIsPreview}
          onInsertFormatting={editor.insertFormatting}
        />

        {/* Content Area */}
        <div
          className={`relative ${editor.isDragging ? 'ring-2' : ''}`}
          style={
             
            {
              '--tw-ring-color': primaryColor,
            } as React.CSSProperties /* safe downcast – CSS custom property */
          }
          onDrop={editor.handleDrop}
          onDragOver={editor.handleDragOver}
          onDragLeave={editor.handleDragLeave}
        >
          <AnimatePresence mode="wait">
            {editor.isPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ContentPreview title={editor.title} content={editor.content} />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <textarea
                  ref={editor.contentRef}
                  value={editor.content}
                  onChange={(e) => editor.setContent(e.target.value)}
                  placeholder="Write your post content here... (Markdown supported)"
                  className="min-h-[300px] w-full resize-y bg-transparent p-4 placeholder-gray-500 outline-none"
                  style={{ fontFamily: 'inherit' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drag Overlay */}
          <AnimatePresence>
            {editor.isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-dark-800/90"
              >
                <div className="text-center">
                  <PaperClipIcon
                    className="mx-auto mb-2 h-12 w-12"
                    style={{ color: primaryColor }}
                  />
                  <p className="text-lg font-medium">Drop files to attach</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Character Count */}
        <div className="border-t border-dark-700 px-4 py-2 text-right text-xs text-gray-500">
          {editor.content.length.toLocaleString()}/{maxContentLength.toLocaleString()} characters
          {editor.lastSaved && (
            <span className="ml-4">Auto-saved at {editor.lastSaved.toLocaleTimeString()}</span>
          )}
        </div>

        {/* Attachments */}
        <AttachmentsList attachments={editor.attachments} onRemove={editor.removeAttachment} />

        {/* Poll Creator */}
        <AnimatePresence>
          {editor.showPollCreator && (
            <PollCreator
              pollQuestion={editor.pollQuestion}
              setPollQuestion={editor.setPollQuestion}
              pollOptions={editor.pollOptions}
              addPollOption={editor.addPollOption}
              removePollOption={editor.removePollOption}
              updatePollOption={editor.updatePollOption}
              pollAllowMultiple={editor.pollAllowMultiple}
              setPollAllowMultiple={editor.setPollAllowMultiple}
              pollDuration={editor.pollDuration}
              setPollDuration={editor.setPollDuration}
              onClose={() => editor.setShowPollCreator(false)}
              primaryColor={primaryColor}
            />
          )}
        </AnimatePresence>

        {/* Actions */}
        <input
          ref={editor.fileInputRef}
          type="file"
          multiple
          onChange={editor.handleFileSelect}
          className="hidden"
        />
        <EditorActions
          allowAttachments={allowAttachments}
          allowPoll={allowPoll}
          allowNsfw={allowNsfw}
          showPollCreator={editor.showPollCreator}
          isNsfw={editor.isNsfw}
          setIsNsfw={editor.setIsNsfw}
          setShowPollCreator={editor.setShowPollCreator}
          isSubmitting={editor.isSubmitting}
          canSubmit={editor.canSubmit}
          onSubmit={editor.handleSubmit}
          onCancel={onCancel}
          onFileSelect={() => editor.fileInputRef.current?.click()}
          submitLabel={submitLabel}
          primaryColor={primaryColor}
        />
      </GlassCard>
    </div>
  );
}

export default PostEditor;

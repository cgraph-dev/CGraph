/**
 * NicknameEditor — inline edit for friend display nickname.
 * @module modules/social/components/nickname-editor
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui';

interface NicknameEditorProps {
  readonly friendId: string;
  readonly currentNickname?: string;
  readonly onSave: (friendId: string, nickname: string) => void;
  readonly className?: string;
}

/**
 * Pencil icon that opens inline text input for editing a friend nickname.
 */
export function NicknameEditor({
  friendId,
  currentNickname = '',
  onSave,
  className,
}: NicknameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentNickname);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = value.trim();
    onSave(friendId, trimmed);
    setIsEditing(false);
  }, [friendId, value, onSave]);

  const handleCancel = useCallback(() => {
    setValue(currentNickname);
    setIsEditing(false);
  }, [currentNickname]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          maxLength={32}
          placeholder="Nickname..."
          className={cn(
            'h-6 w-28 rounded border border-white/10 bg-white/[0.04] px-1.5',
            'text-xs text-white/80 outline-none placeholder:text-white/20',
            'focus:border-blue-400/50'
          )}
        />
        <button
          type="button"
          onClick={handleSave}
          className="flex h-5 w-5 items-center justify-center rounded text-green-400 hover:bg-green-400/20"
          aria-label="Save nickname"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex h-5 w-5 items-center justify-center rounded text-white/30 hover:bg-white/[0.08] hover:text-white/60"
          aria-label="Cancel editing"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <Tooltip content={currentNickname ? 'Edit nickname' : 'Set nickname'} side="top">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
          'text-white/30 hover:bg-white/[0.08] hover:text-white/60',
          className
        )}
        aria-label={currentNickname ? 'Edit nickname' : 'Set nickname'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </Tooltip>
  );
}

export default NicknameEditor;

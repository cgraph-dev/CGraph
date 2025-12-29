import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Tag {
  id: string;
  label: string;
}

interface TagInputProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  suggestions?: Tag[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export default function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Add tag...',
  maxTags,
  className = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some((t) => t.id === s.id)
  );

  const addTag = (tag: Tag) => {
    if (maxTags && tags.length >= maxTags) return;
    if (!tags.some((t) => t.id === tag.id)) {
      onChange([...tags, tag]);
    }
    setInputValue('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagId: string) => {
    onChange(tags.filter((t) => t.id !== tagId));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (filteredSuggestions.length > 0 && filteredSuggestions[activeSuggestion]) {
        addTag(filteredSuggestions[activeSuggestion]);
      } else {
        addTag({ id: inputValue.toLowerCase().replace(/\s+/g, '-'), label: inputValue.trim() });
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag) removeTag(lastTag.id);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    setActiveSuggestion(0);
  }, [inputValue]);

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 p-2 bg-dark-700 border border-dark-600 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 px-2 py-1 bg-primary-600/20 text-primary-400 rounded-md text-sm"
          >
            {tag.label}
            <button
              onClick={() => removeTag(tag.id)}
              className="hover:text-primary-300 transition-colors"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] bg-transparent text-white placeholder-gray-500 outline-none text-sm"
          disabled={maxTags !== undefined && tags.length >= maxTags}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => addTag(suggestion)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                index === activeSuggestion
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-300 hover:bg-dark-700'
              }`}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      {maxTags && (
        <p className="text-xs text-gray-500 mt-1">
          {tags.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
}

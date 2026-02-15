import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

/**
 * Gets border color class based on error and open state.
 */
function getBorderClass(hasError: boolean, isOpen: boolean): string {
  if (hasError) return 'border-red-500';
  if (isOpen) return 'border-primary-500';
  return 'border-dark-600';
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  searchable = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchable
    ? options.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && <label className="mb-2 block text-sm font-medium text-gray-300">{label}</label>}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border bg-dark-700 px-4 py-2.5 text-left transition-colors ${getBorderClass(!!error, isOpen)} ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-dark-500'}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon}
          <span className={selectedOption ? 'truncate text-white' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-hidden rounded-lg border border-dark-600 bg-dark-800 shadow-xl">
          {searchable && (
            <div className="border-b border-dark-600 p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-dark-600 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-dark-700 ${
                    option.value === value ? 'bg-dark-700' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {option.icon}
                    <div className="min-w-0">
                      <span className="block truncate text-sm text-white">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs text-gray-500">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                  {option.value === value && <CheckIcon className="h-4 w-4 text-primary-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

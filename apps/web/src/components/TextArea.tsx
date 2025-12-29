import { forwardRef, TextareaHTMLAttributes, useState, useEffect, useRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoResize?: boolean;
  maxRows?: number;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, autoResize = false, maxRows = 10, className = '', ...props }, ref) => {
    const [height, setHeight] = useState<string | undefined>(undefined);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
        const maxHeight = lineHeight * maxRows;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        setHeight(`${newHeight}px`);
      }
    }, [props.value, autoResize, maxRows]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        )}
        <textarea
          ref={setRefs}
          className={`w-full px-4 py-3 bg-dark-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all ${
            error ? 'border-red-500' : 'border-dark-600'
          } ${className}`}
          style={autoResize ? { height, overflow: height ? 'hidden' : 'auto' } : undefined}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;

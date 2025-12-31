import { useState, useRef, ChangeEvent } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  className?: string;
  children?: React.ReactNode;
}

export default function FileUpload({
  onUpload,
  accept = 'image/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
  children,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize) {
      setError(`File ${file.name} is too large. Max size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const validFiles: File[] = [];
    const newPreviews: { file: File; url: string }[] = [];

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file);
        if (file.type.startsWith('image/')) {
          newPreviews.push({ file, url: URL.createObjectURL(file) });
        }
      }
    });

    if (validFiles.length > 0) {
      setPreviews((prev) => (multiple ? [...prev, ...newPreviews] : newPreviews));
      onUpload(validFiles);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev];
      const toRemove = newPreviews[index];
      if (toRemove) {
        URL.revokeObjectURL(toRemove.url);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      {children ? (
        <div onClick={() => inputRef.current?.click()}>{children}</div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-primary-500 bg-primary-500/10 scale-[1.02] shadow-lg shadow-primary-500/20'
              : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50 hover:shadow-md'
          }`}
        >
          <PhotoIcon className="h-10 w-10 mx-auto text-gray-500 mb-2" />
          <p className="text-sm text-gray-400">
            <span className="text-primary-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {previews.map((preview, idx) => (
            <div key={preview.url} className="relative animate-scaleIn" style={{ animationDelay: `${idx * 50}ms` }}>
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-20 w-20 rounded-lg object-cover ring-2 ring-transparent hover:ring-primary-500 transition-all duration-200"
              />
              <button
                onClick={() => removePreview(idx)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center transform hover:scale-110 transition-transform"
              >
                <XMarkIcon className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

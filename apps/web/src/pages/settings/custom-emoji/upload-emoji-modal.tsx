/**
 * Custom emoji upload modal dialog.
 * @module
 */
import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UploadEmojiModalProps {
  onClose: () => void;
}

/**
 * Upload Emoji Modal dialog component.
 */
export default function UploadEmojiModal({ onClose }: UploadEmojiModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', name);
      formData.append('shortcode', shortcode.replace(/[^a-z0-9_]/g, ''));
      await api.post('/api/v1/emojis/custom', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-emojis'] });
      onClose();
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    // type assertion: FileReader.result is string when readAsDataURL() is used
     
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);

    // Auto-fill name from filename
    if (!name) {
      setName(selected.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
    }
    if (!shortcode) {
      setShortcode(
        selected.name
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
      );
    }
  };

  const canSubmit = name.trim() && shortcode.trim() && file && !uploadMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-dark-800 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Upload Custom Emoji</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 hover:bg-dark-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload area */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-4 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-dark-600 p-8 transition-colors hover:border-emerald-500/50"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-contain" />
          ) : (
            <>
              <Upload className="mb-2 h-8 w-8 text-white/30" />
              <span className="text-sm text-white/50">Click to upload image</span>
              <span className="mt-1 text-xs text-white/30">PNG, GIF, WEBP — max 256KB</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Fields */}
        <div className="mb-3">
          <label htmlFor="emoji-name" className="mb-1 block text-xs font-medium text-white/60">
            Name
          </label>
          <input
            id="emoji-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Party Parrot"
            className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="emoji-shortcode" className="mb-1 block text-xs font-medium text-white/60">
            Shortcode
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-white/40">:</span>
            <input
              id="emoji-shortcode"
              type="text"
              value={shortcode}
              onChange={(e) =>
                setShortcode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
              }
              placeholder="party_parrot"
              className="w-full rounded-lg bg-dark-700 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-sm text-white/40">:</span>
          </div>
        </div>

        {/* Error */}
        {uploadMutation.isError && (
          <p className="mb-4 text-sm text-red-400">Upload failed. Please try again.</p>
        )}

        {/* Submit */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => uploadMutation.mutate()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload Emoji
        </button>
      </div>
    </div>
  );
}

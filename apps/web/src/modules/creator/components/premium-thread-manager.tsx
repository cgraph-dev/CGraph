/**
 * PremiumThreadManager
 *
 * CRUD interface for managing creator premium threads.
 * Create new premium threads or edit existing ones.
 *
 * @module modules/creator/components/premium-thread-manager
 */

import { useCallback, useEffect, useState } from 'react';
import { creatorService } from '../services/creatorService';

// ── Types ──────────────────────────────────────────────────────────────

interface PremiumThread {
  id: string;
  threadId: string;
  priceNodes: number;
  subscriberOnly: boolean;
  previewLength: number;
  title?: string;
}

interface FormData {
  threadId: string;
  priceNodes: number;
  subscriberOnly: boolean;
  previewLength: number;
}

const EMPTY_FORM: FormData = {
  threadId: '',
  priceNodes: 50,
  subscriberOnly: false,
  previewLength: 200,
};

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Premium Thread Manager component. */
export function PremiumThreadManager() {
  const [threads, setThreads] = useState<PremiumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await creatorService.listPremiumThreads();
      setThreads(data);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleEdit = useCallback((thread: PremiumThread) => {
    setForm({
      threadId: thread.threadId,
      priceNodes: thread.priceNodes,
      subscriberOnly: thread.subscriberOnly,
      previewLength: thread.previewLength,
    });
    setEditingId(thread.id);
    setShowForm(true);
  }, []);

  const handleCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSaving(true);
    try {
      await creatorService.createPremiumThread({
        threadId: form.threadId,
        priceNodes: form.priceNodes,
        subscriberOnly: form.subscriberOnly,
        previewLength: form.previewLength,
      });
      setShowForm(false);
      setEditingId(null);
      await loadThreads();
    } catch {
      /* ignore */
    } finally {
      setIsSaving(false);
    }
  }, [form, loadThreads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thread list */}
      {threads.length === 0 ? (
        <p className="text-muted-foreground text-sm">No premium threads yet.</p>
      ) : (
        <div className="divide-border border-border divide-y rounded-lg border">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t.title ?? t.threadId}</p>
                <p className="text-muted-foreground text-xs">
                  {t.priceNodes} Nodes · Preview: {t.previewLength} chars
                  {t.subscriberOnly && ' · Subscriber only'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleEdit(t)}
                className="border-border hover:bg-muted rounded-md border px-3 py-1 text-xs font-medium"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Create */}
      {!showForm && (
        <button
          type="button"
          onClick={handleCreate}
          className="text-primary-foreground rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          + New Premium Thread
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="border-border bg-card space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'Create'} Premium Thread</h3>

          {/* Thread ID */}
          <div>
            <label htmlFor="pt-thread-id" className="mb-1 block text-sm font-medium">
              Thread ID
            </label>
            <input
              id="pt-thread-id"
              type="text"
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.threadId}
              onChange={(e) => setForm((f) => ({ ...f, threadId: e.target.value }))}
              disabled={!!editingId}
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="pt-price" className="mb-1 block text-sm font-medium">
              Price (Nodes)
            </label>
            <input
              id="pt-price"
              type="number"
              min={1}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              value={form.priceNodes}
              onChange={(e) =>
                setForm((f) => ({ ...f, priceNodes: Math.max(1, Number(e.target.value)) }))
              }
            />
          </div>

          {/* Subscriber only */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={form.subscriberOnly}
              onChange={(e) => setForm((f) => ({ ...f, subscriberOnly: e.target.checked }))}
            />
            <span className="text-sm">Subscriber only</span>
          </label>

          {/* Preview length */}
          <div>
            <label htmlFor="pt-preview" className="mb-1 block text-sm font-medium">
              Preview length: {form.previewLength} characters
            </label>
            <input
              id="pt-preview"
              type="range"
              min={0}
              max={1000}
              step={50}
              className="w-full"
              value={form.previewLength}
              onChange={(e) => setForm((f) => ({ ...f, previewLength: Number(e.target.value) }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isSaving || !form.threadId}
              onClick={handleSubmit}
              className="text-primary-foreground rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="border-border hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

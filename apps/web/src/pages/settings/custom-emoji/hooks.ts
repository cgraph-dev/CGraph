/**
 * Custom emoji management hooks.
 * @module
 */
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CustomEmoji, EmojiCategory } from './types';

const FALLBACK_EMOJIS: CustomEmoji[] = [
  {
    id: '1',
    name: 'Party Parrot',
    shortcode: 'party_parrot',
    imageUrl: '/emojis/party_parrot.gif',
    category: 'reactions',
    createdBy: 'admin',
    usageCount: 1247,
    isAnimated: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Pepe Laugh',
    shortcode: 'pepe_laugh',
    imageUrl: '/emojis/pepe_laugh.png',
    category: 'memes',
    createdBy: 'admin',
    usageCount: 892,
    isAnimated: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Thumbs Up',
    shortcode: 'thumbsup_custom',
    imageUrl: '/emojis/thumbsup.png',
    category: 'reactions',
    createdBy: 'admin',
    usageCount: 2103,
    isAnimated: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Blob Wave',
    shortcode: 'blob_wave',
    imageUrl: '/emojis/blob_wave.gif',
    category: 'people',
    createdBy: 'admin',
    usageCount: 456,
    isAnimated: true,
    createdAt: new Date().toISOString(),
  },
];

const CATEGORIES: { value: EmojiCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reactions', label: 'Reactions' },
  { value: 'memes', label: 'Memes' },
  { value: 'people', label: 'People' },
  { value: 'custom', label: 'Custom' },
];

export { CATEGORIES };

export function useCustomEmoji() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<EmojiCategory>('all');
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: emojis = FALLBACK_EMOJIS, isLoading } = useQuery({
    queryKey: ['custom-emojis'],
    queryFn: async () => {
      const res = await api.get('/api/v1/emojis/custom');
      return res.data.data as CustomEmoji[]; // safe downcast – API response field
    },
    retry: 1,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (emojiId: string) => {
      await api.delete(`/api/v1/emojis/custom/${emojiId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-emojis'] });
    },
  });

  const filteredEmojis = useMemo(() => {
    let result = emojis;
    if (category !== 'all') {
      result = result.filter((e) => e.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.shortcode.toLowerCase().includes(q)
      );
    }
    return result;
  }, [emojis, category, search]);

  const deleteEmoji = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation]);

  return {
    emojis: filteredEmojis,
    totalCount: emojis.length,
    category,
    setCategory,
    search,
    setSearch,
    showUploadModal,
    setShowUploadModal,
    deleteEmoji,
    isLoading,
    isDeleting: deleteMutation.isPending,
  };
}

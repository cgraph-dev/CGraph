/**
 * useChatIdentity — fetches a user's equipped cosmetics for chat display.
 *
 * Uses the shared api client to fetch the user's cosmetic inventory,
 * then extracts equipped border, title, and badges.
 *
 * @module modules/chat/hooks/useChatIdentity
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────

interface Border {
  id: string;
  name: string;
  border_style: string;
  primaryColor: string;
  rarity: string;
}

interface Title {
  id: string;
  name: string;
  text: string;
  color: string;
  rarity: string;
}

interface Badge {
  id: string;
  name: string;
  icon_url: string;
  rarity: string;
}

interface InventoryItem {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  equipped_at: string | null;
  obtained_at: string;
  obtained_via: string;
  item_data?: Record<string, unknown>;
}

interface ChatIdentity {
  border: Border | null;
  title: Title | null;
  badges: Badge[];
  isLoading: boolean;
}

// ── Type Guards ────────────────────────────────────────────────────────

function isBorder(data: Record<string, unknown>): data is Record<string, unknown> & Border {
  return typeof data['border_style'] === 'string' && typeof data['primaryColor'] === 'string';
}

function isTitle(data: Record<string, unknown>): data is Record<string, unknown> & Title {
  return typeof data['text'] === 'string';
}

function isBadge(data: Record<string, unknown>): data is Record<string, unknown> & Badge {
  return typeof data['icon_url'] === 'string';
}

// ── Hook ───────────────────────────────────────────────────────────────

/**
 * Fetch a user's equipped cosmetics for chat identity display.
 * Gracefully returns nulls if the fetch fails (cosmetics are optional).
 */
export function useChatIdentity(userId: string): ChatIdentity {
  const { data, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['user-identity', userId],
    queryFn: async () => {
      const res = await api.get<{ data: InventoryItem[] }>(
        `/api/v1/users/${userId}/cosmetics/inventory`
      );
      return res.data.data;
    },
    staleTime: 300_000, // 5 minutes
    enabled: !!userId,
    retry: false,
    // Graceful fallback — if fetch fails, treat as no cosmetics
    placeholderData: [],
  });

  const items = data ?? [];
  const equipped = items.filter((i) => i.equipped_at !== null);

  const borderItem = equipped.find((i) => i.item_type === 'border');
  const titleItem = equipped.find((i) => i.item_type === 'title');
  const badgeItems = equipped.filter((i) => i.item_type === 'badge');

  const border: Border | null =
    borderItem?.item_data && isBorder(borderItem.item_data) ? borderItem.item_data : null;
  const title: Title | null =
    titleItem?.item_data && isTitle(titleItem.item_data) ? titleItem.item_data : null;
  const badges: Badge[] = badgeItems
    .map((b) => (b.item_data && isBadge(b.item_data) ? b.item_data : null))
    .filter((b): b is Badge => b !== null);

  return { border, title, badges, isLoading };
}

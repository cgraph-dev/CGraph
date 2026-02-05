/**
 * Avatar style Zustand store
 * @module components/ui/animated-avatar
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { safeLocalStorage } from '@/lib/safeStorage';

import type { AvatarStyle, BorderStyleType, AvatarStyleStore } from './types';
import { defaultAvatarStyle, DEFAULT_OWNED_STYLES } from './constants';

export const useAvatarStyle = create<AvatarStyleStore>()(
  persist(
    (set, get) => ({
      style: defaultAvatarStyle,
      ownedStyles: [...DEFAULT_OWNED_STYLES],
      updateStyle: (key, value) => {
        set((state) => ({
          style: { ...state.style, [key]: value },
        }));
      },
      resetStyle: () => set({ style: defaultAvatarStyle }),
      addOwnedStyle: (style: BorderStyleType) => {
        set((state) => ({
          ownedStyles: [...new Set([...state.ownedStyles, style])],
        }));
      },
      exportStyle: () => JSON.stringify(get().style),
      importStyle: (json: string) => {
        try {
          const parsed = JSON.parse(json);
          set({ style: { ...defaultAvatarStyle, ...parsed } });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'cgraph-avatar-style-v2',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);

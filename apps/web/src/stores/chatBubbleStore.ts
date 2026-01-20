import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

/**
 * Chat Bubble Customization Store
 *
 * Allows users to customize the appearance and animations of chat bubbles.
 */

export interface ChatBubbleStyle {
  // Colors
  ownMessageBg: string;
  otherMessageBg: string;
  ownMessageText: string;
  otherMessageText: string;
  useGradient: boolean;
  gradientDirection: 'to-r' | 'to-l' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';

  // Shape
  borderRadius: number; // 0-50
  bubbleShape: 'rounded' | 'sharp' | 'super-rounded' | 'bubble' | 'modern';
  showTail: boolean;
  tailPosition: 'bottom' | 'middle';

  // Effects
  glassEffect: boolean;
  glassBlur: number; // 0-30
  shadowIntensity: number; // 0-100
  borderWidth: number; // 0-3
  borderStyle: 'none' | 'solid' | 'gradient' | 'glow';

  // Animations
  entranceAnimation: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  hoverEffect: boolean;
  sendAnimation: 'none' | 'pop' | 'slide-out' | 'fade-out';
  typingIndicatorStyle: 'dots' | 'wave' | 'pulse' | 'bars';

  // Layout
  maxWidth: number; // 40-90 (percentage)
  spacing: number; // 1-20 (pixels)
  alignSent: 'left' | 'right';
  alignReceived: 'left' | 'right';

  // Advanced
  showTimestamp: boolean;
  timestampPosition: 'inside' | 'outside';
  showAvatar: boolean;
  avatarSize: 'small' | 'medium' | 'large';
  groupMessages: boolean;
  groupTimeout: number; // seconds
}

const defaultChatBubbleStyle: ChatBubbleStyle = {
  // Colors
  ownMessageBg: '#10b981',
  otherMessageBg: '#374151',
  ownMessageText: '#ffffff',
  otherMessageText: '#ffffff',
  useGradient: true,
  gradientDirection: 'to-r',

  // Shape
  borderRadius: 16,
  bubbleShape: 'rounded',
  showTail: true,
  tailPosition: 'bottom',

  // Effects
  glassEffect: false,
  glassBlur: 10,
  shadowIntensity: 20,
  borderWidth: 0,
  borderStyle: 'none',

  // Animations
  entranceAnimation: 'slide',
  hoverEffect: true,
  sendAnimation: 'pop',
  typingIndicatorStyle: 'dots',

  // Layout
  maxWidth: 70,
  spacing: 4,
  alignSent: 'right',
  alignReceived: 'left',

  // Advanced
  showTimestamp: true,
  timestampPosition: 'inside',
  showAvatar: true,
  avatarSize: 'medium',
  groupMessages: true,
  groupTimeout: 300,
};

interface ChatBubbleStore {
  style: ChatBubbleStyle;
  isLoading: boolean;
  isSaving: boolean;
  updateStyle: <K extends keyof ChatBubbleStyle>(key: K, value: ChatBubbleStyle[K]) => void;
  updateMultiple: (updates: Partial<ChatBubbleStyle>) => void;
  resetStyle: () => void;
  applyPreset: (preset: 'default' | 'minimal' | 'modern' | 'retro' | 'bubble' | 'glass') => void;
  exportStyle: () => string;
  importStyle: (json: string) => void;
  syncToBackend: () => Promise<void>;
  fetchFromBackend: () => Promise<void>;
}

export const useChatBubbleStore = create<ChatBubbleStore>()(
  persist(
    (set, get) => ({
      style: defaultChatBubbleStyle,
      isLoading: false,
      isSaving: false,

      updateStyle: (key, value) => {
        set((state) => ({
          style: { ...state.style, [key]: value },
        }));
        // Auto-sync to backend after update (debounced in component)
      },

      updateMultiple: (updates) => {
        set((state) => ({
          style: { ...state.style, ...updates },
        }));
      },

      resetStyle: () => {
        set({ style: defaultChatBubbleStyle });
      },

      applyPreset: (preset) => {
        const presets: Record<string, Partial<ChatBubbleStyle>> = {
          default: defaultChatBubbleStyle,

          minimal: {
            ownMessageBg: '#000000',
            otherMessageBg: '#1f2937',
            useGradient: false,
            borderRadius: 8,
            bubbleShape: 'sharp',
            showTail: false,
            glassEffect: false,
            shadowIntensity: 0,
            borderWidth: 1,
            borderStyle: 'solid',
            entranceAnimation: 'fade',
            hoverEffect: false,
          },

          modern: {
            ownMessageBg: '#8b5cf6',
            otherMessageBg: '#1f2937',
            useGradient: true,
            gradientDirection: 'to-br',
            borderRadius: 20,
            bubbleShape: 'super-rounded',
            showTail: false,
            glassEffect: true,
            glassBlur: 15,
            shadowIntensity: 40,
            borderWidth: 0,
            entranceAnimation: 'scale',
            hoverEffect: true,
          },

          retro: {
            ownMessageBg: '#10b981',
            otherMessageBg: '#6b7280',
            useGradient: false,
            borderRadius: 4,
            bubbleShape: 'sharp',
            showTail: false,
            glassEffect: false,
            shadowIntensity: 10,
            borderWidth: 2,
            borderStyle: 'solid',
            entranceAnimation: 'none',
            hoverEffect: false,
            typingIndicatorStyle: 'bars',
          },

          bubble: {
            ownMessageBg: '#3b82f6',
            otherMessageBg: '#e5e7eb',
            ownMessageText: '#ffffff',
            otherMessageText: '#111827',
            useGradient: false,
            borderRadius: 20,
            bubbleShape: 'bubble',
            showTail: true,
            tailPosition: 'bottom',
            glassEffect: false,
            shadowIntensity: 30,
            entranceAnimation: 'bounce',
            hoverEffect: true,
          },

          glass: {
            ownMessageBg: '#10b98150',
            otherMessageBg: '#37415150',
            useGradient: true,
            borderRadius: 16,
            bubbleShape: 'rounded',
            showTail: false,
            glassEffect: true,
            glassBlur: 20,
            shadowIntensity: 50,
            borderWidth: 1,
            borderStyle: 'gradient',
            entranceAnimation: 'fade',
            hoverEffect: true,
          },
        };

        const presetStyle = presets[preset];
        if (presetStyle) {
          set((state) => ({
            style: { ...state.style, ...presetStyle },
          }));
        }
      },

      exportStyle: () => {
        return JSON.stringify(get().style, null, 2);
      },

      importStyle: (json) => {
        try {
          const imported = JSON.parse(json);
          set(() => ({
            style: { ...defaultChatBubbleStyle, ...imported },
          }));
        } catch (error) {
          console.error('Failed to import chat bubble style:', error);
        }
      },

      syncToBackend: async () => {
        const { style } = get();
        set({ isSaving: true });
        try {
          await api.patch('/api/v1/users/me/preferences/chat-bubble', { style });
        } catch (error) {
          console.warn('Failed to sync chat bubble style to backend:', error);
          // Fail silently - local storage will persist
        } finally {
          set({ isSaving: false });
        }
      },

      fetchFromBackend: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get('/api/v1/users/me/preferences/chat-bubble');
          if (response.data?.style) {
            set({
              style: { ...defaultChatBubbleStyle, ...response.data.style },
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.warn('Failed to fetch chat bubble style from backend:', error);
          set({ isLoading: false });
          // Use local storage fallback
        }
      },
    }),
    {
      name: 'cgraph-chat-bubble-style',
    }
  )
);

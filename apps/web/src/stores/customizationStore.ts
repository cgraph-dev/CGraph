import { create } from 'zustand';
import { api } from '@/lib/api';

interface CustomizationState {
  // Identity
  avatarBorder: string | null;
  title: string | null;
  equippedBadges: string[];
  profileLayout: string;

  // Themes
  profileTheme: string;
  chatTheme: string;
  forumTheme: string | null;
  appTheme: string;

  // Chat Styling
  bubbleStyle: string;
  messageEffect: string;
  reactionStyle: string;

  // Effects
  particleEffect: string;
  backgroundEffect: string;
  animationSpeed: string;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchCustomizations: (userId: string) => Promise<void>;
  saveCustomizations: (userId: string) => Promise<void>;
  updateIdentity: (
    field: keyof Pick<
      CustomizationState,
      'avatarBorder' | 'title' | 'equippedBadges' | 'profileLayout'
    >,
    value: any
  ) => void;
  updateTheme: (
    field: keyof Pick<CustomizationState, 'profileTheme' | 'chatTheme' | 'forumTheme' | 'appTheme'>,
    value: any
  ) => void;
  updateChatStyle: (
    field: keyof Pick<CustomizationState, 'bubbleStyle' | 'messageEffect' | 'reactionStyle'>,
    value: any
  ) => void;
  updateEffects: (
    field: keyof Pick<CustomizationState, 'particleEffect' | 'backgroundEffect' | 'animationSpeed'>,
    value: any
  ) => void;
  reset: () => void;
}

const defaultState = {
  // Identity defaults
  avatarBorder: null,
  title: null,
  equippedBadges: [],
  profileLayout: 'classic',

  // Theme defaults
  profileTheme: 'classic-purple',
  chatTheme: 'default',
  forumTheme: null,
  appTheme: 'dark',

  // Chat styling defaults
  bubbleStyle: 'default',
  messageEffect: 'none',
  reactionStyle: 'bounce',

  // Effects defaults
  particleEffect: 'none',
  backgroundEffect: 'solid',
  animationSpeed: 'normal',

  // Loading states
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useCustomizationStore = create<CustomizationState>((set, get) => ({
  ...defaultState,

  fetchCustomizations: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/v1/users/${userId}/customizations`);
      const data = response.data.data;

      set({
        avatarBorder: data.avatar_border_id,
        title: data.title_id,
        equippedBadges: data.equipped_badges || [],
        profileLayout: data.profile_layout || 'classic',

        profileTheme: data.profile_theme || 'classic-purple',
        chatTheme: data.chat_theme || 'default',
        forumTheme: data.forum_theme,
        appTheme: data.app_theme || 'dark',

        bubbleStyle: data.bubble_style || 'default',
        messageEffect: data.message_effect || 'none',
        reactionStyle: data.reaction_style || 'bounce',

        particleEffect: data.particle_effect || 'none',
        backgroundEffect: data.background_effect || 'solid',
        animationSpeed: data.animation_speed || 'normal',

        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch customizations:', error);
      set({ isLoading: false, error: error.message || 'Failed to load customizations' });
    }
  },

  saveCustomizations: async (userId: string) => {
    set({ isSaving: true, error: null });
    try {
      const state = get();
      const payload = {
        avatar_border_id: state.avatarBorder,
        title_id: state.title,
        equipped_badges: state.equippedBadges,
        profile_layout: state.profileLayout,

        profile_theme: state.profileTheme,
        chat_theme: state.chatTheme,
        forum_theme: state.forumTheme,
        app_theme: state.appTheme,

        bubble_style: state.bubbleStyle,
        message_effect: state.messageEffect,
        reaction_style: state.reactionStyle,

        particle_effect: state.particleEffect,
        background_effect: state.backgroundEffect,
        animation_speed: state.animationSpeed,
      };

      await api.put(`/api/v1/users/${userId}/customizations`, payload);
      set({ isSaving: false });
    } catch (error: any) {
      console.error('Failed to save customizations:', error);
      set({ isSaving: false, error: error.message || 'Failed to save customizations' });
      throw error;
    }
  },

  updateIdentity: (field, value) => {
    set({ [field]: value } as Partial<CustomizationState>);
  },

  updateTheme: (field, value) => {
    set({ [field]: value } as Partial<CustomizationState>);
  },

  updateChatStyle: (field, value) => {
    set({ [field]: value } as Partial<CustomizationState>);
  },

  updateEffects: (field, value) => {
    set({ [field]: value } as Partial<CustomizationState>);
  },

  reset: () => {
    set(defaultState);
  },
}));

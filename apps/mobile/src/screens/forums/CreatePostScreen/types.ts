/**
 * CreatePostScreen types
 */

import { Ionicons } from '@expo/vector-icons';

export type PostType = 'text' | 'link' | 'image' | 'poll';

export interface PostTypeOption {
  type: PostType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

export interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  minHeight?: number;
  showCharCount?: boolean;
}

export interface PostTypeSelectorProps {
  selectedType: PostType;
  onTypeChange: (type: PostType) => void;
}

export interface SubmitButtonProps {
  onPress: () => void;
  isDisabled: boolean;
  isLoading: boolean;
}

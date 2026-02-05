/**
 * Chat Customization Types
 * Type definitions for chat customization components
 */

import type { CustomizationItem } from '@/modules/settings/components/customize';

/** Chat customization category tabs */
export type ChatCategory = 'bubbles' | 'effects' | 'reactions' | 'advanced';

/** Bubble style with border radius and shadow */
export interface BubbleStyle extends CustomizationItem {
  borderRadius: string;
  shadow: string;
}

/** Message effect with animation type */
export interface MessageEffect extends CustomizationItem {
  animation: string;
}

/** Reaction style with animation type */
export interface ReactionStyle extends CustomizationItem {
  animation: string;
}

/** Props for BubbleStylesSection component */
export interface BubbleStylesSectionProps {
  bubbles: BubbleStyle[];
  selectedBubble: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

/** Props for MessageEffectsSection component */
export interface MessageEffectsSectionProps {
  effects: MessageEffect[];
  selectedEffect: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

/** Props for ReactionStylesSection component */
export interface ReactionStylesSectionProps {
  reactions: ReactionStyle[];
  selectedReaction: string;
  previewingLockedItem: string | null;
  onSelect: (id: string, isUnlocked: boolean) => void;
}

/** Props for AdvancedControlsSection component */
export interface AdvancedControlsSectionProps {
  bubbleBorderRadius: number;
  onBorderRadiusChange: (value: number) => void;
  bubbleShadowIntensity: number;
  onShadowIntensityChange: (value: number) => void;
  enableGlassEffect: boolean;
  onGlassEffectChange: (value: boolean) => void;
  enableBubbleTail: boolean;
  onBubbleTailChange: (value: boolean) => void;
  enableHoverEffects: boolean;
  onHoverEffectsChange: (value: boolean) => void;
  selectedEntranceAnimation: string;
  onEntranceAnimationChange: (value: string) => void;
}

/** Category definition for tab navigation */
export interface CategoryDefinition {
  id: ChatCategory;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  count: number;
}

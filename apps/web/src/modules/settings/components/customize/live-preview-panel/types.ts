/**
 * Type definitions for LivePreviewPanel module
 */

export interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp?: string;
}

export interface ParticleData {
  id: number;
  width: number;
  height: number;
  left: number;
  top: number;
  boxShadow: number;
  delay: number;
  duration: number;
}

export interface ParticleStyle {
  color: string;
  shape: 'circle' | 'square';
}

export interface MockBadge {
  emoji: string;
  color: string;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

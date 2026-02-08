/**
 * AI-Powered Theme Engine - Type Definitions
 *
 * @version 1.0.0
 * @since v0.7.33
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  glow: string;
  gradient: [string, string];
}

export interface ThemeMetadata {
  name: string;
  mood: 'energetic' | 'calm' | 'professional' | 'playful' | 'dark' | 'light';
  accessibility: 'high' | 'medium' | 'low';
  contrastRatio: number;
  generatedAt: Date;
}

export interface AdaptiveTheme {
  colors: ThemeColors;
  metadata: ThemeMetadata;
  animations: {
    speed: number;
    easing: string;
  };
  spacing: {
    unit: number;
    scale: number[];
  };
}

export interface UserPreference {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  activity: 'browsing' | 'chatting' | 'working' | 'gaming';
  previousThemes: string[];
  interactionPatterns: {
    clickRate: number;
    scrollSpeed: number;
    dwell: number;
  };
}

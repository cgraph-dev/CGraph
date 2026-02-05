/**
 * EnhancedDemo Type Definitions
 */

export type DemoSection =
  | 'glasscards'
  | 'messages'
  | 'reactions'
  | 'matrix3d'
  | 'shaders'
  | 'voice'
  | 'theme'
  | 'holographic'
  | 'holov4';

export interface DemoSectionItem {
  id: DemoSection;
  label: string;
}

export interface HolographicDemoProps {
  theme: 'cyan' | 'green' | 'purple' | 'gold';
  setTheme: (theme: 'cyan' | 'green' | 'purple' | 'gold') => void;
  progress: number;
  setProgress: (progress: number) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  showNotification: boolean;
  setShowNotification: (show: boolean) => void;
}

export interface HolographicV4DemoProps {
  preset: 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight';
  setPreset: (preset: 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export type HoloTheme = 'cyan' | 'green' | 'purple' | 'gold';
export type HoloV4Preset = 'cyan' | 'matrix' | 'purple' | 'gold' | 'midnight';
export type BackgroundType = 'matrix3d' | 'shader';
export type ShaderVariant = 'fluid' | 'particles' | 'waves' | 'neural' | 'matrix';
export type MatrixTheme = 'matrix-green' | 'cyber-blue' | 'purple-haze' | 'amber-glow';

/**
 * Type definitions for CreateForum module
 */

export interface ForumFormData {
  // Basic Info
  name: string;
  slug: string;
  description: string;
  category: string;
  // Appearance
  iconUrl: string;
  bannerUrl: string;
  primaryColor: string;
  // Settings
  isPublic: boolean;
  isNsfw: boolean;
  allowPosts: boolean;
  registrationOpen: boolean;
}

export interface ForumCategory {
  value: string;
  label: string;
}

export interface StepInfo {
  num: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

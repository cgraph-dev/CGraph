/**
 * Type definitions and constants for the coin shop feature.
 * @module screens/premium/coin-shop-screen/types
 */
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

export type CategoryId = 'bundles' | 'themes' | 'badges' | 'effects' | 'boosts';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'bundles', name: 'Coin Bundles', icon: 'cash' },
  { id: 'themes', name: 'Themes', icon: 'color-palette' },
  { id: 'badges', name: 'Badges', icon: 'shield' },
  { id: 'effects', name: 'Effects', icon: 'sparkles' },
  { id: 'boosts', name: 'Boosts', icon: 'flash' },
];

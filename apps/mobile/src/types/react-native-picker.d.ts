/**
 * Ambient type declarations for @react-native-picker/picker.
 */
declare module '@react-native-picker/picker' {
  import type { Component } from 'react';
  import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface PickerItemProps {
    label: string;
    value: string;
    color?: string;
    enabled?: boolean;
    style?: StyleProp<TextStyle>;
  }

  export interface PickerProps<T = string> {
    selectedValue?: T;
    onValueChange?: (itemValue: T, itemIndex: number) => void;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    style?: StyleProp<ViewStyle>;
    itemStyle?: StyleProp<TextStyle>;
    dropdownIconColor?: string;
    testID?: string;
    children?: React.ReactNode;
  }

  /** Picker class. */
  export class Picker<T = string> extends Component<PickerProps<T>> {
    static Item: React.ComponentType<PickerItemProps>;
  }
}

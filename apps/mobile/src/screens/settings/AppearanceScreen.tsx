import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Appearance'>;
};

export default function AppearanceScreen({ navigation: _navigation }: Props) {
  const { colors, themePreference, setThemePreference } = useTheme();
  
  const themes = [
    { value: 'light' as const, label: 'Light', icon: 'sunny-outline' as const },
    { value: 'dark' as const, label: 'Dark', icon: 'moon-outline' as const },
    { value: 'system' as const, label: 'System', icon: 'phone-portrait-outline' as const },
  ];
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme</Text>
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {themes.map((theme, index) => (
            <TouchableOpacity
              key={theme.value}
              style={[
                styles.themeOption,
                index < themes.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => setThemePreference(theme.value)}
            >
              <Ionicons name={theme.icon} size={22} color={colors.textSecondary} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                {theme.label}
              </Text>
              {themePreference === theme.value && (
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Choose how CGraph looks to you. Select "System" to automatically switch
          between light and dark themes based on your device settings.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  themeLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});

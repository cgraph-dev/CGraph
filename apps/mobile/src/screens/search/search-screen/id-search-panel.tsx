/**
 * ID Search Panel component.
 * @module screens/search/search-screen/id-search-panel
 */
import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../components/ui/glass-card';
import { styles } from './styles';

interface IdSearchPanelProps {
  idSearchType: 'user' | 'group' | 'forum';
  setIdSearchType: (type: 'user' | 'group' | 'forum') => void;
  idSearchValue: string;
  setIdSearchValue: (value: string) => void;
  onSearch: () => void;
  colors: Record<string, string>;
}

export function IdSearchPanel({
  idSearchType,
  setIdSearchType,
  idSearchValue,
  setIdSearchValue,
  onSearch,
  colors,
}: IdSearchPanelProps) {
  return (
    <GlassCard variant="neon" intensity="subtle" style={styles.idPanel}>
      <View style={styles.idPanelInner}>
        <View style={styles.idHeader}>
          <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.idIconContainer}>
            <Ionicons name="key" size={16} color="#fff" />
          </LinearGradient>
          <Text style={[styles.idTitle, { color: colors.text }]}>Search by ID</Text>
        </View>

        <View style={styles.idTypeRow}>
          {(['user', 'group', 'forum'] as const).map((type) => {
            const isActive = idSearchType === type;
            return (
              <TouchableOpacity
                key={type}
                style={styles.idTypeWrapper}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIdSearchType(type);
                }}
              >
                {isActive ? (
                  <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.idTypeButton}>
                    <Text style={styles.idTypeTextActive}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.idTypeButton, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.idTypeText, { color: colors.textSecondary }]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.idInputRow}>
          <TextInput
            style={[styles.idInput, { backgroundColor: colors.surface, color: colors.text }]}
            placeholder={`Enter ${idSearchType} ID`}
            placeholderTextColor={colors.textSecondary}
            value={idSearchValue}
            onChangeText={setIdSearchValue}
          />
          <TouchableOpacity onPress={onSearch}>
            <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.idSearchButton}>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
}

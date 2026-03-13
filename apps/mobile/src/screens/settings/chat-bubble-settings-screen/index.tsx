import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { useChatBubbleStyle } from './hooks/useChatBubbleStyle';
import { MessagePreview, TabBar, PresetsTab, ColorsTab, ShapeTab, LayoutTab } from './components';
import type { Props, TabId } from './types';

/**
 * Chat Bubble Settings Screen component.
 *
 */
export default function ChatBubbleSettingsScreen({ navigation }: Props) {
  const { style, updateStyle, applyPreset, resetToDefaults } = useChatBubbleStyle();
  const [activeTab, setActiveTab] = useState<TabId>('presets');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chat Bubbles</Text>
          <Text style={styles.headerSubtitle}>Customize message appearance</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={resetToDefaults}>
          <Ionicons name="refresh" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <MessagePreview style={style} />

      {/* Tab Navigation */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'presets' && <PresetsTab onApplyPreset={applyPreset} />}
        {activeTab === 'colors' && <ColorsTab style={style} updateStyle={updateStyle} />}
        {activeTab === 'shape' && <ShapeTab style={style} updateStyle={updateStyle} />}
        {activeTab === 'layout' && <LayoutTab style={style} updateStyle={updateStyle} />}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

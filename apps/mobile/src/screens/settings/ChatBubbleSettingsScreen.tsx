import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { SettingsStackParamList } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'ChatBubbles'>;
};

// ============================================================================
// TYPES
// ============================================================================

export interface ChatBubbleStyle {
  // Colors
  ownMessageBg: string;
  ownMessageText: string;
  otherMessageBg: string;
  otherMessageText: string;
  
  // Shape
  borderRadius: number;
  tailStyle: 'none' | 'arrow' | 'bubble' | 'subtle';
  
  // Effects
  useGradient: boolean;
  gradientDirection: 'to-right' | 'to-bottom' | 'to-bottom-right';
  glassEffect: boolean;
  glassBlur: number;
  shadowIntensity: number;
  borderWidth: number;
  
  // Layout
  maxWidth: number;
  avatarSize: 'small' | 'medium' | 'large';
  showAvatar: boolean;
  showTimestamp: boolean;
  timestampPosition: 'inside' | 'outside';
  alignSent: 'left' | 'right';
  alignReceived: 'left' | 'right';
  spacing: 'compact' | 'normal' | 'spacious';
}

const defaultStyle: ChatBubbleStyle = {
  ownMessageBg: '#10b981',
  ownMessageText: '#ffffff',
  otherMessageBg: '#374151',
  otherMessageText: '#ffffff',
  
  borderRadius: 18,
  tailStyle: 'bubble',
  
  useGradient: true,
  gradientDirection: 'to-right',
  glassEffect: false,
  glassBlur: 10,
  shadowIntensity: 30,
  borderWidth: 0,
  
  maxWidth: 80,
  avatarSize: 'medium',
  showAvatar: true,
  showTimestamp: true,
  timestampPosition: 'inside',
  alignSent: 'right',
  alignReceived: 'left',
  spacing: 'normal',
};

const STORAGE_KEY = 'cgraph-chat-bubble-style';

// ============================================================================
// PRESETS
// ============================================================================

const presets: { id: string; label: string; colors: [string, string]; style: ChatBubbleStyle }[] = [
  { 
    id: 'default', 
    label: 'Default', 
    colors: ['#10b981', '#059669'],
    style: { ...defaultStyle }
  },
  { 
    id: 'minimal', 
    label: 'Minimal', 
    colors: ['#374151', '#4b5563'],
    style: { ...defaultStyle, useGradient: false, borderRadius: 8, shadowIntensity: 0 }
  },
  { 
    id: 'modern', 
    label: 'Modern', 
    colors: ['#8b5cf6', '#ec4899'],
    style: { ...defaultStyle, ownMessageBg: '#8b5cf6', borderRadius: 24 }
  },
  { 
    id: 'retro', 
    label: 'Retro', 
    colors: ['#f59e0b', '#ef4444'],
    style: { ...defaultStyle, ownMessageBg: '#f59e0b', borderRadius: 4, tailStyle: 'arrow' as const }
  },
  { 
    id: 'bubble', 
    label: 'Bubble', 
    colors: ['#3b82f6', '#60a5fa'],
    style: { ...defaultStyle, ownMessageBg: '#3b82f6', borderRadius: 24, tailStyle: 'bubble' as const }
  },
  { 
    id: 'glass', 
    label: 'Glass', 
    colors: ['rgba(16,185,129,0.3)', 'rgba(139,92,246,0.3)'],
    style: { ...defaultStyle, glassEffect: true, glassBlur: 20, borderWidth: 1 }
  },
];

// ============================================================================
// COLOR OPTIONS
// ============================================================================

const colorOptions = [
  { name: 'Emerald', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f59e0b' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Indigo', color: '#6366f1' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

interface SectionProps {
  title: string;
  icon: string;
  iconColor: string;
  children: React.ReactNode;
}

function SettingsSection({ title, icon, iconColor, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={18} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
        {children}
      </BlurView>
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function ToggleRow({ label, description, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.optionRow}>
      <View style={styles.optionInfo}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          HapticFeedback.light();
          onToggle(newValue);
        }}
        trackColor={{ false: '#374151', true: '#10b981' }}
        thumbColor={value ? '#fff' : '#9ca3af'}
      />
    </View>
  );
}

interface SegmentedRowProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

function SegmentedRow({ label, options, selected, onSelect }: SegmentedRowProps) {
  return (
    <View style={styles.optionRowVertical}>
      <Text style={styles.optionLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentedControl}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segmentedOption,
              selected === option.value && styles.segmentedOptionSelected,
            ]}
            onPress={() => {
              HapticFeedback.light();
              onSelect(option.value);
            }}
          >
            <Text
              style={[
                styles.segmentedOptionText,
                selected === option.value && styles.segmentedOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
}

function SliderRow({ label, value, min, max, step = 1, onValueChange }: SliderRowProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.optionRowVertical}>
      <View style={styles.sliderHeader}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.sliderButtons}>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              HapticFeedback.light();
              onValueChange(Math.max(min, value - step));
            }}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sliderButton}
            onPress={() => {
              HapticFeedback.light();
              onValueChange(Math.min(max, value + step));
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatBubbleSettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [style, setStyle] = useState<ChatBubbleStyle>(defaultStyle);
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'shape' | 'layout'>('presets');

  // Load style on mount
  React.useEffect(() => {
    loadStyle();
  }, []);

  const loadStyle = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setStyle({ ...defaultStyle, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load style:', error);
    }
  };

  const saveStyle = async (newStyle: ChatBubbleStyle) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStyle));
    } catch (error) {
      console.error('Failed to save style:', error);
    }
  };

  const updateStyle = useCallback(<K extends keyof ChatBubbleStyle>(
    key: K,
    value: ChatBubbleStyle[K]
  ) => {
    setStyle((prev) => {
      const newStyle = { ...prev, [key]: value };
      saveStyle(newStyle);
      return newStyle;
    });
  }, []);

  const applyPreset = (presetId: string) => {
    HapticFeedback.medium();
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setStyle(preset.style);
      saveStyle(preset.style);
    }
  };

  const resetToDefaults = () => {
    HapticFeedback.medium();
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset chat bubble settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setStyle(defaultStyle);
            saveStyle(defaultStyle);
            HapticFeedback.success();
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'presets' as const, label: 'Presets', icon: 'sparkles' },
    { id: 'colors' as const, label: 'Colors', icon: 'color-palette' },
    { id: 'shape' as const, label: 'Shape', icon: 'shapes' },
    { id: 'layout' as const, label: 'Layout', icon: 'grid' },
  ];

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
      <View style={styles.previewContainer}>
        <BlurView intensity={30} tint="dark" style={styles.previewContent}>
          {/* Received message */}
          <View style={[styles.messageRow, { justifyContent: style.alignReceived === 'left' ? 'flex-start' : 'flex-end' }]}>
            {style.showAvatar && (
              <View style={[
                styles.avatar,
                { 
                  backgroundColor: '#8b5cf6',
                  width: style.avatarSize === 'small' ? 24 : style.avatarSize === 'large' ? 40 : 32,
                  height: style.avatarSize === 'small' ? 24 : style.avatarSize === 'large' ? 40 : 32,
                }
              ]} />
            )}
            <View
              style={[
                styles.messageBubble,
                {
                  backgroundColor: style.otherMessageBg,
                  borderRadius: style.borderRadius,
                  maxWidth: `${style.maxWidth}%`,
                },
              ]}
            >
              <Text style={[styles.messageText, { color: style.otherMessageText }]}>
                Hey! How's it going?
              </Text>
              {style.showTimestamp && style.timestampPosition === 'inside' && (
                <Text style={styles.timestamp}>12:34 PM</Text>
              )}
            </View>
          </View>

          {/* Sent message */}
          <View style={[styles.messageRow, { justifyContent: style.alignSent === 'right' ? 'flex-end' : 'flex-start' }]}>
            <LinearGradient
              colors={style.useGradient ? [style.ownMessageBg, '#8b5cf6'] : [style.ownMessageBg, style.ownMessageBg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.messageBubble,
                {
                  borderRadius: style.borderRadius,
                  maxWidth: `${style.maxWidth}%`,
                },
              ]}
            >
              <Text style={[styles.messageText, { color: style.ownMessageText }]}>
                Pretty good! Customizing bubbles 🎨
              </Text>
              {style.showTimestamp && style.timestampPosition === 'inside' && (
                <Text style={styles.timestamp}>12:35 PM</Text>
              )}
            </LinearGradient>
            {style.showAvatar && (
              <View style={[
                styles.avatar,
                { 
                  backgroundColor: '#10b981',
                  width: style.avatarSize === 'small' ? 24 : style.avatarSize === 'large' ? 40 : 32,
                  height: style.avatarSize === 'small' ? 24 : style.avatarSize === 'large' ? 40 : 32,
                }
              ]} />
            )}
          </View>
        </BlurView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              HapticFeedback.light();
              setActiveTab(tab.id);
            }}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#10b981' : '#6b7280'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <SettingsSection title="Quick Presets" icon="sparkles" iconColor="#f59e0b">
            <View style={styles.presetGrid}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetItem}
                  onPress={() => applyPreset(preset.id)}
                >
                  <LinearGradient
                    colors={preset.colors as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.presetPreview}
                  />
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingsSection>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <>
            <SettingsSection title="Your Messages" icon="chatbubble" iconColor="#10b981">
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Background Color</Text>
                <View style={styles.colorGrid}>
                  {colorOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: opt.color },
                        style.ownMessageBg === opt.color && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        HapticFeedback.light();
                        updateStyle('ownMessageBg', opt.color);
                      }}
                    >
                      {style.ownMessageBg === opt.color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SettingsSection>

            <SettingsSection title="Other Messages" icon="chatbubbles" iconColor="#8b5cf6">
              <View style={styles.optionRowVertical}>
                <Text style={styles.optionLabel}>Background Color</Text>
                <View style={styles.colorGrid}>
                  {[...colorOptions, { name: 'Gray', color: '#374151' }].map((opt) => (
                    <TouchableOpacity
                      key={opt.color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: opt.color },
                        style.otherMessageBg === opt.color && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        HapticFeedback.light();
                        updateStyle('otherMessageBg', opt.color);
                      }}
                    >
                      {style.otherMessageBg === opt.color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SettingsSection>

            <SettingsSection title="Effects" icon="sparkles" iconColor="#ec4899">
              <ToggleRow
                label="Use Gradient"
                description="Add gradient to your messages"
                value={style.useGradient}
                onToggle={(value) => updateStyle('useGradient', value)}
              />
              <ToggleRow
                label="Glass Effect"
                description="Translucent blur effect"
                value={style.glassEffect}
                onToggle={(value) => updateStyle('glassEffect', value)}
              />
              <SliderRow
                label="Shadow Intensity"
                value={style.shadowIntensity}
                min={0}
                max={100}
                step={10}
                onValueChange={(value) => updateStyle('shadowIntensity', value)}
              />
            </SettingsSection>
          </>
        )}

        {/* Shape Tab */}
        {activeTab === 'shape' && (
          <>
            <SettingsSection title="Bubble Shape" icon="shapes" iconColor="#3b82f6">
              <SliderRow
                label="Border Radius"
                value={style.borderRadius}
                min={0}
                max={32}
                step={2}
                onValueChange={(value) => updateStyle('borderRadius', value)}
              />
              <SegmentedRow
                label="Tail Style"
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'arrow', label: 'Arrow' },
                  { value: 'bubble', label: 'Bubble' },
                  { value: 'subtle', label: 'Subtle' },
                ]}
                selected={style.tailStyle}
                onSelect={(value) => updateStyle('tailStyle', value as ChatBubbleStyle['tailStyle'])}
              />
              <SliderRow
                label="Border Width"
                value={style.borderWidth}
                min={0}
                max={4}
                step={1}
                onValueChange={(value) => updateStyle('borderWidth', value)}
              />
            </SettingsSection>

            <SettingsSection title="Size" icon="resize" iconColor="#22c55e">
              <SliderRow
                label="Max Width (%)"
                value={style.maxWidth}
                min={50}
                max={95}
                step={5}
                onValueChange={(value) => updateStyle('maxWidth', value)}
              />
            </SettingsSection>
          </>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <>
            <SettingsSection title="Avatar" icon="person-circle" iconColor="#8b5cf6">
              <ToggleRow
                label="Show Avatar"
                description="Display user avatars in chat"
                value={style.showAvatar}
                onToggle={(value) => updateStyle('showAvatar', value)}
              />
              <SegmentedRow
                label="Avatar Size"
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ]}
                selected={style.avatarSize}
                onSelect={(value) => updateStyle('avatarSize', value as ChatBubbleStyle['avatarSize'])}
              />
            </SettingsSection>

            <SettingsSection title="Timestamp" icon="time" iconColor="#f59e0b">
              <ToggleRow
                label="Show Timestamp"
                description="Display message timestamps"
                value={style.showTimestamp}
                onToggle={(value) => updateStyle('showTimestamp', value)}
              />
              <SegmentedRow
                label="Timestamp Position"
                options={[
                  { value: 'inside', label: 'Inside Bubble' },
                  { value: 'outside', label: 'Outside' },
                ]}
                selected={style.timestampPosition}
                onSelect={(value) => updateStyle('timestampPosition', value as ChatBubbleStyle['timestampPosition'])}
              />
            </SettingsSection>

            <SettingsSection title="Alignment" icon="swap-horizontal" iconColor="#06b6d4">
              <SegmentedRow
                label="Your Messages"
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
                selected={style.alignSent}
                onSelect={(value) => updateStyle('alignSent', value as ChatBubbleStyle['alignSent'])}
              />
              <SegmentedRow
                label="Other Messages"
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
                selected={style.alignReceived}
                onSelect={(value) => updateStyle('alignReceived', value as ChatBubbleStyle['alignReceived'])}
              />
              <SegmentedRow
                label="Message Spacing"
                options={[
                  { value: 'compact', label: 'Compact' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'spacious', label: 'Spacious' },
                ]}
                selected={style.spacing}
                onSelect={(value) => updateStyle('spacing', value as ChatBubbleStyle['spacing'])}
              />
            </SettingsSection>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

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
  previewContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    borderRadius: 100,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#10b981',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionRowVertical: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  segmentedControl: {
    marginTop: 10,
  },
  segmentedOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  segmentedOptionSelected: {
    backgroundColor: '#10b981',
  },
  segmentedOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  segmentedOptionTextSelected: {
    color: '#fff',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetItem: {
    width: '30%',
    alignItems: 'center',
  },
  presetPreview: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    marginBottom: 6,
  },
  presetLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

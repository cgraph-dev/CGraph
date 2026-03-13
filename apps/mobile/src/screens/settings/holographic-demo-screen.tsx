/**
 * Holographic Demo Screen
 *
 * Showcases the revolutionary Holographic UI component system
 * with all available components and themes.
 *
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  HolographicContainer,
  HolographicText,
  HolographicButton,
  HolographicCard,
  HolographicAvatar,
  HolographicInput,
  HolographicProgress,
  HolographicNotification,
  HOLOGRAPHIC_THEMES,
  type HolographicConfig,
} from '@/components';
import type { SettingsStackParamList } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<SettingsStackParamList, 'HolographicDemo'>;

// =============================================================================
// THEME SELECTOR
// =============================================================================

interface ThemeSelectorProps {
  selectedTheme: HolographicConfig['colorTheme'];
  onSelectTheme: (theme: HolographicConfig['colorTheme']) => void;
}

function ThemeSelector({ selectedTheme, onSelectTheme }: ThemeSelectorProps) {
  const themes: HolographicConfig['colorTheme'][] = ['cyan', 'green', 'purple', 'gold'];

  return (
    <View style={styles.themeSelector}>
      <HolographicText variant="label" colorTheme={selectedTheme}>
        Select Theme
      </HolographicText>
      <View style={styles.themeButtonsRow}>
        {themes.map((theme) => (
          <HolographicButton
            key={theme}
            variant={selectedTheme === theme ? 'primary' : 'secondary'}
            size="sm"
            colorTheme={theme}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelectTheme(theme);
            }}
            style={styles.themeButton}
          >
            {theme.toUpperCase()}
          </HolographicButton>
        ))}
      </View>
    </View>
  );
}

// =============================================================================
// COMPONENT SHOWCASE SECTIONS
// =============================================================================

interface ShowcaseSectionProps {
  title: string;
  colorTheme: HolographicConfig['colorTheme'];
  children: React.ReactNode;
}

function ShowcaseSection({ title, colorTheme, children }: ShowcaseSectionProps) {
  return (
    <View style={styles.showcaseSection}>
      <HolographicText variant="subtitle" colorTheme={colorTheme} style={styles.sectionTitle}>
        {title}
      </HolographicText>
      {children}
    </View>
  );
}

// =============================================================================
// MAIN SCREEN
// =============================================================================

/**
 * Holographic Demo Screen component.
 *
 */
export function HolographicDemoScreen({ navigation }: Props) {
  const [selectedTheme, setSelectedTheme] = useState<HolographicConfig['colorTheme']>('cyan');
  const [inputValue, setInputValue] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<
    'info' | 'success' | 'warning' | 'error'
  >('info');
  const [progressValue, setProgressValue] = useState(65);
  const [isLoading, setIsLoading] = useState(false);

  const theme = HOLOGRAPHIC_THEMES[selectedTheme];

  const handleShowNotification = useCallback((type: typeof notificationType) => {
    setNotificationType(type);
    setShowNotification(true);
    Haptics.notificationAsync(
      type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : type === 'error'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
    );
  }, []);

  const handleLoadingDemo = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  const incrementProgress = useCallback(() => {
    setProgressValue((prev) => Math.min(prev + 10, 100));
  }, []);

  const decrementProgress = useCallback(() => {
    setProgressValue((prev) => Math.max(prev - 10, 0));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0a0a1a', '#1a1a3a', '#0a0a2a'] as const}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Notification */}
      {showNotification && (
        <HolographicNotification
          visible={showNotification}
          title={`${notificationType.charAt(0).toUpperCase()}${notificationType.slice(1)}`}
          message={`This is a ${notificationType} notification with holographic styling!`}
          type={notificationType}
          onDismiss={() => setShowNotification(false)}
          duration={4000}
        />
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <HolographicButton
            variant="ghost"
            size="sm"
            colorTheme={selectedTheme}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </HolographicButton>
          <HolographicText variant="title" colorTheme={selectedTheme}>
            HOLO UI
          </HolographicText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Selector */}
          <ThemeSelector selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} />

          {/* Container Demo */}
          <ShowcaseSection title="Holographic Container" colorTheme={selectedTheme}>
            <HolographicContainer
              config={{
                colorTheme: selectedTheme,
                intensity: 'medium',
                enableScanlines: true,
                enableFlicker: true,
              }}
              style={styles.demoContainer}
            >
              <View style={styles.containerContent}>
                <HolographicText variant="body" colorTheme={selectedTheme}>
                  Interactive container with scanlines, flicker effects, and corner decorations.
                  Touch to feel the haptic feedback!
                </HolographicText>
              </View>
            </HolographicContainer>
          </ShowcaseSection>

          {/* Text Variants */}
          <ShowcaseSection title="Text Variants" colorTheme={selectedTheme}>
            <HolographicContainer
              config={{ colorTheme: selectedTheme }}
              style={styles.demoContainer}
            >
              <View style={styles.textDemo}>
                <HolographicText variant="title" colorTheme={selectedTheme}>
                  Title Text
                </HolographicText>
                <HolographicText variant="subtitle" colorTheme={selectedTheme}>
                  Subtitle Text
                </HolographicText>
                <HolographicText variant="body" colorTheme={selectedTheme}>
                  Body text with animated glow effect
                </HolographicText>
                <HolographicText variant="label" colorTheme={selectedTheme}>
                  LABEL TEXT
                </HolographicText>
              </View>
            </HolographicContainer>
          </ShowcaseSection>

          {/* Button Variants */}
          <ShowcaseSection title="Button Variants" colorTheme={selectedTheme}>
            <View style={styles.buttonGrid}>
              <HolographicButton
                variant="primary"
                size="md"
                colorTheme={selectedTheme}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                Primary
              </HolographicButton>
              <HolographicButton
                variant="secondary"
                size="md"
                colorTheme={selectedTheme}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              >
                Secondary
              </HolographicButton>
              <HolographicButton
                variant="danger"
                size="md"
                colorTheme={selectedTheme}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
              >
                Danger
              </HolographicButton>
              <HolographicButton
                variant="ghost"
                size="md"
                colorTheme={selectedTheme}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                Ghost
              </HolographicButton>
              <HolographicButton
                variant="primary"
                size="md"
                colorTheme={selectedTheme}
                loading={isLoading}
                onPress={handleLoadingDemo}
                style={styles.fullWidthButton}
              >
                {isLoading ? '' : 'Loading Demo'}
              </HolographicButton>
              <HolographicButton
                variant="primary"
                size="md"
                colorTheme={selectedTheme}
                disabled
                style={styles.fullWidthButton}
              >
                Disabled
              </HolographicButton>
            </View>
          </ShowcaseSection>

          {/* Card Demo */}
          <ShowcaseSection title="Holographic Card" colorTheme={selectedTheme}>
            <HolographicCard
              colorTheme={selectedTheme}
              header={
                <HolographicText variant="subtitle" colorTheme={selectedTheme}>
                  Card Header
                </HolographicText>
              }
              footer={
                <View style={styles.cardFooter}>
                  <HolographicButton variant="secondary" size="sm" colorTheme={selectedTheme}>
                    Cancel
                  </HolographicButton>
                  <HolographicButton variant="primary" size="sm" colorTheme={selectedTheme}>
                    Confirm
                  </HolographicButton>
                </View>
              }
            >
              <HolographicText variant="body" colorTheme={selectedTheme}>
                Cards combine the container with structured header, body, and footer sections for
                organized content display.
              </HolographicText>
            </HolographicCard>
          </ShowcaseSection>

          {/* Avatar Showcase */}
          <ShowcaseSection title="Holographic Avatars" colorTheme={selectedTheme}>
            <HolographicContainer
              config={{ colorTheme: selectedTheme }}
              style={styles.demoContainer}
            >
              <View style={styles.avatarRow}>
                <View style={styles.avatarItem}>
                  <HolographicAvatar
                    name="John Doe"
                    size="sm"
                    status="online"
                    colorTheme={selectedTheme}
                  />
                  <HolographicText
                    variant="label"
                    colorTheme={selectedTheme}
                    style={styles.avatarLabel}
                  >
                    SM
                  </HolographicText>
                </View>
                <View style={styles.avatarItem}>
                  <HolographicAvatar
                    name="Jane Smith"
                    size="md"
                    status="away"
                    colorTheme={selectedTheme}
                  />
                  <HolographicText
                    variant="label"
                    colorTheme={selectedTheme}
                    style={styles.avatarLabel}
                  >
                    MD
                  </HolographicText>
                </View>
                <View style={styles.avatarItem}>
                  <HolographicAvatar
                    name="Alex Johnson"
                    size="lg"
                    status="busy"
                    colorTheme={selectedTheme}
                  />
                  <HolographicText
                    variant="label"
                    colorTheme={selectedTheme}
                    style={styles.avatarLabel}
                  >
                    LG
                  </HolographicText>
                </View>
                <View style={styles.avatarItem}>
                  <HolographicAvatar
                    name="Sam Wilson"
                    size="xl"
                    status="offline"
                    colorTheme={selectedTheme}
                  />
                  <HolographicText
                    variant="label"
                    colorTheme={selectedTheme}
                    style={styles.avatarLabel}
                  >
                    XL
                  </HolographicText>
                </View>
              </View>
            </HolographicContainer>
          </ShowcaseSection>

          {/* Input Demo */}
          <ShowcaseSection title="Holographic Input" colorTheme={selectedTheme}>
            <HolographicInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Type something futuristic..."
              colorTheme={selectedTheme}
            />
          </ShowcaseSection>

          {/* Progress Demo */}
          <ShowcaseSection title="Holographic Progress" colorTheme={selectedTheme}>
            <HolographicContainer
              config={{ colorTheme: selectedTheme }}
              style={styles.demoContainer}
            >
              <View style={styles.progressDemo}>
                <HolographicProgress
                  progress={progressValue / 100}
                  height={4}
                  colorTheme={selectedTheme}
                />
                <HolographicProgress
                  progress={progressValue / 100}
                  height={8}
                  colorTheme={selectedTheme}
                  style={styles.progressSpacing}
                />
                <HolographicProgress
                  progress={progressValue / 100}
                  height={12}
                  colorTheme={selectedTheme}
                  style={styles.progressSpacing}
                />
                <View style={styles.progressControls}>
                  <HolographicButton
                    variant="secondary"
                    size="sm"
                    colorTheme={selectedTheme}
                    onPress={decrementProgress}
                  >
                    - 10%
                  </HolographicButton>
                  <HolographicText variant="body" colorTheme={selectedTheme}>
                    {progressValue}%
                  </HolographicText>
                  <HolographicButton
                    variant="secondary"
                    size="sm"
                    colorTheme={selectedTheme}
                    onPress={incrementProgress}
                  >
                    + 10%
                  </HolographicButton>
                </View>
              </View>
            </HolographicContainer>
          </ShowcaseSection>

          {/* Notification Demo */}
          <ShowcaseSection title="Notifications" colorTheme={selectedTheme}>
            <View style={styles.notificationButtons}>
              <HolographicButton
                variant="primary"
                size="sm"
                colorTheme="cyan"
                onPress={() => handleShowNotification('info')}
              >
                Info
              </HolographicButton>
              <HolographicButton
                variant="primary"
                size="sm"
                colorTheme="green"
                onPress={() => handleShowNotification('success')}
              >
                Success
              </HolographicButton>
              <HolographicButton
                variant="primary"
                size="sm"
                colorTheme="gold"
                onPress={() => handleShowNotification('warning')}
              >
                Warning
              </HolographicButton>
              <HolographicButton
                variant="primary"
                size="sm"
                colorTheme="purple"
                onPress={() => handleShowNotification('error')}
              >
                Error
              </HolographicButton>
            </View>
          </ShowcaseSection>

          {/* Intensity Comparison */}
          <ShowcaseSection title="Intensity Levels" colorTheme={selectedTheme}>
            <View style={styles.intensityDemo}>
              <HolographicContainer
                config={{ colorTheme: selectedTheme, intensity: 'subtle' }}
                style={styles.intensityContainer}
              >
                <HolographicText variant="label" colorTheme={selectedTheme}>
                  SUBTLE
                </HolographicText>
              </HolographicContainer>
              <HolographicContainer
                config={{ colorTheme: selectedTheme, intensity: 'medium' }}
                style={styles.intensityContainer}
              >
                <HolographicText variant="label" colorTheme={selectedTheme}>
                  MEDIUM
                </HolographicText>
              </HolographicContainer>
              <HolographicContainer
                config={{ colorTheme: selectedTheme, intensity: 'intense' }}
                style={styles.intensityContainer}
              >
                <HolographicText variant="label" colorTheme={selectedTheme}>
                  INTENSE
                </HolographicText>
              </HolographicContainer>
            </View>
          </ShowcaseSection>

          {/* Footer */}
          <View style={styles.footer}>
            <HolographicText variant="label" colorTheme={selectedTheme} animate={false}>
              CGraph Holographic UI v1.0.0
            </HolographicText>
            <HolographicText
              variant="body"
              colorTheme={selectedTheme}
              animate={false}
              style={styles.footerSubtext}
            >
              Revolutionary Mobile Interface Design
            </HolographicText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Theme selector
  themeSelector: {
    marginBottom: 24,
  },
  themeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  themeButton: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 64) / 4,
  },

  // Showcase section
  showcaseSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },

  // Demo container
  demoContainer: {
    padding: 16,
  },
  containerContent: {
    padding: 8,
  },

  // Text demo
  textDemo: {
    gap: 12,
    padding: 8,
  },

  // Button grid
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fullWidthButton: {
    width: '100%',
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },

  // Avatar row
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    padding: 8,
  },
  avatarItem: {
    alignItems: 'center',
    gap: 8,
  },
  avatarLabel: {
    marginTop: 8,
  },

  // Progress demo
  progressDemo: {
    padding: 8,
  },
  progressSpacing: {
    marginTop: 16,
  },
  progressControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },

  // Notification buttons
  notificationButtons: {
    flexDirection: 'row',
    gap: 8,
  },

  // Intensity demo
  intensityDemo: {
    gap: 12,
  },
  intensityContainer: {
    padding: 20,
    alignItems: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
  },
  footerSubtext: {
    marginTop: 8,
    opacity: 0.7,
  },
});

export default HolographicDemoScreen;

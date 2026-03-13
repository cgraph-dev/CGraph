/**
 * AddFriendScreen - Premium Mobile UI
 *
 * Enhanced friend-adding experience with animated glassmorphism cards,
 * gradient accents, haptic feedback, and interactive info cards.
 */
import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import GlassCard from '../../components/ui/glass-card';
import { Header } from '../../components';

import { FloatingParticle } from './add-friend-screen/components/floating-particle';
import { InfoStep } from './add-friend-screen/components/info-step';
import { SearchForm } from './add-friend-screen/components/search-form';
import { styles } from './add-friend-screen/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Add Friend Screen component.
 *
 */
export default function AddFriendScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 800,
    size: 4 + Math.random() * 4,
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Particles Background */}
      <View style={styles.particleContainer}>
        {particles.map((p) => (
          <FloatingParticle key={p.id} delay={p.delay} size={p.size} startX={p.startX} />
        ))}
      </View>

      <Header title="Add Friend" showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SearchForm onSuccess={() => setTimeout(() => navigation.goBack(), 2000)} />

          {/* Info Card */}
          <GlassCard variant="frosted" intensity="subtle" style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#60A5FA" />
              <Text style={styles.infoTitle}>How to find friends</Text>
            </View>
            <InfoStep
              number={1}
              title="By Username"
              description="Enter their @username (e.g., john_doe)"
              delay={200}
            />
            <InfoStep
              number={2}
              title="By User ID"
              description="Enter their 10-digit ID (e.g., #4829173650)"
              delay={350}
            />
            <InfoStep
              number={3}
              title="By Email"
              description="Enter their email address"
              delay={500}
            />
          </GlassCard>

          {/* Quick Tips */}
          <GlassCard variant="frosted" intensity="subtle" style={styles.tipsCard}>
            <View style={styles.tipRow}>
              <Ionicons name="bulb" size={20} color="#FBBF24" />
              <Text style={styles.tipText}>
                Tip: You can find your own ID in Settings → Profile to share with friends!
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

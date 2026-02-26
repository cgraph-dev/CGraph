import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '@/components/ui/glass-card';
import { Colors } from '@/lib/design/design-system';
import { styles } from '../styles';

interface Props {
  showComposer: boolean;
  composerAnim: Animated.Value;
  newPostText: string;
  setNewPostText: (text: string) => void;
  onPost: () => void;
  onClose: () => void;
  colors: {
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
  };
}

export function PostComposer({
  showComposer, composerAnim, newPostText, setNewPostText, onPost, onClose, colors,
}: Props) {
  return (
    <Animated.View
      style={[styles.composerContainer, {
        opacity: composerAnim,
        transform: [{ translateY: composerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}
      pointerEvents={showComposer ? 'auto' : 'none'}
    >
      <GlassCard variant="frosted" intensity="medium" style={styles.composerCard}>
        <View style={styles.composerHeader}>
          <Text style={[styles.composerTitle, { color: colors.text }]}>Create Post</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.composerInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textTertiary}
          value={newPostText}
          onChangeText={setNewPostText}
          multiline
          numberOfLines={4}
        />

        <View style={styles.composerActions}>
          <View style={styles.composerMedia}>
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="image" size={24} color={Colors.primary[500]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="videocam" size={24} color={Colors.purple[500]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton}>
              <Ionicons name="happy" size={24} color={Colors.amber[500]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.postButton, !newPostText.trim() && styles.postButtonDisabled]}
            onPress={onPost}
            disabled={!newPostText.trim()}
          >
            <LinearGradient
              colors={newPostText.trim()
                ? [Colors.primary[500], Colors.primary[600]]
                : [Colors.dark[600], Colors.dark[700]]}
              style={styles.postButtonGradient}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

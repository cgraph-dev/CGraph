import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style 
}: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ForumCardSkeleton() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.forumCard, { backgroundColor: colors.surface }]}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.forumCardContent}>
        <Skeleton width={120} height={16} />
        <Skeleton width={180} height={12} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={20} height={20} borderRadius={4} />
    </View>
  );
}

export function PostCardSkeleton() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.postCard, { backgroundColor: colors.surface }]}>
      <View style={styles.postHeader}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Skeleton width={100} height={14} />
          <Skeleton width={60} height={10} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width="100%" height={18} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="60%" height={14} style={{ marginTop: 4 }} />
      <View style={styles.postFooter}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function CommentSkeleton() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.comment, { backgroundColor: colors.surface }]}>
      <View style={styles.commentHeader}>
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width={80} height={12} style={{ marginLeft: 8 }} />
        <Skeleton width={40} height={10} style={{ marginLeft: 8 }} />
      </View>
      <View style={{ marginTop: 8, marginLeft: 36 }}>
        <Skeleton width="100%" height={14} />
        <Skeleton width="70%" height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function UserCardSkeleton() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
      <Skeleton width={40} height={40} borderRadius={8} />
      <Skeleton width={48} height={48} borderRadius={24} style={{ marginLeft: 12 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width={100} height={16} />
        <Skeleton width={70} height={12} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  forumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  forumCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  postCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  comment: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
  },
});

export default Skeleton;

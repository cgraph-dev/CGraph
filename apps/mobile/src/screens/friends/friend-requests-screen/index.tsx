/**
 * FriendRequestsScreen
 *
 * Friend requests management with swipeable cards and animations.
 *
 * @refactored Extracted from 1026-line file:
 * - types.ts: Types and helpers
 * - hooks/useFriendRequests.ts: State management
 * - components/RequestCard: Swipeable request card
 * - components/EmptyRequestsState: Empty state display
 * - components/TabsHeader: Animated tabs
 * - components/StatsHeader: Request counts
 */

import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';
import { Header, LoadingSpinner } from '../../../components';
import { useFriendRequests } from './hooks/useFriendRequests';
import { RequestCard, EmptyRequestsState, TabsHeader, StatsHeader } from './components';

/**
 * Friend Requests Screen component.
 *
 */
export default function FriendRequestsScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();

  const {
    activeTab,
    incomingRequests,
    outgoingRequests,
    currentRequests,
    loading,
    refreshing,
    processingId,
    headerOpacity,
    statsScale,
    handleAccept,
    handleDecline,
    handleTabPress,
    onRefresh,
  } = useFriendRequests();

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: statsScale.value }],
  }));

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Friend Requests" showBack onBack={() => navigation.goBack()} />

      {/* Stats Header */}
      <Animated.View style={headerAnimStyle}>
        <StatsHeader
          incomingCount={incomingRequests.length}
          outgoingCount={outgoingRequests.length}
        />
      </Animated.View>

      {/* Premium Tabs */}
      <TabsHeader
        activeTab={activeTab}
        onTabPress={handleTabPress}
        incomingCount={incomingRequests.length}
        outgoingCount={outgoingRequests.length}
      />

      {/* Request List */}
      <FlatList
        data={currentRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RequestCard
            item={item}
            index={index}
            onAccept={handleAccept}
            onDecline={handleDecline}
            processingId={processingId}
            isIncoming={activeTab === 'incoming'}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
        ListEmptyComponent={<EmptyRequestsState type={activeTab} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

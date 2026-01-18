/**
 * ServerCard Component (Mobile)
 *
 * Mobile-optimized server/group display card matching web GroupCard.
 * Features:
 * - Server icon with status
 * - Member count
 * - Join/View actions
 * - Multiple variants
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '../ui/GlassCard';

export interface Server {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  memberCount: number;
  onlineCount?: number;
  category?: string;
  isVerified?: boolean;
  isPartner?: boolean;
  isMember?: boolean;
}

export interface ServerCardProps {
  server: Server;
  variant?: 'default' | 'compact' | 'detailed' | 'invite';
  onPress?: () => void;
  onJoin?: () => void;
}

export const ServerCard: React.FC<ServerCardProps> = ({
  server,
  variant = 'default',
  onPress,
  onJoin,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin?.();
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderBadges = () => (
    <View style={styles.badges}>
      {server.isVerified && (
        <MaterialCommunityIcons name="check-decagram" size={16} color="#3B82F6" />
      )}
      {server.isPartner && (
        <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
      )}
    </View>
  );

  if (variant === 'compact') {
    return (
      <Pressable onPress={handlePress}>
        <GlassCard style={styles.compactCard}>
          <View style={styles.compactContent}>
            {server.icon ? (
              <Image source={{ uri: server.icon }} style={styles.compactIcon} />
            ) : (
              <View style={styles.compactIconPlaceholder}>
                <Text style={styles.compactIconText}>
                  {server.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.compactInfo}>
              <View style={styles.compactNameRow}>
                <Text style={styles.compactName} numberOfLines={1}>
                  {server.name}
                </Text>
                {renderBadges()}
              </View>
              <Text style={styles.compactMembers}>
                {formatMemberCount(server.memberCount)} members
              </Text>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    );
  }

  if (variant === 'invite') {
    return (
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.inviteCard}
      >
        <View style={styles.inviteContent}>
          {server.icon ? (
            <Image source={{ uri: server.icon }} style={styles.inviteIcon} />
          ) : (
            <View style={styles.inviteIconPlaceholder}>
              <Text style={styles.inviteIconText}>
                {server.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.inviteInfo}>
            <View style={styles.inviteNameRow}>
              <Text style={styles.inviteName} numberOfLines={1}>
                {server.name}
              </Text>
              {renderBadges()}
            </View>
            
            <View style={styles.inviteStats}>
              <View style={styles.statItem}>
                <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statText}>
                  {formatMemberCount(server.onlineCount || 0)} Online
                </Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.onlineDot, { backgroundColor: '#6B7280' }]} />
                <Text style={styles.statText}>
                  {formatMemberCount(server.memberCount)} Members
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable onPress={handleJoin}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.joinButton}
          >
            <Text style={styles.joinButtonText}>
              {server.isMember ? 'Joined' : 'Join'}
            </Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    );
  }

  if (variant === 'detailed') {
    return (
      <Pressable onPress={handlePress}>
        <GlassCard style={styles.detailedCard}>
          {/* Header with banner placeholder */}
          <LinearGradient
            colors={['#374151', '#1F2937']}
            style={styles.detailedBanner}
          >
            {server.icon ? (
              <Image source={{ uri: server.icon }} style={styles.detailedIcon} />
            ) : (
              <View style={styles.detailedIconPlaceholder}>
                <Text style={styles.detailedIconText}>
                  {server.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Content */}
          <View style={styles.detailedContent}>
            <View style={styles.detailedNameRow}>
              <Text style={styles.detailedName}>{server.name}</Text>
              {renderBadges()}
            </View>

            {server.description && (
              <Text style={styles.detailedDescription} numberOfLines={2}>
                {server.description}
              </Text>
            )}

            {server.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{server.category}</Text>
              </View>
            )}

            <View style={styles.detailedStats}>
              <View style={styles.detailedStatItem}>
                <MaterialCommunityIcons name="account-group" size={18} color="#9CA3AF" />
                <Text style={styles.detailedStatText}>
                  {formatMemberCount(server.memberCount)}
                </Text>
              </View>
              {server.onlineCount !== undefined && (
                <View style={styles.detailedStatItem}>
                  <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.detailedStatText}>
                    {formatMemberCount(server.onlineCount)} online
                  </Text>
                </View>
              )}
            </View>

            <Pressable 
              onPress={server.isMember ? handlePress : handleJoin}
              style={({ pressed }) => [
                styles.detailedButton,
                server.isMember && styles.memberButton,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.detailedButtonText}>
                {server.isMember ? 'Open' : 'Join Server'}
              </Text>
            </Pressable>
          </View>
        </GlassCard>
      </Pressable>
    );
  }

  // Default variant
  return (
    <Pressable onPress={handlePress}>
      <GlassCard style={styles.defaultCard}>
        <View style={styles.defaultContent}>
          {server.icon ? (
            <Image source={{ uri: server.icon }} style={styles.defaultIcon} />
          ) : (
            <View style={styles.defaultIconPlaceholder}>
              <Text style={styles.defaultIconText}>
                {server.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.defaultInfo}>
            <View style={styles.defaultNameRow}>
              <Text style={styles.defaultName} numberOfLines={1}>
                {server.name}
              </Text>
              {renderBadges()}
            </View>
            
            {server.description && (
              <Text style={styles.defaultDescription} numberOfLines={1}>
                {server.description}
              </Text>
            )}

            <View style={styles.defaultStats}>
              <Text style={styles.defaultStatText}>
                {formatMemberCount(server.memberCount)} members
              </Text>
              {server.onlineCount !== undefined && (
                <>
                  <Text style={styles.defaultStatDivider}>•</Text>
                  <Text style={[styles.defaultStatText, { color: '#10B981' }]}>
                    {formatMemberCount(server.onlineCount)} online
                  </Text>
                </>
              )}
            </View>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
        </View>
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Compact variant
  compactCard: {
    padding: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compactIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compactInfo: {
    flex: 1,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  compactMembers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },

  // Invite variant
  inviteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  inviteIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  inviteIconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inviteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  inviteStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Detailed variant
  detailedCard: {
    overflow: 'hidden',
  },
  detailedBanner: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  detailedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#1F2937',
  },
  detailedIconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#1F2937',
  },
  detailedIconText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailedContent: {
    padding: 16,
    alignItems: 'center',
  },
  detailedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  detailedName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailedDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  detailedStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  detailedStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailedStatText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  detailedButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
  },
  memberButton: {
    backgroundColor: '#374151',
  },
  detailedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Default variant
  defaultCard: {
    padding: 14,
  },
  defaultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  defaultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  defaultInfo: {
    flex: 1,
  },
  defaultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  defaultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  defaultDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  defaultStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  defaultStatDivider: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 6,
  },
});

export default ServerCard;

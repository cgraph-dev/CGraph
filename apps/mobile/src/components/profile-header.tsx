/**
 * ProfileHeader — mobile compact profile header with banner + avatar + stats.
 * @module components/profile-header
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from './ui/avatar';
import { space, radius } from '../theme/tokens';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bannerColor?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  bio?: string;
  stats: { messages: number; friends: number; groups: number };
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onMessage?: () => void;
  onAddFriend?: () => void;
}

export const ProfileHeader = memo(function ProfileHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  bannerColor = '#5865F2',
  status = 'offline',
  bio,
  stats,
  isOwnProfile = false,
  onEditProfile,
  onMessage,
  onAddFriend,
}: ProfileHeaderProps) {
  const bannerContent = (
    <LinearGradient
      colors={['transparent', 'rgba(18,18,24,0.8)']}
      style={styles.bannerGradient}
    />
  );

  return (
    <View style={styles.container}>
      {/* Banner */}
      {bannerUrl ? (
        <ImageBackground
          source={{ uri: bannerUrl }}
          style={[styles.banner, { backgroundColor: bannerColor }]}
        >
          {bannerContent}
        </ImageBackground>
      ) : (
        <View style={[styles.banner, { backgroundColor: bannerColor }]}>
          {bannerContent}
        </View>
      )}

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <Avatar
          size="xl"
          name={displayName}
          src={avatarUrl}
          status={status}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.username}>@{username}</Text>
        {bio && <Text style={styles.bio} numberOfLines={3}>{bio}</Text>}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatItem label="Messages" value={stats.messages} />
          <StatItem label="Friends" value={stats.friends} />
          <StatItem label="Groups" value={stats.groups} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isOwnProfile ? (
            <Pressable onPress={onEditProfile} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Edit Profile</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={onMessage} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Message</Text>
              </Pressable>
              <Pressable onPress={onAddFriend} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Add Friend</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

function StatItem({ label, value }: { label: string; value: number }) {
  const display = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.value}>{display}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(18,18,24)',
  },
  banner: {
    height: 150,
    width: '100%',
  },
  bannerGradient: {
    flex: 1,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -40,
  },
  info: {
    alignItems: 'center',
    paddingHorizontal: space[4],
    paddingTop: space[2],
    paddingBottom: space[4],
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: space[2],
    lineHeight: 20,
    maxWidth: 300,
  },
  statsRow: {
    flexDirection: 'row',
    gap: space[6],
    marginTop: space[4],
  },
  actions: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[4],
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#5865F2',
    borderRadius: radius.md,
    paddingVertical: space[2],
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    paddingVertical: space[2],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});

export default ProfileHeader;

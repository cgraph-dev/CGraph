/**
 * MessageBubble Component
 *
 * Renders a single message with all its content types (text, images, video, voice, files).
 * Supports grid images, replies, reactions, and rich media embeds.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Message } from '../../../../types';
import { VoiceMessagePlayer, RichMediaEmbed } from '../../../../components';
import { AnimatedMessageWrapper, AnimatedReactionBubble, InlineVideoThumbnail } from '.';
import { styles } from '../styles';
import { getFileIcon, formatFileSize } from '../utils';
import { MarkdownText } from '../../../../components/chat/MarkdownText';
import { useBubbleCustomization, type BubbleStyle } from '../../../../hooks/useBubbleCustomization';

interface MessageBubbleProps {
  item: Message;
  isOwnMessage: boolean;
  senderDisplayName: string;
  senderAvatarUrl: string | null | undefined;
  isNewMessage: boolean;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
    input: string;
    [key: string]: unknown; // Allow additional color properties
  };
  formatTime: (dateString: string) => string;
  getMessageStatus: (
    message: Message,
    isOwnMessage: boolean
  ) => { icon: 'checkmark' | 'checkmark-done' | 'checkmark-done'; color: string } | null;
  onLongPress: (message: Message) => void;
  onImagePress: (url: string, gallery?: string[], index?: number) => void;
  onVideoPress: (url: string, duration?: number) => void;
  onFilePress: (url: string, filename?: string) => void;
  onReactionTap: (messageId: string, emoji: string, hasReacted: boolean) => void;
}

/**
 * Complete message bubble with all content types.
 */
export function MessageBubble({
  item,
  isOwnMessage,
  senderDisplayName,
  senderAvatarUrl,
  isNewMessage,
  colors,
  formatTime,
  getMessageStatus,
  onLongPress,
  onImagePress,
  onVideoPress,
  onFilePress,
  onReactionTap,
}: MessageBubbleProps) {
  // Read user's chat bubble customization (colors, radius, gradient, etc.)
  const bubble = useBubbleCustomization();

  return (
    <AnimatedMessageWrapper isOwnMessage={isOwnMessage} index={0} isNew={isNewMessage}>
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => onLongPress(item)}
        delayLongPress={400}
      >
        <View
          style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}
        >
          {/* Avatar for other user's messages */}
          {!isOwnMessage && (
            <View style={styles.avatarSmall}>
              {senderAvatarUrl ? (
                <Image source={{ uri: senderAvatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: bubble.ownMessageBg }]}>
                  <Text style={styles.avatarText}>{senderDisplayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
          )}

          {/* Pin indicator */}
          {item.is_pinned && (
            <View style={styles.pinnedIndicator}>
              <Ionicons name="pin" size={12} color={bubble.ownMessageBg} />
            </View>
          )}

          {/* Message bubble — uses customized colors/gradient from settings */}
          {isOwnMessage ? (
            <LinearGradient
              colors={
                bubble.useGradient
                  ? [bubble.ownMessageBg, `${bubble.ownMessageBg}AA`]
                  : [bubble.ownMessageBg, bubble.ownMessageBg]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.messageBubble,
                styles.ownMessageBubble,
                { borderRadius: bubble.borderRadius },
                item.is_pinned && styles.pinnedBubble,
              ]}
            >
              <MessageContent
                item={item}
                isOwnMessage={isOwnMessage}
                colors={colors}
                formatTime={formatTime}
                getMessageStatus={getMessageStatus}
                onImagePress={onImagePress}
                onVideoPress={onVideoPress}
                onFilePress={onFilePress}
                onReactionTap={onReactionTap}
              />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.messageBubble,
                styles.otherMessageBubble,
                {
                  backgroundColor: bubble.otherMessageBg,
                  borderRadius: bubble.borderRadius,
                },
                item.is_pinned && styles.pinnedBubble,
              ]}
            >
              <MessageContent
                item={item}
                isOwnMessage={isOwnMessage}
                colors={colors}
                formatTime={formatTime}
                getMessageStatus={getMessageStatus}
                onImagePress={onImagePress}
                onVideoPress={onVideoPress}
                onFilePress={onFilePress}
                onReactionTap={onReactionTap}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </AnimatedMessageWrapper>
  );
}

// Internal component for message content
interface MessageContentProps {
  item: Message;
  isOwnMessage: boolean;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    input: string;
    [key: string]: unknown; // Allow additional color properties
  };
  formatTime: (dateString: string) => string;
  getMessageStatus: (
    message: Message,
    isOwnMessage: boolean
  ) => { icon: 'checkmark' | 'checkmark-done' | 'checkmark-done'; color: string } | null;
  onImagePress: (url: string, gallery?: string[], index?: number) => void;
  onVideoPress: (url: string, duration?: number) => void;
  onFilePress: (url: string, filename?: string) => void;
  onReactionTap: (messageId: string, emoji: string, hasReacted: boolean) => void;
}

function MessageContent({
  item,
  isOwnMessage,
  colors,
  formatTime,
  getMessageStatus,
  onImagePress,
  onVideoPress,
  onFilePress,
  onReactionTap,
}: MessageContentProps) {
  return (
    <>
      {/* Reply preview if this message is a reply */}
      {item.reply_to && (
        <View
          style={[
            styles.replyContainer,
            {
              backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
              borderLeftColor: isOwnMessage ? 'rgba(255,255,255,0.5)' : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.replyAuthor,
              { color: isOwnMessage ? 'rgba(255,255,255,0.9)' : colors.primary },
            ]}
            numberOfLines={1}
          >
            {item.reply_to.sender?.display_name || item.reply_to.sender?.username || 'Unknown'}
          </Text>
          <Text
            style={[
              styles.replyText,
              { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {item.reply_to.content ||
              (item.reply_to.type === 'image'
                ? 'Photo'
                : item.reply_to.type === 'file'
                  ? 'File'
                  : 'Message')}
          </Text>
        </View>
      )}

      {/* Image Grid messages */}
      {item.type === 'image' &&
        item.metadata?.grid_images &&
        Array.isArray(item.metadata.grid_images) &&
        item.metadata.grid_images.length > 0 && (
          <ImageGridContent item={item} onImagePress={onImagePress} />
        )}

      {/* Single Image messages (only if NOT a grid) */}
      {item.type === 'image' && item.metadata?.url && !item.metadata?.grid_images && (
        <SingleImageContent
          url={item.metadata.url}
          onPress={() => onImagePress(item.metadata!.url!)}
        />
      )}

      {/* File messages */}
      {item.type === 'file' && item.metadata?.url && (
        <FileContent
          item={item}
          isOwnMessage={isOwnMessage}
          colors={colors}
          onPress={() => onFilePress(item.metadata!.url!, item.metadata?.filename)}
        />
      )}

      {/* Video messages */}
      {item.type === 'video' && item.metadata?.url && (
        <VideoContent
          item={item}
          onPress={() => onVideoPress(item.metadata!.url!, item.metadata?.duration)}
        />
      )}

      {/* Voice messages */}
      {(item.type === 'voice' || item.type === 'audio') && item.metadata?.url && (
        <VoiceMessagePlayer
          audioUrl={item.metadata.url}
          duration={item.metadata.duration || 0}
          waveformData={item.metadata.waveform}
          isSender={isOwnMessage}
        />
      )}

      {/* Text content - hide for voice, video, and image messages with default placeholder content */}
      {item.content &&
        item.type !== 'voice' &&
        item.type !== 'audio' &&
        item.type !== 'video' &&
        item.type !== 'image' &&
        !item.content.match(/^(📷 Photo|Photo|🎥 Video|Video|📎 .+|\d+ photos?)$/) && (
          <MarkdownText style={styles.messageText} color={isOwnMessage ? '#fff' : colors.text}>
            {item.content}
          </MarkdownText>
        )}

      {/* Show caption for media if it's not just a placeholder */}
      {item.content &&
        (item.type === 'video' || item.type === 'image') &&
        !item.content.match(/^(📷 Photo|Photo|🎥 Video|Video|\d+ photos?)$/) && (
          <MarkdownText style={styles.messageText} color={isOwnMessage ? '#fff' : colors.text}>
            {item.content}
          </MarkdownText>
        )}

      {/* Rich Media Embeds for URLs in text messages */}
      {item.content && item.type === 'text' && item.content.match(/https?:\/\/[^\s]+/) && (
        <RichMediaEmbed content={item.content} isOwnMessage={isOwnMessage} maxEmbeds={2} />
      )}

      {/* Message footer with time and status */}
      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.messageTime,
            { color: isOwnMessage ? 'rgba(255,255,255,0.75)' : colors.textTertiary },
          ]}
        >
          {formatTime(item.inserted_at)}
          {item.is_edited && ' • edited'}
        </Text>
        {isOwnMessage &&
          (() => {
            const statusInfo = getMessageStatus(item, isOwnMessage);
            if (!statusInfo) return null;
            return (
              <Ionicons
                name={statusInfo.icon}
                size={14}
                color={statusInfo.color}
                style={styles.messageStatusIcon}
              />
            );
          })()}
      </View>

      {/* Reactions display with animations */}
      {item.reactions && item.reactions.length > 0 && (
        <View
          style={[
            styles.reactionsContainer,
            isOwnMessage ? styles.reactionsOwn : styles.reactionsOther,
          ]}
        >
          {item.reactions.map((reaction, index) => (
            <AnimatedReactionBubble
              key={`${reaction.emoji}-${index}`}
              reaction={reaction}
              isOwnMessage={isOwnMessage}
              onPress={() => onReactionTap(item.id, reaction.emoji, reaction.hasReacted)}
              colors={colors as Parameters<typeof AnimatedReactionBubble>[0]['colors']}
            />
          ))}
        </View>
      )}
    </>
  );
}

// Image Grid sub-component
function ImageGridContent({
  item,
  onImagePress,
}: {
  item: Message;
  onImagePress: (url: string, gallery?: string[], index?: number) => void;
}) {
  const images = item.metadata!.grid_images as string[];
  const count = images.length;

  const gridStyle =
    count === 1
      ? styles.imageGridSingle
      : count === 2
        ? styles.imageGridTwo
        : count === 3
          ? styles.imageGridThree
          : count === 4
            ? styles.imageGridFour
            : styles.imageGridMany;

  return (
    <View style={styles.imageGrid}>
      <View style={gridStyle}>
        {images.slice(0, 4).map((imgUrl, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.9}
            onPress={() => onImagePress(imgUrl, images, idx)}
            style={[
              styles.gridImageContainer,
              count === 1 && styles.gridImageFull,
              count === 2 && styles.gridImageHalf,
              count === 3 && (idx === 0 ? styles.gridImageThreeMain : styles.gridImageThreeSide),
              count >= 4 && styles.gridImageQuarter,
            ]}
          >
            <Image source={{ uri: imgUrl }} style={styles.gridImage} resizeMode="cover" />
            {idx === 3 && count > 4 && (
              <View style={styles.gridMoreOverlay}>
                <Text style={styles.gridMoreText}>+{count - 4}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {images.length > 1 && (
        <View style={styles.imageGridBadge}>
          <Text style={styles.imageGridBadgeText}>{images.length} photos</Text>
        </View>
      )}
    </View>
  );
}

// Single Image sub-component
function SingleImageContent({ url, onPress }: { url: string; onPress: () => void }) {
  return (
    <View>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <Image source={{ uri: url }} style={styles.messageImage} resizeMode="cover" />
        <View style={styles.imageOverlay}>
          <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.9)" />
        </View>
      </TouchableOpacity>
      <View style={styles.imageGridBadge}>
        <Text style={styles.imageGridBadgeText}>Photo</Text>
      </View>
    </View>
  );
}

// File sub-component
function FileContent({
  item,
  isOwnMessage,
  colors,
  onPress,
}: {
  item: Message;
  isOwnMessage: boolean;
  colors: { primary: string; text: string; textSecondary: string; input: string };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.fileAttachment,
        { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.15)' : colors.input },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.fileIconContainer,
          { backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : colors.primary + '20' },
        ]}
      >
        <Ionicons
          name={getFileIcon(item.metadata?.filename) as 'document-outline'}
          size={20}
          color={isOwnMessage ? '#fff' : colors.primary}
        />
      </View>
      <View style={styles.fileInfo}>
        <Text
          style={{ color: isOwnMessage ? '#fff' : colors.text, fontWeight: '600' }}
          numberOfLines={1}
        >
          {item.metadata?.filename || 'File'}
        </Text>
        {item.metadata?.size && (
          <Text
            style={{
              color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {formatFileSize(item.metadata.size)}
          </Text>
        )}
      </View>
      <Ionicons
        name="download-outline"
        size={20}
        color={isOwnMessage ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

// Video sub-component
function VideoContent({ item, onPress }: { item: Message; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.videoMessageContainer}>
      {item.metadata?.thumbnail ? (
        <Image
          source={{ uri: item.metadata.thumbnail }}
          style={styles.videoThumbnail}
          resizeMode="cover"
        />
      ) : (
        <InlineVideoThumbnail videoUrl={item.metadata!.url!} />
      )}
      <View style={styles.videoPlayOverlayMessage}>
        <View style={styles.videoPlayButtonMessage}>
          <Ionicons name="play" size={32} color="#fff" />
        </View>
      </View>
      {item.metadata?.duration && (
        <View style={styles.videoDurationBadgeMessage}>
          <Text style={styles.videoDurationTextMessage}>
            {Math.floor(item.metadata.duration / 60)}:
            {String(Math.floor(item.metadata.duration % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default MessageBubble;

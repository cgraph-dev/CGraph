/**
 * Forum post screen for viewing and interacting with individual posts.
 * @module screens/forums/post-screen
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { VoteButtons } from './components/vote-buttons';
import { useThemeStore } from '@/stores';
import { useAuthStore } from '@/stores';
import { PostCardSkeleton, CommentSkeleton } from '../../components/skeleton';
import api from '../../lib/api';
import { safeFormatMessageTime } from '../../lib/dateUtils';
import { ForumsStackParamList, Post, Comment, PostEditHistory } from '../../types';
import ThreadPrefixBadge from '../../components/forums/thread-prefix-badge';
import ThreadRatingDisplay from '../../components/forums/thread-rating-display';
import AttachmentList from '../../components/forums/attachment-list';
import PollWidget from '../../components/forums/poll-widget';
import EditHistoryModal from '../../components/forums/edit-history-modal';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'Post'>;
  route: RouteProp<ForumsStackParamList, 'Post'>;
};

export default function PostScreen({ navigation: _navigation, route }: Props) {
  const { postId } = route.params;
  const { colors } = useThemeStore();
  const { user: _user } = useAuthStore();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);
  
  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);
  
  const fetchPost = async () => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}`);
      setPost(response.data.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };
  
  const fetchComments = async () => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}/comments`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVotePost = async (value: 1 | -1) => {
    if (!post) return;
    // Haptic feedback on vote
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await api.post(`/api/v1/posts/${postId}/vote`, { value });
      setPost((prev) => {
        if (!prev) return prev;
        const oldVote = prev.my_vote || 0;
        const newVote = prev.my_vote === value ? undefined : value;
        return {
          ...prev,
          my_vote: newVote,
          vote_count: prev.vote_count - oldVote + (newVote || 0),
        };
      });
    } catch (error) {
      console.error('Error voting:', error);
    }
  };
  
  const submitComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/v1/posts/${postId}/comments`, {
        content: commentText,
      });
      setComments((prev) => [response.data.data, ...prev]);
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRateThread = async (rating: number) => {
    if (!post) return;
    try {
      await api.post(`/api/v1/threads/${postId}/rate`, { rating });
      setPost((prev) => {
        if (!prev) return prev;
        const oldRating = prev.my_rating || 0;
        const ratingCount = prev.rating_count || 0;
        const currentTotal = (prev.rating || 0) * ratingCount;
        const newTotal = currentTotal - oldRating + rating;
        const newCount = oldRating ? ratingCount : ratingCount + 1;
        return {
          ...prev,
          my_rating: rating,
          rating: newCount > 0 ? newTotal / newCount : 0,
          rating_count: newCount,
        };
      });
    } catch (error) {
      console.error('Error rating thread:', error);
    }
  };

  const handleVotePoll = async (optionIds: string[]) => {
    try {
      await api.post(`/api/v1/polls/${post?.poll?.id}/vote`, { option_ids: optionIds });
      await fetchPost(); // Refresh to get updated results
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw error;
    }
  };

  const handleClosePoll = async () => {
    try {
      await api.post(`/api/v1/polls/${post?.poll?.id}/close`);
      await fetchPost();
    } catch (error) {
      console.error('Error closing poll:', error);
      throw error;
    }
  };

  const fetchEditHistory = async (postId: string): Promise<PostEditHistory[]> => {
    try {
      const response = await api.get(`/api/v1/posts/${postId}/edit-history`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching edit history:', error);
      return [];
    }
  };
  
  const renderComment = useCallback((comment: Comment, depth: number = 0) => {
    const authorName = comment.author?.username || comment.author?.display_name || 'unknown';
    return (
      <View key={comment.id} style={[styles.comment, { marginLeft: depth * 16 }]}>
        <View style={[styles.commentLine, { backgroundColor: colors.border }]} />
        <View style={styles.commentContent}>
          <Text style={[styles.commentMeta, { color: colors.textSecondary }]}>
            u/{authorName} • {safeFormatMessageTime(comment.inserted_at)}
          </Text>
          <Text style={[styles.commentText, { color: colors.text }]}>
            {comment.content}
          </Text>
          <View style={styles.commentActions}>
            <TouchableOpacity style={styles.commentAction}>
              <Ionicons name="arrow-up-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>
                {comment.vote_count}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commentAction}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.commentActionText, { color: colors.textSecondary }]}>
                Reply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
      </View>
    );
  }, [colors]);
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 16 }}>
          <PostCardSkeleton />
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.commentsTitle, { color: colors.text }]}>Comments</Text>
            {[1, 2, 3].map((i) => (
              <CommentSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
  
  if (!post) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Post not found</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Post */}
        <View style={[styles.postContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
            c/{post.forum.slug} • u/{post.author?.username || post.author?.display_name || 'unknown'} • {safeFormatMessageTime(post.inserted_at)}
          </Text>
          
          {/* Prefix and Status Badges */}
          <View style={styles.badgesRow}>
            {post.prefix && (
              <ThreadPrefixBadge prefix={post.prefix} size="md" />
            )}
            {post.is_pinned && (
              <View style={[styles.badge, { backgroundColor: '#16a34a' }]}>
                <Ionicons name="pin" size={12} color="#fff" />
                <Text style={styles.badgeText}>Pinned</Text>
              </View>
            )}
            {post.is_locked && (
              <View style={[styles.badge, { backgroundColor: '#ca8a04' }]}>
                <Ionicons name="lock-closed" size={12} color="#fff" />
                <Text style={styles.badgeText}>Locked</Text>
              </View>
            )}
            {post.is_closed && (
              <View style={[styles.badge, { backgroundColor: '#dc2626' }]}>
                <Ionicons name="close-circle" size={12} color="#fff" />
                <Text style={styles.badgeText}>Closed</Text>
              </View>
            )}
          </View>

          <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>

          {/* Thread Rating */}
          {(post.rating !== undefined || post.rating_count !== undefined) && (
            <View style={styles.ratingSection}>
              <ThreadRatingDisplay
                rating={post.rating || 0}
                ratingCount={post.rating_count || 0}
                myRating={post.my_rating}
                onRate={handleRateThread}
                size="md"
                interactive={!post.is_closed && !post.is_locked}
              />
            </View>
          )}
          {post.content && (
            <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
          )}

          {/* Poll Widget */}
          {post.poll && (
            <View style={styles.pollSection}>
              <PollWidget
                poll={post.poll}
                isCreator={post.author?.id === _user?.id}
                onVote={handleVotePoll}
                onClose={handleClosePoll}
              />
            </View>
          )}

          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <AttachmentList attachments={post.attachments} />
            </View>
          )}

          {/* Edit History Link */}
          {post.edit_history && post.edit_history.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowEditHistory(true);
              }}
              style={styles.editHistoryButton}
            >
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.editHistoryText, { color: colors.textSecondary }]}>
                Edited {post.edit_history.length} {post.edit_history.length === 1 ? 'time' : 'times'} • View history
              </Text>
            </TouchableOpacity>
          )}

          {/* Post actions */}
          <View style={styles.postActions}>
            <VoteButtons
              voteCount={post.vote_count}
              myVote={(post.my_vote || 0) as 0 | 1 | -1}
              onVote={(dir) => handleVotePost(dir)}
              size={22}
              colors={colors}
            />
            
            <View style={styles.postAction}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>
                {post.comment_count} Comments
              </Text>
            </View>
            
            <TouchableOpacity style={styles.postAction}>
              <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.postActionText, { color: colors.textSecondary }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Comments */}
        <View style={styles.commentsContainer}>
          {comments.map((comment) => renderComment(comment))}
        </View>
      </ScrollView>
      
      {/* Comment input */}
      {post.is_locked ? (
        <View style={[styles.lockedContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Ionicons name="lock-closed" size={18} color="#ca8a04" />
          <Text style={[styles.lockedText, { color: '#ca8a04' }]}>
            This post is locked. New comments are disabled.
          </Text>
        </View>
      ) : (
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: colors.input, color: colors.text }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: commentText.trim() ? colors.primary : colors.surfaceHover },
            ]}
            onPress={submitComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={commentText.trim() ? '#fff' : colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Edit History Modal */}
      <EditHistoryModal
        visible={showEditHistory}
        onClose={() => setShowEditHistory(false)}
        postId={postId}
        onFetchHistory={fetchEditHistory}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: 16,
    marginBottom: 8,
  },
  postMeta: {
    fontSize: 12,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 12,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  voteButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
  },
  commentsContainer: {
    padding: 16,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentLine: {
    width: 2,
    marginRight: 12,
    borderRadius: 1,
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    fontSize: 11,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  lockedText: {
    fontSize: 14,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingSection: {
    marginBottom: 12,
  },
  pollSection: {
    marginBottom: 16,
  },
  attachmentsSection: {
    marginBottom: 16,
  },
  editHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 12,
  },
  editHistoryText: {
    fontSize: 12,
  },
});

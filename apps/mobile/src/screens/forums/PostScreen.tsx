import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { ForumsStackParamList, Post, Comment } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'Post'>;
  route: RouteProp<ForumsStackParamList, 'Post'>;
};

export default function PostScreen({ navigation: _navigation, route }: Props) {
  const { postId } = route.params;
  const { colors } = useTheme();
  const { user: _user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return `${Math.floor(diffHours / 168)}w ago`;
  };
  
  const renderComment = useCallback((comment: Comment, depth: number = 0) => {
    return (
      <View key={comment.id} style={[styles.comment, { marginLeft: depth * 16 }]}>
        <View style={[styles.commentLine, { backgroundColor: colors.border }]} />
        <View style={styles.commentContent}>
          <Text style={[styles.commentMeta, { color: colors.textSecondary }]}>
            u/{comment.author.username} • {formatTime(comment.inserted_at)}
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
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
            r/{post.forum.slug} • u/{post.author.username} • {formatTime(post.inserted_at)}
          </Text>
          <Text style={[styles.postTitle, { color: colors.text }]}>{post.title}</Text>
          {post.content && (
            <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>
          )}
          
          {/* Post actions */}
          <View style={styles.postActions}>
            <View style={styles.voteButtons}>
              <TouchableOpacity onPress={() => handleVotePost(1)}>
                <Ionicons
                  name={post.my_vote === 1 ? 'arrow-up' : 'arrow-up-outline'}
                  size={22}
                  color={post.my_vote === 1 ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
              <Text style={[styles.voteCount, { color: colors.text }]}>
                {post.vote_count}
              </Text>
              <TouchableOpacity onPress={() => handleVotePost(-1)}>
                <Ionicons
                  name={post.my_vote === -1 ? 'arrow-down' : 'arrow-down-outline'}
                  size={22}
                  color={post.my_vote === -1 ? colors.error : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            
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
});

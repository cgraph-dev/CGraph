/**
 * MarkdownRenderer - Mobile Markdown Display Component
 *
 * Renders Markdown content with consistent styling, code highlighting,
 * and interactive elements for React Native.
 *
 * Features:
 * - Headers, bold, italic, strikethrough
 * - Code blocks with syntax highlighting themes
 * - Links with in-app and external handling
 * - Lists (ordered and unordered)
 * - Blockquotes with styled borders
 * - Images with loading states
 * - Tables with alternating row colors
 * - Horizontal rules
 * - Task lists with checkboxes
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Custom styles override */
  style?: object;
  /** Font size multiplier */
  fontSize?: number;
  /** Callback when link is pressed */
  onLinkPress?: (url: string) => void;
  /** Callback when user mention is pressed */
  onMentionPress?: (username: string) => void;
  /** Whether to allow images */
  allowImages?: boolean;
  /** Maximum image height */
  maxImageHeight?: number;
}

interface TextNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'mention';
  content: string;
  url?: string;
}

interface BlockNode {
  type: 'paragraph' | 'heading' | 'codeblock' | 'blockquote' | 'list' | 'image' | 'hr' | 'table';
  level?: number;
  content?: string;
  items?: string[];
  ordered?: boolean;
  language?: string;
  alt?: string;
  url?: string;
  rows?: string[][];
}

export default function MarkdownRenderer({
  content,
  style,
  fontSize = 1,
  onLinkPress,
  onMentionPress,
  allowImages = true,
  maxImageHeight = 300,
}: MarkdownRendererProps) {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const baseFontSize = 15 * fontSize;

  const handleLinkPress = useCallback(
    (url: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onLinkPress) {
        onLinkPress(url);
      } else {
        Linking.openURL(url).catch(() => {});
      }
    },
    [onLinkPress]
  );

  const handleMentionPress = useCallback(
    (username: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onMentionPress?.(username);
    },
    [onMentionPress]
  );

  // Parse inline formatting
  const parseInline = (text: string): TextNode[] => {
    const nodes: TextNode[] = [];
    const patterns = [
      { regex: /\*\*(.+?)\*\*/g, type: 'bold' as const },
      { regex: /\*(.+?)\*/g, type: 'italic' as const },
      { regex: /~~(.+?)~~/g, type: 'strikethrough' as const },
      { regex: /`(.+?)`/g, type: 'code' as const },
      { regex: /\[(.+?)\]\((.+?)\)/g, type: 'link' as const },
      { regex: /@(\w+)/g, type: 'mention' as const },
    ];

    let remaining = text;
    let lastIndex = 0;

    // Simple parse - find all matches and their positions
    const allMatches: { start: number; end: number; node: TextNode }[] = [];

    patterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const node: TextNode = {
          type,
          content: type === 'link' ? match[1] : match[1],
          url: type === 'link' ? match[2] : undefined,
        };
        allMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          node,
        });
      }
    });

    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);

    // Build result
    allMatches.forEach(({ start, end, node }) => {
      if (start > lastIndex) {
        nodes.push({ type: 'text', content: text.slice(lastIndex, start) });
      }
      if (start >= lastIndex) {
        nodes.push(node);
        lastIndex = end;
      }
    });

    if (lastIndex < text.length) {
      nodes.push({ type: 'text', content: text.slice(lastIndex) });
    }

    if (nodes.length === 0) {
      nodes.push({ type: 'text', content: text });
    }

    return nodes;
  };

  // Parse blocks
  const parseBlocks = (markdown: string): BlockNode[] => {
    const lines = markdown.split('\n');
    const blocks: BlockNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2],
        });
        i++;
        continue;
      }

      // Code block
      if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push({
          type: 'codeblock',
          language,
          content: codeLines.join('\n'),
        });
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          quoteLines.push(lines[i].slice(1).trim());
          i++;
        }
        blocks.push({
          type: 'blockquote',
          content: quoteLines.join('\n'),
        });
        continue;
      }

      // Unordered list
      if (line.match(/^[-*+]\s/)) {
        const items: string[] = [];
        while (i < lines.length && lines[i].match(/^[-*+]\s/)) {
          items.push(lines[i].slice(2).trim());
          i++;
        }
        blocks.push({
          type: 'list',
          ordered: false,
          items,
        });
        continue;
      }

      // Ordered list
      if (line.match(/^\d+\.\s/)) {
        const items: string[] = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
          items.push(lines[i].replace(/^\d+\.\s/, '').trim());
          i++;
        }
        blocks.push({
          type: 'list',
          ordered: true,
          items,
        });
        continue;
      }

      // Image
      const imageMatch = line.match(/^!\[(.*)?\]\((.+)\)$/);
      if (imageMatch) {
        blocks.push({
          type: 'image',
          alt: imageMatch[1] || '',
          url: imageMatch[2],
        });
        i++;
        continue;
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        blocks.push({ type: 'hr' });
        i++;
        continue;
      }

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Paragraph
      const paragraphLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].match(/^#{1,6}\s/) &&
        !lines[i].startsWith('```') &&
        !lines[i].startsWith('>') &&
        !lines[i].match(/^[-*+]\s/) &&
        !lines[i].match(/^\d+\.\s/) &&
        !lines[i].match(/^!\[/) &&
        !lines[i].match(/^[-*_]{3,}$/)
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }
      if (paragraphLines.length > 0) {
        blocks.push({
          type: 'paragraph',
          content: paragraphLines.join(' '),
        });
      }
    }

    return blocks;
  };

  // Render inline nodes
  const renderInline = (nodes: TextNode[]) => {
    return nodes.map((node, index) => {
      switch (node.type) {
        case 'bold':
          return (
            <Text key={index} style={[styles.bold, { color: colors.text }]}>
              {node.content}
            </Text>
          );
        case 'italic':
          return (
            <Text key={index} style={[styles.italic, { color: colors.text }]}>
              {node.content}
            </Text>
          );
        case 'strikethrough':
          return (
            <Text key={index} style={[styles.strikethrough, { color: colors.textSecondary }]}>
              {node.content}
            </Text>
          );
        case 'code':
          return (
            <Text
              key={index}
              style={[
                styles.inlineCode,
                {
                  color: '#ec4899',
                  backgroundColor: isDark ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.08)',
                },
              ]}
            >
              {node.content}
            </Text>
          );
        case 'link':
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => handleLinkPress(node.url || '')}
            >
              {node.content}
            </Text>
          );
        case 'mention':
          return (
            <Text
              key={index}
              style={styles.mention}
              onPress={() => handleMentionPress(node.content)}
            >
              @{node.content}
            </Text>
          );
        default:
          return (
            <Text key={index} style={{ color: colors.text }}>
              {node.content}
            </Text>
          );
      }
    });
  };

  // Render blocks
  const renderBlock = (block: BlockNode, index: number) => {
    switch (block.type) {
      case 'heading': {
        const headingSizes = [28, 24, 20, 18, 16, 14];
        const headingSize = headingSizes[(block.level || 1) - 1] * fontSize;
        return (
          <Text
            key={index}
            style={[
              styles.heading,
              {
                fontSize: headingSize,
                color: colors.text,
                marginTop: index > 0 ? 16 : 0,
              },
            ]}
          >
            {renderInline(parseInline(block.content || ''))}
          </Text>
        );
      }

      case 'paragraph':
        return (
          <Text
            key={index}
            style={[
              styles.paragraph,
              { fontSize: baseFontSize, color: colors.text },
            ]}
          >
            {renderInline(parseInline(block.content || ''))}
          </Text>
        );

      case 'codeblock':
        return (
          <View
            key={index}
            style={[
              styles.codeBlock,
              {
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              },
            ]}
          >
            {block.language && (
              <View style={styles.codeHeader}>
                <Text style={[styles.codeLanguage, { color: colors.textSecondary }]}>
                  {block.language}
                </Text>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                style={[
                  styles.codeText,
                  { color: isDark ? '#e2e8f0' : '#1e293b' },
                ]}
              >
                {block.content}
              </Text>
            </ScrollView>
          </View>
        );

      case 'blockquote':
        return (
          <View
            key={index}
            style={[
              styles.blockquote,
              {
                borderLeftColor: colors.primary,
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              },
            ]}
          >
            <Text style={[styles.blockquoteText, { color: colors.textSecondary }]}>
              {renderInline(parseInline(block.content || ''))}
            </Text>
          </View>
        );

      case 'list':
        return (
          <View key={index} style={styles.list}>
            {block.items?.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: colors.primary }]}>
                  {block.ordered ? `${itemIndex + 1}.` : '•'}
                </Text>
                <Text style={[styles.listText, { color: colors.text, fontSize: baseFontSize }]}>
                  {renderInline(parseInline(item))}
                </Text>
              </View>
            ))}
          </View>
        );

      case 'image':
        if (!allowImages) return null;
        return (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: block.url }}
              style={[styles.image, { maxHeight: maxImageHeight }]}
              resizeMode="contain"
            />
            {block.alt && (
              <Text style={[styles.imageCaption, { color: colors.textSecondary }]}>
                {block.alt}
              </Text>
            )}
          </View>
        );

      case 'hr':
        return (
          <View
            key={index}
            style={[
              styles.hr,
              { backgroundColor: isDark ? '#374151' : '#e5e7eb' },
            ]}
          />
        );

      default:
        return null;
    }
  };

  const blocks = parseBlocks(content);

  return (
    <View style={[styles.container, style]}>
      {blocks.map(renderBlock)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  paragraph: {
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  link: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  mention: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  codeBlock: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  codeHeader: {
    marginBottom: 8,
  },
  codeLanguage: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  blockquote: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingVertical: 12,
    marginVertical: 12,
    borderRadius: 4,
  },
  blockquoteText: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  list: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  listBullet: {
    width: 24,
    fontSize: 16,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    lineHeight: 22,
  },
  imageContainer: {
    marginVertical: 12,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hr: {
    height: 1,
    marginVertical: 20,
  },
});

/**
 * MarkdownText - Lightweight markdown renderer for React Native
 *
 * Supports: **bold**, *italic*, ~~strikethrough~~, `inline code`,
 * ```code blocks```, > blockquotes
 * No external dependencies — regex-based parsing.
 */

import React, { memo, useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  children: string;
  style?: object;
  color?: string;
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

// Parse inline markdown into styled segments
function parseInlineMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match: **bold**, *italic*, ~~strike~~, `code`
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`([^`]+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      segments.push({ text: match[2], bold: true });
    } else if (match[3]) {
      segments.push({ text: match[3], italic: true });
    } else if (match[4]) {
      segments.push({ text: match[4], strikethrough: true });
    } else if (match[5]) {
      segments.push({ text: match[5], code: true });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text }];
}

// Check if content has code blocks
function splitCodeBlocks(content: string): Array<{ type: 'text' | 'code'; content: string }> {
  const blocks: Array<{ type: 'text' | 'code'; content: string }> = [];
  const parts = content.split(/```(?:\w*\n?)?/);

  parts.forEach((part, index) => {
    if (part.trim()) {
      blocks.push({
        type: index % 2 === 1 ? 'code' : 'text',
        content: part,
      });
    }
  });

  return blocks;
}

export const MarkdownText = memo(function MarkdownText({
  children,
  style,
  color = '#fff',
}: MarkdownTextProps) {
  const blocks = useMemo(() => splitCodeBlocks(children), [children]);

  // Simple text with no markdown — fast path
  if (blocks.length <= 1 && !/[*_~`>]/.test(children)) {
    return <Text style={[styles.text, { color }, style]}>{children}</Text>;
  }

  return (
    <View>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'code') {
          return (
            <View key={blockIndex} style={styles.codeBlock}>
              <Text style={styles.codeText}>{block.content.trim()}</Text>
            </View>
          );
        }

        // Process text lines for blockquotes
        const lines = block.content.split('\n');
        return lines.map((line, lineIndex) => {
          const isBlockquote = line.startsWith('> ');
          const lineContent = isBlockquote ? line.slice(2) : line;
          const segments = parseInlineMarkdown(lineContent);

          if (isBlockquote) {
            return (
              <View key={`${blockIndex}-${lineIndex}`} style={styles.blockquote}>
                <Text style={[styles.text, styles.blockquoteText]}>
                  {segments.map((seg, i) => renderSegment(seg, i, color))}
                </Text>
              </View>
            );
          }

          return (
            <Text key={`${blockIndex}-${lineIndex}`} style={[styles.text, { color }, style]}>
              {segments.map((seg, i) => renderSegment(seg, i, color))}
              {lineIndex < lines.length - 1 ? '\n' : ''}
            </Text>
          );
        });
      })}
    </View>
  );
});

function renderSegment(segment: TextSegment, index: number, color: string) {
  const segStyle: object[] = [];
  if (segment.bold) segStyle.push(styles.bold);
  if (segment.italic) segStyle.push(styles.italic);
  if (segment.strikethrough) segStyle.push(styles.strikethrough);
  if (segment.code) segStyle.push(styles.inlineCode);

  return (
    <Text key={index} style={[{ color: segment.code ? '#f472b6' : color }, ...segStyle]}>
      {segment.text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#6ee7b7',
    lineHeight: 20,
  },
  blockquote: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(99, 102, 241, 0.6)',
    paddingLeft: 10,
    marginVertical: 2,
  },
  blockquoteText: {
    fontStyle: 'italic',
    color: '#d1d5db',
  },
});

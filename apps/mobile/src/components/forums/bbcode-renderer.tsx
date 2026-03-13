/**
 * BBCode Renderer — converts BBCode markup to native React Native components.
 *
 * Supports: [b], [i], [u], [s], [url], [img], [quote], [code], [list],
 * [color], [size], [spoiler], [center], and nested combinations.
 *
 * @module components/forums/bbcode-renderer
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Linking,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BBCodeRendererProps {
  /** BBCode string to render */
  content: string;
  /** Optional additional style for the root wrapper */
  style?: ViewStyle;
}

/** A parsed token from the BBCode string */
type BBNode =
  | { type: 'text'; value: string }
  | { type: 'tag'; tag: string; attr?: string; children: BBNode[] };

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const TAG_RE =
  /\[(\/?)(b|i|u|s|url|img|quote|code|list|color|size|spoiler|center|\*)(?:=([^\]]*))?\]/gi;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parse a BBCode string into a tree of BBNode tokens.
 * Handles nesting via a stack-based approach.
 */
function parseBBCode(input: string): BBNode[] {
  const root: BBNode[] = [];
  const stack: { tag: string; attr?: string; children: BBNode[] }[] = [];
  let lastIndex = 0;

  // Reset regex state
  TAG_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(input)) !== null) {
    const [full, slash, rawTag, attr] = match;
    const tag = rawTag.toLowerCase();
    const idx = match.index;

    // Text before this tag
    if (idx > lastIndex) {
      const textBefore = input.slice(lastIndex, idx);
      const current = stack.length > 0 ? stack[stack.length - 1].children : root;
      current.push({ type: 'text', value: textBefore });
    }

    if (tag === '*' && !slash) {
      // List item marker — treat as self-closing list-item opener
      const _current = stack.length > 0 ? stack[stack.length - 1].children : root;
      // Push a new item node onto current context; we'll collect until next [*] or [/list]
      stack.push({ tag: 'li', children: [] });
      // Add as child of current
      // (we close it when we hit the next [*] or [/list])
    } else if (!slash) {
      // Opening tag
      stack.push({ tag, attr, children: [] });
    } else {
      // Closing tag — pop matching items off stack
      // First close any open [*] items
      while (stack.length > 0 && stack[stack.length - 1].tag === 'li') {
        const li = stack.pop()!;
        const parent = stack.length > 0 ? stack[stack.length - 1].children : root;
        parent.push({ type: 'tag', tag: 'li', children: li.children });
      }

      if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
        const node = stack.pop()!;
        const parent = stack.length > 0 ? stack[stack.length - 1].children : root;
        parent.push({ type: 'tag', tag: node.tag, attr: node.attr, children: node.children });
      }
    }

    lastIndex = idx + full.length;
  }

  // Remaining text
  if (lastIndex < input.length) {
    const text = input.slice(lastIndex);
    const current = stack.length > 0 ? stack[stack.length - 1].children : root;
    current.push({ type: 'text', value: text });
  }

  // Close any remaining open tags (malformed BBCode)
  while (stack.length > 0) {
    const node = stack.pop()!;
    const parent = stack.length > 0 ? stack[stack.length - 1].children : root;
    parent.push({ type: 'tag', tag: node.tag, attr: node.attr, children: node.children });
  }

  return root;
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

let keyCounter = 0;
function nextKey(): string {
  return `bb-${keyCounter++}`;
}

function renderNodes(nodes: BBNode[], inheritedStyle: TextStyle = {}): React.ReactNode[] {
  return nodes.map((node) => {
    if (node.type === 'text') {
      return (
        <Text key={nextKey()} style={inheritedStyle}>
          {node.value}
        </Text>
      );
    }

    switch (node.tag) {
      case 'b':
        return (
          <Text key={nextKey()} style={[inheritedStyle, { fontWeight: 'bold' }]}>
            {renderNodes(node.children, { ...inheritedStyle, fontWeight: 'bold' })}
          </Text>
        );

      case 'i':
        return (
          <Text key={nextKey()} style={[inheritedStyle, { fontStyle: 'italic' }]}>
            {renderNodes(node.children, { ...inheritedStyle, fontStyle: 'italic' })}
          </Text>
        );

      case 'u':
        return (
          <Text key={nextKey()} style={[inheritedStyle, { textDecorationLine: 'underline' }]}>
            {renderNodes(node.children, { ...inheritedStyle, textDecorationLine: 'underline' })}
          </Text>
        );

      case 's':
        return (
          <Text key={nextKey()} style={[inheritedStyle, { textDecorationLine: 'line-through' }]}>
            {renderNodes(node.children, { ...inheritedStyle, textDecorationLine: 'line-through' })}
          </Text>
        );

      case 'url': {
        const href = node.attr || getTextContent(node.children);
        const safeHref = isValidUrl(href) ? href : '';
        return (
          <Text
            key={nextKey()}
            style={[inheritedStyle, localStyles.link]}
            onPress={() => safeHref && Linking.openURL(safeHref)}
          >
            {node.children.length > 0
              ? renderNodes(node.children, { ...inheritedStyle, ...localStyles.link })
              : safeHref}
          </Text>
        );
      }

      case 'img': {
        const src = getTextContent(node.children);
        if (!isValidUrl(src)) return null;
        return (
          <Image
            key={nextKey()}
            source={{ uri: src }}
            style={localStyles.image}
            resizeMode="contain"
            accessibilityLabel="BBCode image"
          />
        );
      }

      case 'quote': {
        const author = node.attr;
        return (
          <View key={nextKey()} style={localStyles.quote}>
            {author ? <Text style={localStyles.quoteAuthor}>{author} wrote:</Text> : null}
            <Text style={localStyles.quoteText}>{renderNodes(node.children, inheritedStyle)}</Text>
          </View>
        );
      }

      case 'code':
        return (
          <View key={nextKey()} style={localStyles.codeBlock}>
            <Text style={localStyles.codeText}>{getTextContent(node.children)}</Text>
          </View>
        );

      case 'list':
        return (
          <View key={nextKey()} style={localStyles.list}>
            {renderListItems(node.children, inheritedStyle)}
          </View>
        );

      case 'color': {
        const color = node.attr || undefined;
        return (
          <Text key={nextKey()} style={[inheritedStyle, color ? { color } : undefined]}>
            {renderNodes(node.children, { ...inheritedStyle, ...(color ? { color } : {}) })}
          </Text>
        );
      }

      case 'size': {
        const fontSize = node.attr ? parseInt(node.attr, 10) : undefined;
        const sizeStyle = fontSize && fontSize > 0 && fontSize < 100 ? { fontSize } : {};
        return (
          <Text key={nextKey()} style={[inheritedStyle, sizeStyle]}>
            {renderNodes(node.children, { ...inheritedStyle, ...sizeStyle })}
          </Text>
        );
      }

      case 'spoiler':
        return <SpoilerBlock key={nextKey()} nodes={node.children} style={inheritedStyle} />;

      case 'center':
        return (
          <View key={nextKey()} style={localStyles.center}>
            {renderNodes(node.children, inheritedStyle)}
          </View>
        );

      default:
        return renderNodes(node.children, inheritedStyle);
    }
  });
}

/** Collect list items from children */
function renderListItems(children: BBNode[], inheritedStyle: TextStyle): React.ReactNode[] {
  const items: React.ReactNode[] = [];

  for (const child of children) {
    if (child.type === 'tag' && child.tag === 'li') {
      items.push(
        <View key={nextKey()} style={localStyles.listItem}>
          <Text style={[inheritedStyle, localStyles.bullet]}>•</Text>
          <Text style={[inheritedStyle, localStyles.listItemText]}>
            {renderNodes(child.children, inheritedStyle)}
          </Text>
        </View>
      );
    } else if (child.type === 'text' && child.value.trim()) {
      // Loose text inside [list] — treat as item
      items.push(
        <View key={nextKey()} style={localStyles.listItem}>
          <Text style={[inheritedStyle, localStyles.bullet]}>•</Text>
          <Text style={[inheritedStyle, localStyles.listItemText]}>{child.value.trim()}</Text>
        </View>
      );
    }
  }

  return items;
}

/** Helper to extract raw text from a node tree */
function getTextContent(nodes: BBNode[]): string {
  return nodes.map((n) => (n.type === 'text' ? n.value : getTextContent(n.children))).join('');
}

// ---------------------------------------------------------------------------
// Spoiler sub-component (needs state)
// ---------------------------------------------------------------------------

function SpoilerBlock({ nodes, style }: { nodes: BBNode[]; style: TextStyle }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Pressable
      onPress={() => setRevealed((v) => !v)}
      style={localStyles.spoilerContainer}
      accessibilityRole="button"
      accessibilityLabel={revealed ? 'Hide spoiler' : 'Show spoiler'}
    >
      {revealed ? (
        <Text style={style}>{renderNodes(nodes, style)}</Text>
      ) : (
        <Text style={localStyles.spoilerHidden}>Tap to reveal spoiler</Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/** Description. */
/** B B Code Renderer component. */
export function BBCodeRenderer({ content, style }: BBCodeRendererProps) {
  // Reset key counter each render to keep deterministic
  keyCounter = 0;

  const tree = useMemo(() => parseBBCode(content), [content]);

  return (
    <View style={style}>
      <Text>{renderNodes(tree)}</Text>
    </View>
  );
}

export default BBCodeRenderer;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const localStyles = StyleSheet.create({
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: '#6B7280',
    backgroundColor: 'rgba(107,114,128,0.1)',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
    borderRadius: 4,
  },
  quoteAuthor: {
    fontWeight: '600',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    marginVertical: 8,
    paddingLeft: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    marginRight: 8,
    fontSize: 14,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  center: {
    alignItems: 'center',
  },
  spoilerContainer: {
    backgroundColor: 'rgba(107,114,128,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4,
  },
  spoilerHidden: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    fontSize: 13,
  },
});

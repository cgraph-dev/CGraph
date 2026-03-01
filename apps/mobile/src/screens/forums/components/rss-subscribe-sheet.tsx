/**
 * RssSubscribeSheet — Mobile RSS subscribe bottom sheet
 *
 * Lightweight bottom sheet triggered from board header "RSS" icon.
 * Shows feed URL with copy-link, open in browser, and format selector.
 *
 * This is a quick-subscribe sheet for board view — NOT a replacement
 * for the full rss-feeds-screen.tsx at screens/settings/.
 *
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { HapticFeedback } from '@/lib/animations/animation-engine';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RssSubscribeSheetProps {
  visible: boolean;
  onClose: () => void;
  boardId: string;
  boardName: string;
  baseUrl?: string;
}

type FeedFormat = 'rss' | 'atom';

// ─── Component ───────────────────────────────────────────────────────────────

export function RssSubscribeSheet({
  visible,
  onClose,
  boardId,
  boardName,
  baseUrl = '',
}: RssSubscribeSheetProps) {
  const [format, setFormat] = useState<FeedFormat>('rss');
  const [copied, setCopied] = useState(false);

  const feedUrl = useMemo(() => {
    const base = baseUrl || 'https://api.cgraph.app';
    const path = `/api/v1/rss/boards/${boardId}/threads`;
    return format === 'atom' ? `${base}${path}?format=atom` : `${base}${path}`;
  }, [boardId, baseUrl, format]);

  const handleCopy = useCallback(async () => {
    HapticFeedback.light();
    await Clipboard.setStringAsync(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [feedUrl]);

  const handleOpenInBrowser = useCallback(async () => {
    HapticFeedback.light();
    try {
      await WebBrowser.openBrowserAsync(feedUrl);
    } catch {
      try {
        await Linking.openURL(feedUrl);
      } catch {
        Alert.alert('Error', 'Could not open browser');
      }
    }
  }, [feedUrl]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="logo-rss" size={20} color="#f97316" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Subscribe via RSS</Text>
              <Text style={styles.subtitle}>{boardName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Feed URL */}
          <View style={styles.urlContainer}>
            <Text style={styles.urlText} numberOfLines={2} selectable>
              {feedUrl}
            </Text>
          </View>

          {/* Format selector */}
          <View style={styles.formatRow}>
            <Text style={styles.formatLabel}>Format:</Text>
            <View style={styles.formatButtons}>
              {(['rss', 'atom'] as FeedFormat[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.formatButton, format === f && styles.formatButtonActive]}
                  onPress={() => {
                    setFormat(f);
                    setCopied(false);
                  }}
                >
                  <Text
                    style={[styles.formatButtonText, format === f && styles.formatButtonTextActive]}
                  >
                    {f === 'rss' ? 'RSS 2.0' : 'Atom'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.7}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={copied ? '#10b981' : '#fff'}
              />
              <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.browserButton}
              onPress={handleOpenInBrowser}
              activeOpacity={0.7}
            >
              <Ionicons name="open-outline" size={18} color="#818cf8" />
              <Text style={styles.browserButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default RssSubscribeSheet;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#4b5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 1,
  },
  urlContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: '#374151',
  },
  urlText: {
    fontSize: 12,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  formatLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#374151',
  },
  formatButtonActive: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249,115,22,0.1)',
  },
  formatButtonText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  formatButtonTextActive: {
    color: '#f97316',
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 14,
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  copyButtonTextSuccess: {
    color: '#fff',
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(129,140,248,0.1)',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(129,140,248,0.3)',
  },
  browserButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#818cf8',
  },
});

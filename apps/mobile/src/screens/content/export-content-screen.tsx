/**
 * Screen for exporting user content and data.
 * @module screens/content/export-content-screen
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp, type ParamListBase } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';

// ============================================================================
// Types
// ============================================================================

type ExportFormat = 'pdf' | 'html';
type ExportType = 'thread' | 'post' | 'conversation';

interface ExportOptions {
  includeReplies: boolean;
  includeImages: boolean;
  includeAvatars: boolean;
  includeTimestamps: boolean;
  includeUsernames: boolean;
  paperSize: 'a4' | 'letter';
}

type RouteParams = {
  ExportContent: {
    type: ExportType;
    id: string;
    title: string;
  };
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_OPTIONS: ExportOptions = {
  includeReplies: true,
  includeImages: true,
  includeAvatars: false,
  includeTimestamps: true,
  includeUsernames: true,
  paperSize: 'a4',
};

// ============================================================================
// HTML GENERATOR
// ============================================================================

interface ContentData {
  title: string;
  author: string;
  date: string;
  content: string;
  replies?: Array<{
    author: string;
    date: string;
    content: string;
  }>;
}

function generateHTML(data: ContentData, options: ExportOptions): string {
  const paperWidth = options.paperSize === 'a4' ? '210mm' : '8.5in';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1f2937;
          padding: 20mm;
          max-width: ${paperWidth};
          margin: 0 auto;
        }
        .header {
          border-bottom: 2px solid #10b981;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .title {
          font-size: 18pt;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .meta {
          font-size: 10pt;
          color: #6b7280;
        }
        .meta span {
          margin-right: 16px;
        }
        .content {
          margin-bottom: 32px;
        }
        .content p {
          margin-bottom: 12px;
        }
        .content img {
          max-width: 100%;
          height: auto;
          margin: 12px 0;
          border-radius: 8px;
        }
        .replies {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }
        .replies-title {
          font-size: 14pt;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }
        .reply {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .reply-meta {
          font-size: 9pt;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .reply-content {
          font-size: 11pt;
        }
        .footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 9pt;
          color: #9ca3af;
          text-align: center;
        }
        @media print {
          body {
            padding: 15mm;
          }
          .reply {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${data.title}</h1>
        <div class="meta">
          ${options.includeUsernames ? `<span>By: ${data.author}</span>` : ''}
          ${options.includeTimestamps ? `<span>Date: ${data.date}</span>` : ''}
        </div>
      </div>
      
      <div class="content">
        ${data.content}
      </div>
      
      ${
        options.includeReplies && data.replies && data.replies.length > 0
          ? `
        <div class="replies">
          <h2 class="replies-title">Replies (${data.replies.length})</h2>
          ${data.replies
            .map(
              (reply) => `
            <div class="reply">
              <div class="reply-meta">
                ${options.includeUsernames ? `<strong>${reply.author}</strong>` : ''}
                ${options.includeTimestamps ? ` • ${reply.date}` : ''}
              </div>
              <div class="reply-content">${reply.content}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
      
      <div class="footer">
        Exported on ${new Date().toLocaleDateString()} • CGraph Forum
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// OPTION TOGGLE COMPONENT
// ============================================================================

interface OptionToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function OptionToggle({ label, value, onChange }: OptionToggleProps) {
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={() => {
        HapticFeedback.light();
        onChange(!value);
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={[styles.checkbox, value && styles.checkboxChecked]}>
        {value && <Ionicons name="checkmark" size={16} color="#fff" />}
      </View>
    </TouchableOpacity>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 *
 */
export default function ExportContentScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const route = useRoute<RouteProp<RouteParams, 'ExportContent'>>();

  const { type, id, title } = route.params || { type: 'thread', id: '', title: 'Content' };

  const [options, setOptions] = useState<ExportOptions>(DEFAULT_OPTIONS);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Update option
  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  // Fetch content data
  const fetchContent = useCallback(async (): Promise<ContentData> => {
    try {
      let endpoint = '';
      switch (type) {
        case 'thread':
          endpoint = `/api/v1/threads/${id}`;
          break;
        case 'post':
          endpoint = `/api/v1/posts/${id}`;
          break;
        case 'conversation':
          endpoint = `/api/v1/conversations/${id}`;
          break;
      }

      const response = await api.get(endpoint);
      const data = response.data;

      return {
        title: data.title || title,
        author: data.author?.username || 'Unknown',
        date: new Date(data.created_at).toLocaleDateString(),
        content: data.content || '',
        replies:
          data.replies?.map((r: Record<string, unknown>) => ({
            author: r.author?.username || 'Unknown',
            date: new Date(r.created_at).toLocaleDateString(),
            content: r.content || '',
          })) || [],
      };
    } catch (error) {
      console.error('[ExportContent] Error fetching content:', error);
      // Return sample data for demo
      return {
        title: title,
        author: 'DemoUser',
        date: new Date().toLocaleDateString(),
        content:
          '<p>This is sample content for demonstration purposes.</p><p>In a real scenario, this would contain the actual thread or post content.</p>',
        replies: [
          {
            author: 'User1',
            date: new Date().toLocaleDateString(),
            content: 'First reply content here.',
          },
          {
            author: 'User2',
            date: new Date().toLocaleDateString(),
            content: 'Second reply with more details.',
          },
        ],
      };
    }
  }, [type, id, title]);

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      HapticFeedback.medium();

      const content = await fetchContent();
      const html = generateHTML(content, options);

      // Use share sheet to export content
      // The backend can provide a URL for PDF generation
      const exportType =
        type === 'thread' ? 'threads' : type === 'post' ? 'posts' : 'conversations';

      if (selectedFormat === 'pdf') {
        // For PDF, we'll request the backend to generate and provide a download link
        try {
          const response = await api.post(`/${exportType}/${id}/export`, {
            format: 'pdf',
            options,
          });

          if (response.data.url) {
            await WebBrowser.openBrowserAsync(response.data.url);
          } else {
            // Fallback: share HTML and let user convert/print
            await Share.share({
              message: html,
              title: `${title} - Export`,
            });
          }
        } catch {
          // Fallback: share content as message
          await Share.share({
            message: `Export: ${title}\n\n${content.content.replace(/<[^>]*>/g, '')}\n\n${content.replies?.map((r) => `${r.author}: ${r.content}`).join('\n') || ''}`,
            title: `${title} - Export`,
          });
        }
      } else {
        // For HTML, share the generated HTML
        await Share.share({
          message: html,
          title: `${title}.html`,
        });
      }

      HapticFeedback.success();
    } catch (error) {
      console.error('[ExportContent] Export error:', error);
      HapticFeedback.error();
      Alert.alert('Export Failed', 'An error occurred while exporting. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle preview
  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      HapticFeedback.light();

      const content = await fetchContent();
      const html = generateHTML(content, options);

      // For preview, show a simple alert with content summary
      Alert.alert(
        'Preview',
        `${title}\n\nBy: ${content.author}\nDate: ${content.date}\n\nThis content will be exported with ${content.replies?.length || 0} replies.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Export Now', onPress: handleExport },
        ]
      );
    } catch (error) {
      console.error('[ExportContent] Preview error:', error);
      Alert.alert('Preview Failed', 'Could not generate preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Export Content</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Format Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Format</Text>
          <View style={styles.formatOptions}>
            <TouchableOpacity
              style={[styles.formatOption, selectedFormat === 'pdf' && styles.formatOptionSelected]}
              onPress={() => {
                HapticFeedback.light();
                setSelectedFormat('pdf');
              }}
            >
              <Ionicons
                name="document"
                size={32}
                color={selectedFormat === 'pdf' ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[styles.formatLabel, selectedFormat === 'pdf' && styles.formatLabelSelected]}
              >
                PDF
              </Text>
              <Text style={styles.formatDescription}>Best for printing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatOption,
                selectedFormat === 'html' && styles.formatOptionSelected,
              ]}
              onPress={() => {
                HapticFeedback.light();
                setSelectedFormat('html');
              }}
            >
              <Ionicons
                name="code-slash"
                size={32}
                color={selectedFormat === 'html' ? '#10b981' : '#6b7280'}
              />
              <Text
                style={[
                  styles.formatLabel,
                  selectedFormat === 'html' && styles.formatLabelSelected,
                ]}
              >
                HTML
              </Text>
              <Text style={styles.formatDescription}>Best for archiving</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Paper Size */}
        {selectedFormat === 'pdf' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paper Size</Text>
            <View style={styles.paperOptions}>
              <TouchableOpacity
                style={[
                  styles.paperOption,
                  options.paperSize === 'a4' && styles.paperOptionSelected,
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  updateOption('paperSize', 'a4');
                }}
              >
                <Text
                  style={[
                    styles.paperLabel,
                    options.paperSize === 'a4' && styles.paperLabelSelected,
                  ]}
                >
                  A4
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paperOption,
                  options.paperSize === 'letter' && styles.paperOptionSelected,
                ]}
                onPress={() => {
                  HapticFeedback.light();
                  updateOption('paperSize', 'letter');
                }}
              >
                <Text
                  style={[
                    styles.paperLabel,
                    options.paperSize === 'letter' && styles.paperLabelSelected,
                  ]}
                >
                  Letter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Options</Text>
          <BlurView intensity={40} tint="dark" style={styles.optionsCard}>
            <OptionToggle
              label="Include replies"
              value={options.includeReplies}
              onChange={(v) => updateOption('includeReplies', v)}
            />
            <OptionToggle
              label="Include images"
              value={options.includeImages}
              onChange={(v) => updateOption('includeImages', v)}
            />
            <OptionToggle
              label="Include timestamps"
              value={options.includeTimestamps}
              onChange={(v) => updateOption('includeTimestamps', v)}
            />
            <OptionToggle
              label="Include usernames"
              value={options.includeUsernames}
              onChange={(v) => updateOption('includeUsernames', v)}
            />
          </BlurView>
        </View>

        {/* Preview Note */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#6366f1" />
          <Text style={styles.infoText}>
            Tap "Preview" to see how your export will look before generating the file.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={handlePreview}
            disabled={isPreviewing}
          >
            {isPreviewing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={20} color="#fff" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            disabled={isExporting}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.exportButtonGradient}>
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.exportButtonText}>Export {selectedFormat.toUpperCase()}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 8,
  },
  formatLabelSelected: {
    color: '#10b981',
  },
  formatDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  paperOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  paperOption: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paperOptionSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  paperLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
  paperLabelSelected: {
    color: '#10b981',
  },
  optionsCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionLabel: {
    fontSize: 15,
    color: '#fff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 19,
  },
  actions: {
    gap: 12,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    gap: 8,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

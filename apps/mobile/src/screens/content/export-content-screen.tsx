/**
 * Screen for exporting user content and data - Orchestrator.
 * Delegates to sub-components in ./export-content/
 * @module screens/content/export-content-screen
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp, type ParamListBase } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';
import {
  ExportFormat,
  ExportOptions,
  ContentData,
  RouteParams,
  DEFAULT_OPTIONS,
} from './export-content/export-types';
import { generateHTML } from './export-content/html-generator';
import { FormatSelection } from './export-content/format-selection';
import { ContentOptions } from './export-content/content-options';
import { ExportActions } from './export-content/export-actions';

/**
 * Export Content Screen component.
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

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

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
             
            author: (r.author as { username?: string })?.username || 'Unknown',
             
            date: new Date(r.created_at as string).toLocaleDateString(),
             
            content: (r.content as string) || '',
          })) || [],
      };
    } catch (error) {
      console.error('[ExportContent] Error fetching content:', error);
      return {
        title,
        author: 'DemoUser',
        date: new Date().toLocaleDateString(),
        content: '<p>This is sample content for demonstration purposes.</p>',
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      HapticFeedback.medium();
      const content = await fetchContent();
      const html = generateHTML(content, options);
      const exportType =
        type === 'thread' ? 'threads' : type === 'post' ? 'posts' : 'conversations';

      if (selectedFormat === 'pdf') {
        try {
          const response = await api.post(`/${exportType}/${id}/export`, {
            format: 'pdf',
            options,
          });
          if (response.data.url) await WebBrowser.openBrowserAsync(response.data.url);
          else await Share.share({ message: html, title: `${title} - Export` });
        } catch {
          await Share.share({
            message: `Export: ${title}\n\n${content.content.replace(/<[^>]*>/g, '')}\n\n${content.replies?.map((r) => `${r.author}: ${r.content}`).join('\n') || ''}`,
            title: `${title} - Export`,
          });
        }
      } else {
        await Share.share({ message: html, title: `${title}.html` });
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

  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      HapticFeedback.light();
      const content = await fetchContent();
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
        <FormatSelection
          selectedFormat={selectedFormat}
          paperSize={options.paperSize}
          onFormatChange={setSelectedFormat}
          onPaperSizeChange={(size) => updateOption('paperSize', size)}
        />
        <ContentOptions options={options} onUpdateOption={updateOption} />
        <ExportActions
          selectedFormat={selectedFormat}
          isExporting={isExporting}
          isPreviewing={isPreviewing}
          onPreview={handlePreview}
          onExport={handleExport}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
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
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 2 },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
});

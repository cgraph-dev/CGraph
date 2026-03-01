/**
 * Forum Customization Center — 55 options across 8 categories
 *
 * Main hub with tabbed navigation, live preview panel, and per-category editors.
 * Route: /forums/:forumId/customize
 *
 * @module modules/forums/components/customization-center
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaintBrushIcon,
  Squares2X2Icon,
  PhotoIcon,
  PuzzlePieceIcon,
  ChatBubbleBottomCenterTextIcon,
  RectangleGroupIcon,
  TrophyIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  CheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { toast } from '@/shared/components/ui';
import { useCustomizationStore } from '../../store/forumThemeStore';
import { ThemeEditor } from './theme-editor';
import { LayoutEditor } from './layout-editor';
import { HeaderBrandingEditor } from './header-branding-editor';
import { WidgetConfigurator } from './widget-configurator';
import { CssEditor } from './css-editor';
import { CustomFieldsEditor } from './custom-fields-editor';
import { KarmaSettings } from './karma-settings';
import { BadgeManager } from './badge-manager';
import type { ForumCustomizationOptions, CustomizationCategory } from '@cgraph/shared-types';

// =============================================================================
// TYPES
// =============================================================================

interface CustomizationCenterProps {
  forumId: string;
  isOwner: boolean;
}

interface TabConfig {
  id: CustomizationCategory;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
}

// =============================================================================
// TABS CONFIG
// =============================================================================

const TABS: TabConfig[] = [
  { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon, description: 'Colors, fonts, border radius, dark mode' },
  { id: 'layout', label: 'Layout', icon: Squares2X2Icon, description: 'Sidebar, header, thread & post layouts' },
  { id: 'header_and_branding', label: 'Header & Branding', icon: PhotoIcon, description: 'Logo, header image, subtitle, favicon' },
  { id: 'sidebar_widgets', label: 'Sidebar Widgets', icon: PuzzlePieceIcon, description: 'Statistics, recent threads, online users' },
  { id: 'post_and_thread_display', label: 'Posts & Threads', icon: ChatBubbleBottomCenterTextIcon, description: 'Templates, badges, signatures, pagination' },
  { id: 'custom_fields', label: 'Custom Fields', icon: RectangleGroupIcon, description: 'Profile, thread, and post custom fields' },
  { id: 'reputation_and_ranks', label: 'Reputation & Ranks', icon: TrophyIcon, description: 'Karma names, rank thresholds, images' },
  { id: 'custom_css_and_advanced', label: 'Advanced CSS', icon: CodeBracketIcon, description: 'Custom CSS, header/footer HTML' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function CustomizationCenter({ forumId, isOwner }: CustomizationCenterProps) {
  const [activeTab, setActiveTab] = useState<CustomizationCategory>('appearance');
  const [previewMode, setPreviewMode] = useState(false);

  const {
    options,
    loading,
    saving,
    error,
    previewDraft,
    fetchCustomization,
    updateCustomization,
    resetCategory,
    previewCustomization: _previewCustomization,
    clearPreview: _clearPreview,
  } = useCustomizationStore();

  // Fetch current customization from store
  useEffect(() => {
    fetchCustomization(forumId);
  }, [forumId, fetchCustomization]);

  // Show error toasts from store
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Save category changes via store
  const handleSave = async (category: CustomizationCategory, changes: Record<string, unknown>) => {
    try {
      await updateCustomization(forumId, category, changes);
      toast.success('Customization saved');
    } catch {
      toast.error('Failed to save changes');
    }
  };

  // Reset category to defaults via store
  const handleReset = async (category: CustomizationCategory) => {
    try {
      await resetCategory(forumId, category);
      toast.success('Reset to defaults');
    } catch {
      toast.error('Failed to reset');
    }
  };

  // Use preview draft for the live preview, falling back to persisted options
  const displayOptions = previewDraft ?? options;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 min-h-screen">
      {/* Left: Tab Navigation */}
      <nav className="lg:w-64 flex-shrink-0">
        <GlassCard className="p-4">
          <h2 className="text-lg font-bold text-white mb-4">Customization</h2>
          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-white/40 hidden lg:block">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </nav>

      {/* Center: Category Editor */}
      <main className="flex-1 min-w-0">
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-sm text-white/50 mt-1">
                {TABS.find((t) => t.id === activeTab)?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => handleReset(activeTab)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {displayOptions && (
                <CategoryEditor
                  category={activeTab}
                  options={displayOptions}
                  forumId={forumId}
                  onSave={(changes) => handleSave(activeTab, changes)}
                  saving={saving}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </main>

      {/* Right: Live Preview (optional) */}
      {previewMode && (
        <aside className="lg:w-80 flex-shrink-0">
          <GlassCard className="p-4 sticky top-6">
            <h3 className="text-sm font-bold text-white/70 mb-3">Live Preview</h3>
            <div
              className="rounded-lg overflow-hidden border border-white/10"
              style={{
                backgroundColor: displayOptions?.appearance?.background_color ?? '#1a1a1a',
                color: displayOptions?.appearance?.text_color ?? '#ffffff',
                fontFamily: (displayOptions?.appearance?.font_family as string) ?? 'Inter, system-ui, sans-serif',
              }}
            >
              <div
                className="p-3 text-sm font-bold"
                style={{
                  backgroundColor: displayOptions?.header_and_branding?.header_background_color ?? '#1F2937',
                  color: '#fff',
                }}
              >
                Forum Header Preview
              </div>
              <div className="p-3 space-y-2 text-xs">
                <div className="p-2 rounded" style={{ backgroundColor: `${displayOptions?.appearance?.primary_color ?? '#3B82F6'}20` }}>
                  <span style={{ color: displayOptions?.appearance?.primary_color ?? '#3B82F6' }}>Sample Thread Title</span>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span style={{ color: displayOptions?.appearance?.link_color ?? '#2563EB' }}>A link example</span>
                  {' — regular text with '}
                  <span style={{ color: displayOptions?.appearance?.accent_color ?? '#F59E0B' }}>accent</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </aside>
      )}
    </div>
  );
}

// =============================================================================
// CATEGORY ROUTER
// =============================================================================

interface CategoryEditorProps {
  category: CustomizationCategory;
  options: ForumCustomizationOptions;
  forumId: string;
  onSave: (changes: Record<string, unknown>) => void;
  saving: boolean;
}

function CategoryEditor({ category, options, forumId, onSave, saving }: CategoryEditorProps) {
  const categoryOptions = options[category] ?? {};

  switch (category) {
    case 'appearance':
      return <ThemeEditor options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'layout':
      return <LayoutEditor options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'header_and_branding':
      return <HeaderBrandingEditor options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'sidebar_widgets':
      return <WidgetConfigurator options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'post_and_thread_display':
      return <ThemeEditor options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'custom_fields':
      return <CustomFieldsEditor forumId={forumId} onSave={onSave} saving={saving} />;
    case 'reputation_and_ranks':
      return <KarmaSettings options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'custom_css_and_advanced':
      return <CssEditor options={categoryOptions} onSave={onSave} saving={saving} />;
    default:
      return <div className="text-white/50">Unknown category</div>;
  }
}

export default CustomizationCenter;

/**
 * Forum Customization Center — 55 options across 8 categories
 *
 * Main hub with tabbed navigation, live preview panel, and per-category editors.
 * Route: /forums/:forumId/customize
 *
 * @module modules/forums/components/customization-center
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { PulseSettings } from './pulse-settings';
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
  {
    id: 'appearance',
    label: 'Appearance',
    icon: PaintBrushIcon,
    description: 'Colors, fonts, border radius, dark mode',
  },
  {
    id: 'layout',
    label: 'Layout',
    icon: Squares2X2Icon,
    description: 'Sidebar, header, thread & post layouts',
  },
  {
    id: 'header_and_branding',
    label: 'Header & Branding',
    icon: PhotoIcon,
    description: 'Logo, header image, subtitle, favicon',
  },
  {
    id: 'sidebar_widgets',
    label: 'Sidebar Widgets',
    icon: PuzzlePieceIcon,
    description: 'Statistics, recent threads, online users',
  },
  {
    id: 'post_and_thread_display',
    label: 'Posts & Threads',
    icon: ChatBubbleBottomCenterTextIcon,
    description: 'Templates, badges, signatures, pagination',
  },
  {
    id: 'custom_fields',
    label: 'Custom Fields',
    icon: RectangleGroupIcon,
    description: 'Profile, thread, and post custom fields',
  },
  {
    id: 'reputation_and_ranks',
    label: 'Reputation & Ranks',
    icon: TrophyIcon,
    description: 'Pulse names, rank thresholds, images',
  },
  {
    id: 'custom_css_and_advanced',
    label: 'Advanced CSS',
    icon: CodeBracketIcon,
    description: 'Custom CSS, header/footer HTML',
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

/** Description. */
/** Customization Center component. */
export function CustomizationCenter({ forumId }: CustomizationCenterProps) {
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
      <div className="flex h-96 items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 p-6 lg:flex-row">
      {/* Left: Tab Navigation */}
      <nav className="flex-shrink-0 lg:w-64">
        <GlassCard className="p-4">
          <h2 className="mb-4 text-lg font-bold text-white">Customization</h2>
          <div className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="hidden text-xs text-white/40 lg:block">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </nav>

      {/* Center: Category Editor */}
      <main className="min-w-0 flex-1">
        <GlassCard className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="mt-1 text-sm text-white/50">
                {TABS.find((t) => t.id === activeTab)?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10"
              >
                <EyeIcon className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={() => handleReset(activeTab)}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10"
              >
                <ArrowPathIcon className="h-4 w-4" />
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
              transition={{ duration: durations.normal.ms / 1000 }}
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
        <aside className="flex-shrink-0 lg:w-80">
          <GlassCard className="sticky top-6 p-4">
            <h3 className="mb-3 text-sm font-bold text-white/70">Live Preview</h3>
            <div
              className="overflow-hidden rounded-lg border border-white/10"
              style={{
                backgroundColor: displayOptions?.appearance?.background_color ?? '#1a1a1a',
                color: displayOptions?.appearance?.text_color ?? '#ffffff',
                fontFamily:
                   
                  (displayOptions?.appearance?.font_family as string) ??
                  'Inter, system-ui, sans-serif',
              }}
            >
              <div
                className="p-3 text-sm font-bold"
                style={{
                  backgroundColor:
                    displayOptions?.header_and_branding?.header_background_color ?? '#1F2937',
                  color: '#fff',
                }}
              >
                Forum Header Preview
              </div>
              <div className="space-y-2 p-3 text-xs">
                <div
                  className="rounded p-2"
                  style={{
                    backgroundColor: `${displayOptions?.appearance?.primary_color ?? '#3B82F6'}20`,
                  }}
                >
                  <span style={{ color: displayOptions?.appearance?.primary_color ?? '#3B82F6' }}>
                    Sample Thread Title
                  </span>
                </div>
                <div className="rounded bg-white/5 p-2">
                  <span style={{ color: displayOptions?.appearance?.link_color ?? '#2563EB' }}>
                    A link example
                  </span>
                  {' — regular text with '}
                  <span style={{ color: displayOptions?.appearance?.accent_color ?? '#F59E0B' }}>
                    accent
                  </span>
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
   
  const categoryOptions = (options[category] ?? {}) as unknown as Record<string, unknown>;

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
      return <PulseSettings options={categoryOptions} onSave={onSave} saving={saving} />;
    case 'custom_css_and_advanced':
      return <CssEditor options={categoryOptions} onSave={onSave} saving={saving} />;
    default:
      return <div className="text-white/50">Unknown category</div>;
  }
}

export default CustomizationCenter;

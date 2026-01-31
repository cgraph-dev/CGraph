import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from '@/components/Toast';
import GlassCard from '@/components/ui/GlassCard';

export function LanguageSettingsPanel() {
  const { settings, updateLocaleSettings, isSaving } = useSettingsStore();
  const [language, setLanguage] = useState(settings.locale.language);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    try {
      await updateLocaleSettings({ language: newLanguage });
      toast.success('Language updated');
    } catch {
      setLanguage(settings.locale.language);
      toast.error('Failed to update language');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="mb-6 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
        Language & Region
      </h1>

      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Interface Language</label>
        <select
          value={language}
          onChange={handleLanguageChange}
          disabled={isSaving}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
          <option value="pt">Português</option>
          <option value="ru">Русский</option>
          <option value="ar">العربية</option>
        </select>
      </GlassCard>

      <GlassCard variant="default" className="mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Date Format</label>
        <select
          value={settings.locale.dateFormat}
          onChange={async (e) => {
            try {
              await updateLocaleSettings({ dateFormat: e.target.value as 'mdy' | 'dmy' | 'ymd' });
              toast.success('Date format updated');
            } catch {
              toast.error('Failed to update date format');
            }
          }}
          disabled={isSaving}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="mdy">MM/DD/YYYY</option>
          <option value="dmy">DD/MM/YYYY</option>
          <option value="ymd">YYYY-MM-DD</option>
        </select>
      </GlassCard>

      <GlassCard variant="default" className="p-6">
        <label className="mb-2 block text-sm font-medium text-gray-300">Time Format</label>
        <select
          value={settings.locale.timeFormat}
          onChange={async (e) => {
            try {
              await updateLocaleSettings({
                timeFormat: e.target.value as 'twelve_hour' | 'twenty_four_hour',
              });
              toast.success('Time format updated');
            } catch {
              toast.error('Failed to update time format');
            }
          }}
          disabled={isSaving}
          className="w-full rounded-lg border border-dark-600 bg-dark-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <option value="twelve_hour">12-hour (1:30 PM)</option>
          <option value="twenty_four_hour">24-hour (13:30)</option>
        </select>
      </GlassCard>
    </motion.div>
  );
}

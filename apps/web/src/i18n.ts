/**
 * Internationalization configuration and setup.
 * @module
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

/**
 * i18n Configuration
 *
 * Supports lazy-loading translations from `/locales/{lang}/{namespace}.json`.
 * In development, English is embedded. In production, translations are fetched
 * from the backend or CDN.
 *
 * Namespaces:
 *   - common    — shared UI strings (buttons, labels, errors)
 *   - auth      — login, register, password reset
 *   - messages  — conversations, DMs, threads
 *   - groups    — groups, forums, channels
 *   - settings  — user settings, preferences
 *   - premium   — subscription, shop, tiers
 *   - gamification — XP, quests, achievements, prestige
 *
 * Usage:
 *   const { t } = useTranslation('common');
 *   <p>{t('welcome')}</p>
 *
 * Adding a new language:
 *   1. Create `/public/locales/{code}/common.json` (and other namespaces)
 *   2. Add the locale code to `supportedLngs` below
 *   3. Optionally add a display name in common.json: "language_name": "Français"
 */

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Supported languages
    supportedLngs: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'pt', 'ru'],
    fallbackLng: 'en',

    // Lazy-load translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Default namespace
    defaultNS: 'common',
    ns: ['common', 'auth', 'messages', 'groups', 'settings', 'premium', 'gamification'],

    // Language detection order
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cgraph_language',
    },

    // React options
    react: {
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Development options
    debug: import.meta.env.DEV,

    // Prevent flash of untranslated content
    returnEmptyString: false,
    returnNull: false,
  });

export default i18n;

/**
 * Language Detection Module
 *
 * Standalone function for detecting the language of a text
 * using n-gram pattern matching.
 *
 * @module lib/ai/languageDetection
 */

import type { LanguageDetection } from './types';

/**
 * Detect language of text using pattern matching
 */
export async function detectLanguage(text: string): Promise<LanguageDetection> {
  // Simple n-gram based detection
  const langScores = new Map<string, number>();

  // Common patterns for languages - use more specific patterns to avoid false positives
  const patterns: Record<string, RegExp[]> = {
    en: [/\b(the|is|are|was|were|have|has|been|will|would|that|this|with)\b/gi],
    es: [/\b(está|están|qué|cómo|tengo|tiene|bueno|buenos|días|hola|muy)\b/gi, /[¿¡]/g],
    fr: [
      /\b(vous|nous|comment|bonjour|journée|espère|passez|très|merci|s'il)\b/gi,
      /[àâçéèêëîïôûùü]/gi,
    ],
    de: [/\b(ich|sie|ihnen|einen|hoffe|guten|schönen|haben|heute|morgen)\b/gi, /[äöüß]/gi],
    pt: [/\b(você|como|bom|obrigado|muito|hoje|amanhã|também)\b/gi, /[ãõ]/g],
    it: [/\b(come|buongiorno|grazie|oggi|domani|bene|molto)\b/gi],
    ja: [/[\u3040-\u309F\u30A0-\u30FF]/g], // Hiragana/Katakana
    zh: [/[\u4E00-\u9FFF]/g], // Chinese characters
    ko: [/[\uAC00-\uD7AF]/g], // Korean characters
    ar: [/[\u0600-\u06FF]/g], // Arabic
    ru: [/[\u0400-\u04FF]/g], // Cyrillic
  };

  for (const [lang, regexes] of Object.entries(patterns)) {
    let matches = 0;
    for (const regex of regexes) {
      const found = text.match(regex);
      matches += found ? found.length : 0;
    }
    if (matches > 0) {
      langScores.set(lang, matches);
    }
  }

  // Default to English if no matches
  if (langScores.size === 0) {
    langScores.set('en', 1);
  }

  // Sort by score
  const sorted = Array.from(langScores.entries()).sort(([, a], [, b]) => b - a);

  const topLang = sorted[0];
  const totalScore = sorted.reduce((sum, [, score]) => sum + score, 0);

  if (!topLang) {
    return {
      language: 'en',
      confidence: 1,
      alternatives: [],
      isMultilingual: false,
    };
  }

  return {
    language: topLang[0],
    confidence: topLang[1] / totalScore,
    alternatives: sorted.slice(1, 4).map(([language, score]) => ({
      language,
      confidence: score / totalScore,
    })),
    isMultilingual: sorted.length > 1 && (sorted[1]?.[1] || 0) / topLang[1] > 0.3,
  };
}

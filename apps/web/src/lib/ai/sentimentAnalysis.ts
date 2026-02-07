/**
 * Sentiment Analysis Module
 *
 * Standalone functions for analyzing message sentiment and extracting emotions.
 * Used by other AI features (content moderation, smart replies, etc.).
 *
 * @module lib/ai/sentimentAnalysis
 */

import type { SentimentAnalysis } from './types';
import { SENTIMENT_LEXICON } from './data';

/**
 * Extract emotions from text based on keyword patterns and base sentiment
 */
export function extractEmotions(
  text: string,
  baseSentiment: number
): SentimentAnalysis['emotions'] {
  const lower = text.toLowerCase();

  const emotions = {
    joy: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    disgust: 0,
    trust: 0,
    anticipation: 0,
  };

  // Joy indicators
  if (/(happy|joy|excited|love|great|amazing|wonderful|😊|🎉|❤️|😍)/.test(lower)) {
    emotions.joy = 0.8;
  } else if (baseSentiment > 0.3) {
    emotions.joy = baseSentiment * 0.7;
  }

  // Sadness indicators
  if (/(sad|sorry|unfortunately|miss|depressed|😢|😭|💔)/.test(lower)) {
    emotions.sadness = 0.8;
  } else if (baseSentiment < -0.3) {
    emotions.sadness = Math.abs(baseSentiment) * 0.5;
  }

  // Anger indicators
  if (/(angry|furious|annoyed|frustrated|hate|😠|🤬|💢)/.test(lower)) {
    emotions.anger = 0.8;
  }

  // Fear indicators
  if (/(scared|afraid|worried|anxious|nervous|😰|😨|😱)/.test(lower)) {
    emotions.fear = 0.8;
  }

  // Surprise indicators
  if (/(wow|omg|surprised|shocked|unexpected|😮|🤯|😲)/.test(lower)) {
    emotions.surprise = 0.8;
  }

  // Trust indicators
  if (/(trust|believe|confident|sure|reliable)/.test(lower)) {
    emotions.trust = 0.7;
  }

  // Anticipation indicators
  if (/(excited|looking forward|can'?t wait|soon|upcoming)/.test(lower)) {
    emotions.anticipation = 0.7;
  }

  return emotions;
}

/**
 * Analyze sentiment of a message
 */
export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const words = text.toLowerCase().split(/\s+/);
  let totalScore = 0;
  let wordCount = 0;

  // Calculate base sentiment from lexicon
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (SENTIMENT_LEXICON[cleanWord] !== undefined) {
      totalScore += SENTIMENT_LEXICON[cleanWord];
      wordCount++;
    }
  }

  // Normalize score
  const score = wordCount > 0 ? totalScore / wordCount : 0;

  // Calculate magnitude (intensity)
  const magnitude = Math.min(1, Math.abs(score));

  // Determine label
  let label: SentimentAnalysis['label'];
  if (score <= -0.6) label = 'very_negative';
  else if (score <= -0.2) label = 'negative';
  else if (score <= 0.2) label = 'neutral';
  else if (score <= 0.6) label = 'positive';
  else label = 'very_positive';

  // Analyze emotions (simplified model)
  const emotions = extractEmotions(text, score);
  const dominantEmotion =
    Object.entries(emotions).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

  return {
    score,
    magnitude,
    label,
    emotions,
    dominantEmotion,
  };
}

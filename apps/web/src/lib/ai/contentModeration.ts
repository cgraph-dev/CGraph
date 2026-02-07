/**
 * Content Moderation Module
 *
 * Standalone function for moderating message content,
 * detecting spam, scams, harassment, and other unsafe content.
 *
 * @module lib/ai/contentModeration
 */

import type { ContentModeration } from './types';
import { SPAM_PATTERNS, SCAM_PATTERNS, HARASSMENT_PATTERNS } from './data';
import { analyzeSentiment } from './sentimentAnalysis';

/**
 * Moderate message content for safety
 */
export async function moderateContent(text: string): Promise<ContentModeration> {
  const flags = {
    spam: false,
    scam: false,
    harassment: false,
    hateSpeech: false,
    violence: false,
    adult: false,
    selfHarm: false,
    misinformation: false,
  };

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.spam = true;
      break;
    }
  }

  // Check scam patterns
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.scam = true;
      break;
    }
  }

  // Check harassment patterns
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(text)) {
      flags.harassment = true;
      break;
    }
  }

  // Analyze sentiment for potential issues
  const sentiment = await analyzeSentiment(text);
  if (sentiment.emotions.anger > 0.8) {
    flags.hateSpeech = true; // Flag for review
  }

  // Determine severity
  const flagCount = Object.values(flags).filter(Boolean).length;
  let severity: ContentModeration['severity'];
  if (flagCount === 0) severity = 'none';
  else if (flagCount === 1 && flags.spam) severity = 'low';
  else if (flags.harassment || flags.hateSpeech) severity = 'high';
  else if (flags.scam || flags.violence) severity = 'critical';
  else severity = 'medium';

  // Determine action
  let suggestedAction: ContentModeration['suggestedAction'];
  switch (severity) {
    case 'none':
      suggestedAction = 'allow';
      break;
    case 'low':
      suggestedAction = 'warn';
      break;
    case 'medium':
      suggestedAction = 'filter';
      break;
    case 'high':
      suggestedAction = 'review';
      break;
    case 'critical':
      suggestedAction = 'block';
      break;
  }

  return {
    isSafe: flagCount === 0,
    flags,
    severity,
    confidence: 0.85, // Local model confidence
    suggestedAction,
    explanation:
      flagCount > 0
        ? `Content flagged for: ${Object.entries(flags)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(', ')}`
        : undefined,
  };
}

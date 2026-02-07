/**
 * Smart Replies Module
 *
 * Standalone functions for generating context-aware smart reply suggestions.
 *
 * @module lib/ai/smartReplies
 */

import type { SmartReply } from './types';
import { SMART_REPLY_TEMPLATES } from './data';
import { analyzeSentiment } from './sentimentAnalysis';

/**
 * Categorize a message by intent
 */
export function categorizeMessage(message: string): string {
  const lower = message.toLowerCase();

  if (/^(hi|hello|hey|good\s+(morning|afternoon|evening))/.test(lower)) {
    return 'greeting';
  }
  if (/\?$/.test(message.trim())) {
    return 'question';
  }
  if (/(thank|thanks|thx|ty)/.test(lower)) {
    return 'thanks';
  }
  if (/(bye|goodbye|see\s+you|talk\s+later|gtg|gotta\s+go)/.test(lower)) {
    return 'farewell';
  }
  if (/(i\s+agree|you'?re\s+right|exactly|true|yes)/.test(lower)) {
    return 'agreement';
  }
  if (/(i\s+disagree|don'?t\s+think|not\s+sure|no)/.test(lower)) {
    return 'disagreement';
  }

  return 'question'; // Default to question handling
}

/**
 * Check whether a message contains a question
 */
export function containsQuestion(message: string): boolean {
  return (
    /\?/.test(message) ||
    /^(what|when|where|who|why|how|can|could|would|should|is|are|do|does)/i.test(message.trim())
  );
}

/**
 * Adjust confidence of a reply based on message context
 */
export function adjustConfidence(
  reply: SmartReply,
  message: string,
  context?: { conversationHistory?: string[]; senderName?: string }
): number {
  let confidence = reply.confidence;

  // Boost confidence if tone matches message sentiment
  const hasExcitement = /!|🎉|😊|❤️/.test(message);
  if (hasExcitement && (reply.tone === 'friendly' || reply.tone === 'casual')) {
    confidence += 0.1;
  }

  // Reduce confidence for professional tone in casual chats
  if (context?.conversationHistory) {
    const isInformal = context.conversationHistory.some((m) => /lol|haha|omg|btw|idk/i.test(m));
    if (isInformal && reply.tone === 'professional') {
      confidence -= 0.15;
    }
  }

  return Math.min(1, Math.max(0, confidence));
}

/**
 * Generate smart reply suggestions for a message
 */
export async function generateSmartReplies(
  message: string,
  context?: { conversationHistory?: string[]; senderName?: string }
): Promise<SmartReply[]> {
  const category = categorizeMessage(message);
  const sentiment = await analyzeSentiment(message);

  // Get base templates
  let replies = [...(SMART_REPLY_TEMPLATES[category] || [])];

  // If we detect specific intents, add contextual replies
  if (containsQuestion(message)) {
    replies = [...replies, ...(SMART_REPLY_TEMPLATES.question || [])];
  }

  if (sentiment.label === 'very_positive' || sentiment.dominantEmotion === 'joy') {
    replies = [...replies, ...(SMART_REPLY_TEMPLATES.excitement || [])];
  }

  if (sentiment.label === 'negative' || sentiment.dominantEmotion === 'sadness') {
    replies = [...replies, ...(SMART_REPLY_TEMPLATES.sympathy || [])];
  }

  // Score and rank replies
  const scoredReplies = replies.map((reply) => ({
    ...reply,
    confidence: adjustConfidence(reply, message, context),
  }));

  // Sort by confidence and deduplicate
  const seen = new Set<string>();
  const uniqueReplies = scoredReplies
    .sort((a, b) => b.confidence - a.confidence)
    .filter((reply) => {
      if (seen.has(reply.text)) return false;
      seen.add(reply.text);
      return true;
    })
    .slice(0, 3); // Return top 3

  return uniqueReplies;
}

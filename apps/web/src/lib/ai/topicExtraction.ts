/**
 * Topic Extraction Module
 *
 * Standalone functions for extracting topics, entities,
 * and categories from conversation messages.
 *
 * @module lib/ai/topicExtraction
 */

import type { TopicExtraction } from './types';
import { STOP_WORDS } from './data';

/**
 * Extract named entities (dates, money, emails) from text
 */
export function extractEntities(text: string): TopicExtraction['entities'] {
  const entities: TopicExtraction['entities'] = [];

  // Date patterns
  const datePatterns = text.match(
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,?\s+\d{4})?\b/gi
  );
  if (datePatterns) {
    for (const match of datePatterns) {
      entities.push({ text: match, type: 'date', confidence: 0.9 });
    }
  }

  // Money patterns
  const moneyPatterns = text.match(
    /\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|usd|eur|gbp)/gi
  );
  if (moneyPatterns) {
    for (const match of moneyPatterns) {
      entities.push({ text: match, type: 'money', confidence: 0.95 });
    }
  }

  // Email patterns (potential person/org)
  const emailPatterns = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
  if (emailPatterns) {
    for (const match of emailPatterns) {
      entities.push({ text: match, type: 'person', confidence: 0.7 });
    }
  }

  return entities;
}

/**
 * Extract topics from conversation messages
 */
export async function extractTopics(
  messages: Array<{ content: string }>
): Promise<TopicExtraction> {
  const allText = messages.map((m) => m.content).join(' ');
  const words = allText.toLowerCase().split(/\s+/);

  // Count word frequencies (excluding stop words)
  const wordFreq = new Map<string, number>();
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length > 3 && !STOP_WORDS.has(clean)) {
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    }
  }

  // Get top keywords
  const topKeywords = Array.from(wordFreq.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  // Group into topics (simplified clustering)
  const topics = topKeywords.slice(0, 5).map(([keyword, freq]) => ({
    name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
    confidence: Math.min(1, freq / messages.length),
    keywords: [keyword],
    sentiment: 0, // Would need per-topic sentiment
    messageCount: freq,
  }));

  // Extract entities
  const entities = extractEntities(allText);

  return {
    topics,
    categories: topics.map((t) => t.name),
    entities,
  };
}

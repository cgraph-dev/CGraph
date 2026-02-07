/**
 * Message Summarizer Module
 *
 * Standalone functions for summarizing conversations,
 * extracting key points, action items, and decisions.
 *
 * @module lib/ai/summarizer
 */

import type { MessageSummary } from './types';

/**
 * Score and extract key points from sentences
 */
export function extractKeyPoints(sentences: string[]): string[] {
  // Score sentences by importance
  const scored = sentences.map((sentence) => {
    let score = 0;

    // Longer sentences often contain more info
    score += Math.min(sentence.split(' ').length / 20, 1) * 0.3;

    // Sentences with numbers are often important
    if (/\d+/.test(sentence)) score += 0.2;

    // Sentences with quotes
    if (/["']/.test(sentence)) score += 0.15;

    // Sentences with emphasis
    if (/!/.test(sentence)) score += 0.1;

    // Key phrases
    if (/\b(important|critical|key|main|significant|essential)\b/i.test(sentence)) {
      score += 0.3;
    }

    return { sentence: sentence.trim(), score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.sentence);
}

/**
 * Generate a one-line brief summary
 */
export function generateBriefSummary(messages: Array<{ sender: string; content: string }>): string {
  const participants = [...new Set(messages.map((m) => m.sender))];
  const messageCount = messages.length;

  if (messageCount === 1) {
    return `${participants[0]} sent a message.`;
  }

  return `Conversation between ${participants.join(' and ')} with ${messageCount} messages.`;
}

/**
 * Generate a detailed paragraph summary
 */
export function generateDetailedSummary(
  messages: Array<{ sender: string; content: string }>,
  keyPoints: string[]
): string {
  const participants = [...new Set(messages.map((m) => m.sender))];

  let summary = `This conversation involves ${participants.join(', ')}. `;

  if (keyPoints.length > 0) {
    summary += `Key topics discussed include: ${keyPoints.slice(0, 3).join('; ')}. `;
  }

  summary += `Total of ${messages.length} messages exchanged.`;

  return summary;
}

/**
 * Summarize a conversation into structured output
 */
export async function summarizeConversation(
  messages: Array<{ sender: string; content: string; timestamp: number }>
): Promise<MessageSummary> {
  if (messages.length === 0) {
    return {
      brief: 'No messages to summarize.',
      detailed: 'The conversation is empty.',
      keyPoints: [],
      actionItems: [],
      decisions: [],
      questions: [],
    };
  }

  // Extract key information
  const allText = messages.map((m) => m.content).join(' ');
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Extract action items (sentences with action verbs)
  const actionItems = sentences
    .filter((s) => /\b(need to|should|must|will|going to|have to|let'?s)\b/i.test(s))
    .map((s) => s.trim())
    .slice(0, 5);

  // Extract questions
  const questions = messages
    .filter((m) => m.content.includes('?'))
    .map((m) => m.content)
    .slice(0, 5);

  // Extract decisions (sentences with decision indicators)
  const decisions = sentences
    .filter((s) => /\b(decided|agreed|confirmed|approved|will do|let'?s go with)\b/i.test(s))
    .map((s) => s.trim())
    .slice(0, 5);

  // Generate key points (most important sentences)
  const keyPoints = extractKeyPoints(sentences);

  // Generate summaries
  const brief = generateBriefSummary(messages);
  const detailed = generateDetailedSummary(messages, keyPoints);

  return {
    brief,
    detailed,
    keyPoints,
    actionItems,
    decisions,
    questions,
  };
}

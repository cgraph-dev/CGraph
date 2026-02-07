/**
 * Conversation Insights Module
 *
 * Standalone functions for analyzing conversation health,
 * participation, engagement, and communication style.
 *
 * @module lib/ai/conversationInsights
 */

import type { ConversationInsight } from './types';
import { analyzeSentiment } from './sentimentAnalysis';
import { extractTopics } from './topicExtraction';

/**
 * Return empty insights for an empty conversation
 */
export function emptyInsights(): ConversationInsight {
  return {
    participationRate: {},
    responseTime: { average: 0, fastest: 0, slowest: 0 },
    topicsDiscussed: [],
    engagementScore: 0,
    communicationStyle: { formality: 0.5, verbosity: 0.5, emotionality: 0.5 },
    suggestions: [],
  };
}

/**
 * Generate improvement suggestions based on conversation metrics
 */
export function generateSuggestions(
  engagement: number,
  formality: number,
  participation: Record<string, number>
): string[] {
  const suggestions: string[] = [];

  if (engagement < 0.3) {
    suggestions.push('Try asking more open-ended questions to boost engagement');
  }

  const participantCount = Object.keys(participation).length;
  if (participantCount > 2) {
    const maxPart = Math.max(...Object.values(participation));
    const minPart = Math.min(...Object.values(participation));
    if (maxPart / minPart > 3) {
      suggestions.push('Some participants are less active - consider encouraging their input');
    }
  }

  if (formality > 0.8) {
    suggestions.push('The conversation is quite formal - casual language might improve rapport');
  }

  return suggestions;
}

/**
 * Generate insights about a conversation
 */
export async function generateInsights(
  messages: Array<{ sender: string; content: string; timestamp: number }>
): Promise<ConversationInsight> {
  if (messages.length === 0) {
    return emptyInsights();
  }

  // Participation rate
  const participationRate: Record<string, number> = {};
  for (const msg of messages) {
    participationRate[msg.sender] = (participationRate[msg.sender] || 0) + 1;
  }
  for (const sender of Object.keys(participationRate)) {
    const current = participationRate[sender];
    if (current !== undefined) {
      participationRate[sender] = current / messages.length;
    }
  }

  // Response times
  const responseTimes: number[] = [];
  for (let i = 1; i < messages.length; i++) {
    const current = messages[i];
    const previous = messages[i - 1];
    if (current && previous && current.sender !== previous.sender) {
      responseTimes.push(current.timestamp - previous.timestamp);
    }
  }

  const avgResponse =
    responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

  // Communication style analysis
  const allText = messages.map((m) => m.content).join(' ');
  const avgWordLength =
    allText.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / allText.split(/\s+/).length;

  const formality = Math.min(1, avgWordLength / 8); // Longer words = more formal
  const verbosity = Math.min(
    1,
    messages.reduce((sum, m) => sum + m.content.length, 0) / (messages.length * 100)
  );

  const sentiment = await analyzeSentiment(allText);
  const emotionality = sentiment.magnitude;

  // Topic analysis
  const topicData = await extractTopics(messages);
  const topicsDiscussed = topicData.topics.map((t) => ({
    topic: t.name,
    frequency: t.messageCount,
    sentiment: 0,
  }));

  // Engagement score
  const engagementScore =
    (responseTimes.length > 0 ? Math.min(1, 60000 / avgResponse) : 0) * 0.4 +
    (Object.keys(participationRate).length / Math.max(2, Object.keys(participationRate).length)) *
      0.3 +
    emotionality * 0.3;

  return {
    participationRate,
    responseTime: {
      average: avgResponse,
      fastest: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      slowest: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    },
    topicsDiscussed,
    engagementScore,
    communicationStyle: {
      formality,
      verbosity,
      emotionality,
    },
    suggestions: generateSuggestions(engagementScore, formality, participationRate),
  };
}

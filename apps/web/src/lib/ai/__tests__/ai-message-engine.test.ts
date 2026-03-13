/**
 * AI Message Engine Tests
 *
 * Comprehensive test suite for the AI-powered messaging intelligence system.
 * Tests smart replies, sentiment analysis, moderation, and NLP features.
 *
 * @version 3.1.0
 * @since v0.7.35
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIMessageEngine } from '../ai-message-engine';
import type {
  SmartReply,
  SentimentAnalysis,
  ContentModeration,
  LanguageDetection,
  TopicExtraction,
  MessageSummary,
} from '../ai-message-engine';

describe('AIMessageEngine', () => {
  let engine: AIMessageEngine;

  beforeEach(() => {
    engine = new AIMessageEngine({
      enableLocalML: true,
      enableCloudAI: false,
      privacyMode: 'strict',
    });
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const defaultEngine = new AIMessageEngine();
      expect(defaultEngine).toBeDefined();
    });

    it('should respect configuration options', () => {
      const customEngine = new AIMessageEngine({
        enableLocalML: true,
        privacyMode: 'balanced',
        maxTokens: 200,
        temperature: 0.8,
      });
      expect(customEngine).toBeDefined();
    });
  });

  describe('Smart Replies', () => {
    it('should generate smart reply suggestions', async () => {
      const replies = await engine.generateSmartReplies(
        'Would you like to meet for coffee tomorrow?'
      );

      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
      expect(replies.length).toBeGreaterThan(0);
      expect(replies.length).toBeLessThanOrEqual(3);
    });

    it('should include confidence scores for replies', async () => {
      const replies = await engine.generateSmartReplies('How are you doing today?');

      for (const reply of replies) {
        expect(reply.text).toBeDefined();
        expect(reply.confidence).toBeGreaterThanOrEqual(0);
        expect(reply.confidence).toBeLessThanOrEqual(1);
        expect(reply.category).toBeDefined();
      }
    });

    it('should generate appropriate replies for questions', async () => {
      const replies = await engine.generateSmartReplies('Can you help me with this project?');

      expect(
        replies.some(
          (r: SmartReply) =>
            r.text.toLowerCase().includes('yes') ||
            r.text.toLowerCase().includes('sure') ||
            r.text.toLowerCase().includes('help')
        )
      ).toBe(true);
    });

    it('should generate appropriate replies for greetings', async () => {
      const replies = await engine.generateSmartReplies('Hello! How are you?');

      expect(
        replies.some(
          (r: SmartReply) =>
            r.text.toLowerCase().includes('hello') ||
            r.text.toLowerCase().includes('hey') ||
            r.text.toLowerCase().includes('hi') ||
            r.text.includes('👋')
        )
      ).toBe(true);
    });

    it('should consider conversation context', async () => {
      const context = {
        conversationHistory: ['Are you free next week?', 'Yes, I should be available.'],
      };

      const replies = await engine.generateSmartReplies('Great! How about Tuesday?', context);

      expect(replies.length).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should analyze positive sentiment', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'I am so happy and excited about this amazing news!'
      );

      expect(sentiment.label).toMatch(/positive/);
      expect(sentiment.score).toBeGreaterThan(0.3);
    });

    it('should analyze negative sentiment', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'This is terrible, I am so disappointed and frustrated.'
      );

      expect(sentiment.label).toMatch(/negative/);
      expect(sentiment.score).toBeLessThan(-0.2);
    });

    it('should analyze neutral sentiment', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'The meeting is scheduled for 3pm tomorrow.'
      );

      expect(sentiment.label).toBe('neutral');
      expect(Math.abs(sentiment.score)).toBeLessThanOrEqual(0.2);
    });

    it('should detect specific emotions', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'I am absolutely furious about what happened!'
      );

      expect(sentiment.emotions).toBeDefined();
      expect(sentiment.emotions.anger).toBeGreaterThan(0.5);
    });

    it('should detect joy emotion', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'This is the best day ever! I am so happy and grateful!'
      );

      expect(sentiment.emotions.joy).toBeGreaterThan(0.5);
    });

    it('should detect surprise emotion', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'Wow! I cannot believe this! What an unexpected surprise!'
      );

      expect(sentiment.emotions.surprise).toBeGreaterThan(0.3);
    });

    it('should include magnitude score', async () => {
      const sentiment: SentimentAnalysis = await engine.analyzeSentiment(
        'I love this product, it works perfectly!'
      );

      expect(sentiment.magnitude).toBeGreaterThanOrEqual(0);
      expect(sentiment.magnitude).toBeLessThanOrEqual(1);
    });
  });

  describe('Content Moderation', () => {
    it('should approve clean content', async () => {
      const result: ContentModeration = await engine.moderateContent(
        'Hello! How can I help you with your project today?'
      );

      expect(result.isSafe).toBe(true);
      expect(result.severity).toBe('none');
    });

    it('should detect spam patterns', async () => {
      const result: ContentModeration = await engine.moderateContent(
        'FREE MONEY!!! Click here NOW to WIN $$$!!! Limited time only!!!'
      );

      expect(result.flags.spam).toBe(true);
    });

    it('should detect scam patterns', async () => {
      const result: ContentModeration = await engine.moderateContent(
        'You have won a prize! Send your social security number to claim.'
      );

      expect(result.flags.scam).toBe(true);
    });

    it('should include severity level', async () => {
      const result: ContentModeration = await engine.moderateContent(
        'Normal conversation message without any issues.'
      );

      expect(result.severity).toBeDefined();
      expect(['none', 'low', 'medium', 'high', 'critical']).toContain(result.severity);
    });

    it('should provide suggested action', async () => {
      const result: ContentModeration = await engine.moderateContent(
        'Buy now!!! Amazing deals!!! Click immediately!!!'
      );

      expect(result.suggestedAction).toBeDefined();
      expect(['allow', 'warn', 'filter', 'review', 'block']).toContain(result.suggestedAction);
    });

    it('should include confidence score', async () => {
      const result: ContentModeration = await engine.moderateContent('This is a test message.');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Language Detection', () => {
    it('should detect English', async () => {
      const result: LanguageDetection = await engine.detectLanguage(
        'Hello, how are you doing today? I hope you are having a great day.'
      );

      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect Spanish', async () => {
      const result: LanguageDetection = await engine.detectLanguage(
        'Hola, ¿cómo estás? Espero que tengas un buen día.'
      );

      expect(result.language).toBe('es');
    });

    it('should detect French', async () => {
      const result: LanguageDetection = await engine.detectLanguage(
        "Bonjour, comment allez-vous? J'espère que vous passez une bonne journée."
      );

      expect(result.language).toBe('fr');
    });

    it('should detect German', async () => {
      const result: LanguageDetection = await engine.detectLanguage(
        'Guten Tag, wie geht es Ihnen? Ich hoffe, Sie haben einen schönen Tag.'
      );

      expect(result.language).toBe('de');
    });

    it('should detect Japanese', async () => {
      const result: LanguageDetection = await engine.detectLanguage(
        'こんにちは、元気ですか？今日も良い一日を過ごしてください。'
      );

      expect(result.language).toBe('ja');
    });

    it('should detect Chinese', async () => {
      const result: LanguageDetection =
        await engine.detectLanguage('你好，你今天过得怎么样？希望你有美好的一天。');

      expect(result.language).toBe('zh');
    });

    it('should return alternatives for multilingual text', async () => {
      const result: LanguageDetection = await engine.detectLanguage('Hello bonjour hola');

      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
    });

    it('should detect if text is multilingual', async () => {
      const result: LanguageDetection = await engine.detectLanguage('Hello, comment ça va?');

      expect(typeof result.isMultilingual).toBe('boolean');
    });
  });

  describe('Topic Extraction', () => {
    it('should extract topics from messages', async () => {
      const topics: TopicExtraction = await engine.extractTopics([
        {
          content: 'We need to discuss the Q4 sales report and the marketing budget for next year.',
        },
      ]);

      expect(topics).toBeDefined();
      expect(topics.topics.length).toBeGreaterThan(0);
    });

    it('should include topic confidence scores', async () => {
      const topics: TopicExtraction = await engine.extractTopics([
        { content: "Let's plan a team building event and discuss the annual company retreat." },
      ]);

      for (const topic of topics.topics) {
        expect(topic.name).toBeDefined();
        expect(topic.confidence).toBeGreaterThanOrEqual(0);
        expect(topic.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should extract keywords from topics', async () => {
      const topics: TopicExtraction = await engine.extractTopics([
        {
          content:
            'The project deadline is next Friday, we need to finish the code review and testing.',
        },
      ]);

      const hasTopic = topics.topics.some((t) => t.keywords && t.keywords.length > 0);
      expect(hasTopic).toBe(true);
    });

    it('should identify entities', async () => {
      const topics: TopicExtraction = await engine.extractTopics([
        { content: 'John from Microsoft will present the new React framework on Monday.' },
      ]);

      expect(topics.entities).toBeDefined();
    });
  });

  describe('Message Summarization', () => {
    it('should summarize a conversation', async () => {
      const messages = [
        {
          sender: 'user1',
          content: 'Hey, did you see the new product launch?',
          timestamp: Date.now() - 300000,
        },
        {
          sender: 'user2',
          content: 'Yes! It looks amazing. The features are incredible.',
          timestamp: Date.now() - 240000,
        },
        {
          sender: 'user1',
          content: 'I especially liked the new design.',
          timestamp: Date.now() - 180000,
        },
        { sender: 'user2', content: 'The pricing seems fair too.', timestamp: Date.now() - 120000 },
        {
          sender: 'user1',
          content: 'Should we schedule a meeting to discuss adoption?',
          timestamp: Date.now() - 60000,
        },
      ];

      const summary: MessageSummary = await engine.summarizeConversation(messages);

      expect(summary.brief).toBeDefined();
      expect(summary.brief.length).toBeGreaterThan(0);
      expect(summary.detailed).toBeDefined();
    });

    it('should extract key points', async () => {
      const messages = [
        {
          sender: 'user1',
          content: 'We need to fix the bug in the login system. This is critical.',
          timestamp: Date.now() - 200000,
        },
        {
          sender: 'user2',
          content: 'I found the root cause, it is a session issue.',
          timestamp: Date.now() - 100000,
        },
        {
          sender: 'user1',
          content: 'Great! Can you have the fix ready by tomorrow?',
          timestamp: Date.now(),
        },
      ];

      const summary: MessageSummary = await engine.summarizeConversation(messages);

      expect(summary.keyPoints).toBeDefined();
      expect(Array.isArray(summary.keyPoints)).toBe(true);
    });

    it('should identify action items', async () => {
      const messages = [
        {
          sender: 'user1',
          content: 'Please review the document and send feedback. We need to finish this.',
          timestamp: Date.now() - 100000,
        },
        { sender: 'user2', content: 'Sure, I will do that by end of day.', timestamp: Date.now() },
      ];

      const summary: MessageSummary = await engine.summarizeConversation(messages);

      expect(summary.actionItems).toBeDefined();
      expect(Array.isArray(summary.actionItems)).toBe(true);
    });

    it('should handle empty conversation', async () => {
      const summary: MessageSummary = await engine.summarizeConversation([]);

      expect(summary.brief).toBeDefined();
      expect(summary.keyPoints).toEqual([]);
    });

    it('should extract questions', async () => {
      const messages = [
        { sender: 'user1', content: 'What time is the meeting?', timestamp: Date.now() - 100000 },
        { sender: 'user2', content: '3pm. Will you be there?', timestamp: Date.now() },
      ];

      const summary: MessageSummary = await engine.summarizeConversation(messages);

      expect(summary.questions).toBeDefined();
      expect(summary.questions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty messages gracefully', async () => {
      const replies = await engine.generateSmartReplies('');

      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);

      const sentiment = await engine.analyzeSentiment(longMessage);

      expect(sentiment).toBeDefined();
      expect(sentiment.label).toBeDefined();
    });

    it('should handle special characters', async () => {
      const specialMessage = '😀🎉✨ Hello <script>alert("xss")</script> & World 🌍';

      const sentiment = await engine.analyzeSentiment(specialMessage);

      expect(sentiment).toBeDefined();
    });

    it('should handle unicode text', async () => {
      const unicodeMessage = 'Привет мир! 你好世界！مرحبا بالعالم';

      const result = await engine.detectLanguage(unicodeMessage);

      expect(result).toBeDefined();
      expect(result.language).toBeDefined();
    });
  });
});

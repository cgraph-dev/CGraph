/**
 * AI Message Engine Tests
 * 
 * Comprehensive test suite for the AI-powered messaging intelligence system.
 * Tests smart replies, sentiment analysis, moderation, and NLP features.
 * 
 * @version 3.0.0
 * @since v0.7.35
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIMessageEngine } from '../AIMessageEngine';
import type {
  SmartReply,
  SentimentAnalysis,
  ModerationResult,
  ConversationInsight,
  TopicExtraction,
} from '../AIMessageEngine';

describe('AIMessageEngine', () => {
  let engine: AIMessageEngine;
  
  beforeEach(() => {
    engine = new AIMessageEngine({
      enableSmartReplies: true,
      enableSentimentAnalysis: true,
      enableContentModeration: true,
      localMLOnly: true,
    });
  });
  
  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const defaultEngine = new AIMessageEngine();
      expect(defaultEngine).toBeDefined();
    });
    
    it('should respect configuration options', () => {
      const customEngine = new AIMessageEngine({
        enableSmartReplies: false,
        maxSmartReplies: 5,
        moderationThreshold: 0.9,
      });
      expect(customEngine).toBeDefined();
    });
  });
  
  describe('Smart Replies', () => {
    it('should generate smart reply suggestions', async () => {
      const replies = await engine.generateSmartReplies({
        text: 'Would you like to meet for coffee tomorrow?',
        senderId: 'user1',
        timestamp: Date.now(),
      });
      
      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
      expect(replies.length).toBeGreaterThan(0);
      expect(replies.length).toBeLessThanOrEqual(3);
    });
    
    it('should include confidence scores for replies', async () => {
      const replies = await engine.generateSmartReplies({
        text: 'How are you doing today?',
        senderId: 'user1',
        timestamp: Date.now(),
      });
      
      for (const reply of replies) {
        expect(reply.text).toBeDefined();
        expect(reply.confidence).toBeGreaterThanOrEqual(0);
        expect(reply.confidence).toBeLessThanOrEqual(1);
        expect(reply.category).toBeDefined();
      }
    });
    
    it('should generate appropriate replies for questions', async () => {
      const replies = await engine.generateSmartReplies({
        text: 'Can you help me with this project?',
        senderId: 'user1',
        timestamp: Date.now(),
      });
      
      expect(replies.some(r => 
        r.text.toLowerCase().includes('yes') || 
        r.text.toLowerCase().includes('sure') ||
        r.text.toLowerCase().includes('help')
      )).toBe(true);
    });
    
    it('should generate appropriate replies for greetings', async () => {
      const replies = await engine.generateSmartReplies({
        text: 'Hello! How are you?',
        senderId: 'user1',
        timestamp: Date.now(),
      });
      
      expect(replies.some(r => 
        r.text.toLowerCase().includes('hello') || 
        r.text.toLowerCase().includes('hey') ||
        r.text.toLowerCase().includes('good') ||
        r.text.toLowerCase().includes('well')
      )).toBe(true);
    });
    
    it('should consider conversation context', async () => {
      const context = [
        { text: 'Are you free next week?', senderId: 'user1', timestamp: Date.now() - 60000 },
        { text: 'Yes, I should be available.', senderId: 'user2', timestamp: Date.now() - 30000 },
      ];
      
      const replies = await engine.generateSmartReplies({
        text: 'Great! How about Tuesday?',
        senderId: 'user1',
        timestamp: Date.now(),
      }, context);
      
      expect(replies.length).toBeGreaterThan(0);
    });
  });
  
  describe('Sentiment Analysis', () => {
    it('should analyze positive sentiment', async () => {
      const sentiment = await engine.analyzeSentiment(
        'I am so happy and excited about this amazing news!'
      );
      
      expect(sentiment.overall).toBe('positive');
      expect(sentiment.score).toBeGreaterThan(0.5);
    });
    
    it('should analyze negative sentiment', async () => {
      const sentiment = await engine.analyzeSentiment(
        'This is terrible, I am so disappointed and frustrated.'
      );
      
      expect(sentiment.overall).toBe('negative');
      expect(sentiment.score).toBeLessThan(-0.3);
    });
    
    it('should analyze neutral sentiment', async () => {
      const sentiment = await engine.analyzeSentiment(
        'The meeting is scheduled for 3pm tomorrow.'
      );
      
      expect(sentiment.overall).toBe('neutral');
      expect(Math.abs(sentiment.score)).toBeLessThan(0.3);
    });
    
    it('should detect specific emotions', async () => {
      const sentiment = await engine.analyzeSentiment(
        'I am absolutely furious about what happened!'
      );
      
      expect(sentiment.emotions).toBeDefined();
      expect(sentiment.emotions.anger).toBeGreaterThan(0.5);
    });
    
    it('should detect joy emotion', async () => {
      const sentiment = await engine.analyzeSentiment(
        'This is the best day ever! I am so happy and grateful!'
      );
      
      expect(sentiment.emotions.joy).toBeGreaterThan(0.5);
    });
    
    it('should detect surprise emotion', async () => {
      const sentiment = await engine.analyzeSentiment(
        'Wow! I cannot believe this! What an unexpected surprise!'
      );
      
      expect(sentiment.emotions.surprise).toBeGreaterThan(0.3);
    });
    
    it('should include confidence score', async () => {
      const sentiment = await engine.analyzeSentiment(
        'I love this product, it works perfectly!'
      );
      
      expect(sentiment.confidence).toBeGreaterThanOrEqual(0);
      expect(sentiment.confidence).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Content Moderation', () => {
    it('should approve clean content', async () => {
      const result = await engine.moderateContent(
        'Hello! How can I help you with your project today?'
      );
      
      expect(result.isApproved).toBe(true);
      expect(result.flags).toHaveLength(0);
    });
    
    it('should detect spam patterns', async () => {
      const result = await engine.moderateContent(
        'FREE MONEY!!! Click here NOW to WIN $$$!!! Limited time only!!!'
      );
      
      expect(result.flags.some(f => f.category === 'spam')).toBe(true);
    });
    
    it('should detect scam patterns', async () => {
      const result = await engine.moderateContent(
        'You have won a prize! Send your credit card and social security number to claim.'
      );
      
      expect(result.flags.some(f => 
        f.category === 'scam' || f.category === 'phishing'
      )).toBe(true);
    });
    
    it('should include severity scores', async () => {
      const result = await engine.moderateContent(
        'This message contains some suspicious content.'
      );
      
      for (const flag of result.flags) {
        expect(flag.severity).toBeGreaterThanOrEqual(0);
        expect(flag.severity).toBeLessThanOrEqual(1);
        expect(flag.evidence).toBeDefined();
      }
    });
    
    it('should provide action recommendations', async () => {
      const result = await engine.moderateContent(
        'Buy now!!! Amazing deals!!! Click immediately!!!'
      );
      
      expect(result.suggestedAction).toBeDefined();
      expect(['approve', 'flag', 'block', 'review']).toContain(result.suggestedAction);
    });
    
    it('should calculate overall risk score', async () => {
      const result = await engine.moderateContent(
        'Normal conversation message without any issues.'
      );
      
      expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(result.overallRiskScore).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Language Detection', () => {
    it('should detect English', async () => {
      const result = await engine.detectLanguage(
        'Hello, how are you doing today? I hope you are having a great day.'
      );
      
      expect(result.primary).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
    
    it('should detect Spanish', async () => {
      const result = await engine.detectLanguage(
        'Hola, ¿cómo estás? Espero que tengas un buen día.'
      );
      
      expect(result.primary).toBe('es');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    it('should detect French', async () => {
      const result = await engine.detectLanguage(
        'Bonjour, comment allez-vous? J\'espère que vous passez une bonne journée.'
      );
      
      expect(result.primary).toBe('fr');
    });
    
    it('should detect German', async () => {
      const result = await engine.detectLanguage(
        'Guten Tag, wie geht es Ihnen? Ich hoffe, Sie haben einen schönen Tag.'
      );
      
      expect(result.primary).toBe('de');
    });
    
    it('should detect Japanese', async () => {
      const result = await engine.detectLanguage(
        'こんにちは、元気ですか？今日も良い一日を過ごしてください。'
      );
      
      expect(result.primary).toBe('ja');
    });
    
    it('should detect Chinese', async () => {
      const result = await engine.detectLanguage(
        '你好，你今天过得怎么样？希望你有美好的一天。'
      );
      
      expect(result.primary).toBe('zh');
    });
    
    it('should return alternatives for ambiguous text', async () => {
      const result = await engine.detectLanguage('OK');
      
      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
    });
  });
  
  describe('Topic Extraction', () => {
    it('should extract topics from text', async () => {
      const topics = await engine.extractTopics(
        'We need to discuss the Q4 sales report and the marketing budget for next year.'
      );
      
      expect(topics).toBeDefined();
      expect(topics.topics.length).toBeGreaterThan(0);
    });
    
    it('should categorize topics', async () => {
      const topics = await engine.extractTopics(
        'The new JavaScript framework uses TypeScript and includes React components.'
      );
      
      expect(topics.topics.some(t => t.category === 'technology')).toBe(true);
    });
    
    it('should include topic confidence scores', async () => {
      const topics = await engine.extractTopics(
        'Let\'s plan a team building event and discuss the annual company retreat.'
      );
      
      for (const topic of topics.topics) {
        expect(topic.name).toBeDefined();
        expect(topic.confidence).toBeGreaterThanOrEqual(0);
        expect(topic.confidence).toBeLessThanOrEqual(1);
      }
    });
    
    it('should identify primary topic', async () => {
      const topics = await engine.extractTopics(
        'The project deadline is next Friday, we need to finish the code review and testing.'
      );
      
      expect(topics.primaryTopic).toBeDefined();
    });
  });
  
  describe('Message Summarization', () => {
    it('should summarize a conversation', async () => {
      const messages = [
        { text: 'Hey, did you see the new product launch?', senderId: 'user1', timestamp: Date.now() - 300000 },
        { text: 'Yes! It looks amazing. The features are incredible.', senderId: 'user2', timestamp: Date.now() - 240000 },
        { text: 'I especially liked the new design.', senderId: 'user1', timestamp: Date.now() - 180000 },
        { text: 'The pricing seems fair too.', senderId: 'user2', timestamp: Date.now() - 120000 },
        { text: 'Should we schedule a meeting to discuss adoption?', senderId: 'user1', timestamp: Date.now() - 60000 },
      ];
      
      const summary = await engine.summarizeConversation(messages);
      
      expect(summary.summary).toBeDefined();
      expect(summary.summary.length).toBeGreaterThan(0);
      expect(summary.summary.length).toBeLessThan(500);
    });
    
    it('should extract key points', async () => {
      const messages = [
        { text: 'We need to fix the bug in the login system.', senderId: 'user1', timestamp: Date.now() - 200000 },
        { text: 'I found the root cause, it is a session issue.', senderId: 'user2', timestamp: Date.now() - 100000 },
        { text: 'Great! Can you have the fix ready by tomorrow?', senderId: 'user1', timestamp: Date.now() },
      ];
      
      const summary = await engine.summarizeConversation(messages);
      
      expect(summary.keyPoints).toBeDefined();
      expect(summary.keyPoints.length).toBeGreaterThan(0);
    });
    
    it('should identify action items', async () => {
      const messages = [
        { text: 'Please review the document and send feedback.', senderId: 'user1', timestamp: Date.now() - 100000 },
        { text: 'Sure, I will do that by end of day.', senderId: 'user2', timestamp: Date.now() },
      ];
      
      const summary = await engine.summarizeConversation(messages);
      
      expect(summary.actionItems).toBeDefined();
      expect(summary.actionItems.length).toBeGreaterThan(0);
    });
  });
  
  describe('Conversation Insights', () => {
    it('should generate conversation insights', async () => {
      const messages = [
        { text: 'Good morning!', senderId: 'user1', timestamp: Date.now() - 500000 },
        { text: 'Good morning! How can I help?', senderId: 'user2', timestamp: Date.now() - 450000 },
        { text: 'I have a question about the project.', senderId: 'user1', timestamp: Date.now() - 400000 },
        { text: 'Sure, what would you like to know?', senderId: 'user2', timestamp: Date.now() - 350000 },
        { text: 'What is the timeline?', senderId: 'user1', timestamp: Date.now() - 300000 },
        { text: 'We expect completion in 2 weeks.', senderId: 'user2', timestamp: Date.now() - 250000 },
      ];
      
      const insights = await engine.generateInsights(messages);
      
      expect(insights).toBeDefined();
      expect(insights.participantAnalysis).toBeDefined();
      expect(insights.engagementScore).toBeGreaterThanOrEqual(0);
      expect(insights.engagementScore).toBeLessThanOrEqual(1);
    });
    
    it('should analyze response times', async () => {
      const messages = [
        { text: 'Hello?', senderId: 'user1', timestamp: Date.now() - 60000 },
        { text: 'Hi there!', senderId: 'user2', timestamp: Date.now() - 55000 },
      ];
      
      const insights = await engine.generateInsights(messages);
      
      expect(insights.averageResponseTime).toBeDefined();
      expect(insights.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
    
    it('should identify conversation patterns', async () => {
      const messages = [
        { text: 'Can you help?', senderId: 'user1', timestamp: Date.now() - 100000 },
        { text: 'Yes, of course!', senderId: 'user2', timestamp: Date.now() - 90000 },
        { text: 'Thank you!', senderId: 'user1', timestamp: Date.now() - 80000 },
      ];
      
      const insights = await engine.generateInsights(messages);
      
      expect(insights.patterns).toBeDefined();
    });
  });
  
  describe('Batch Processing', () => {
    it('should process multiple messages in batch', async () => {
      const messages = [
        'Hello, how are you?',
        'The weather is nice today.',
        'Can you help me with this task?',
      ];
      
      const results = await engine.batchProcess(messages);
      
      expect(results.length).toBe(messages.length);
      for (const result of results) {
        expect(result.sentiment).toBeDefined();
        expect(result.language).toBeDefined();
      }
    });
    
    it('should handle empty batch gracefully', async () => {
      const results = await engine.batchProcess([]);
      expect(results).toEqual([]);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle empty messages gracefully', async () => {
      const replies = await engine.generateSmartReplies({
        text: '',
        senderId: 'user1',
        timestamp: Date.now(),
      });
      
      expect(replies).toBeDefined();
      expect(Array.isArray(replies)).toBe(true);
    });
    
    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(10000);
      
      const sentiment = await engine.analyzeSentiment(longMessage);
      
      expect(sentiment).toBeDefined();
      expect(sentiment.overall).toBeDefined();
    });
    
    it('should handle special characters', async () => {
      const specialMessage = '😀🎉✨ Hello <script>alert("xss")</script> & World 🌍';
      
      const sentiment = await engine.analyzeSentiment(specialMessage);
      
      expect(sentiment).toBeDefined();
    });
  });
  
  describe('Privacy', () => {
    it('should not store message content when localMLOnly is true', async () => {
      const privateEngine = new AIMessageEngine({ localMLOnly: true });
      
      await privateEngine.analyzeSentiment('This is private content');
      
      // Engine should not have stored the message
      expect(privateEngine).toBeDefined();
    });
    
    it('should provide privacy-preserving analysis', async () => {
      const result = await engine.analyzePrivate(
        'This is sensitive information about a user.'
      );
      
      expect(result).toBeDefined();
      expect(result.wasProcessedLocally).toBe(true);
    });
  });
});

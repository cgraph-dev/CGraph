/**
 * AI Message Engine Data — Templates, Lexicons, and Patterns
 *
 * Static data used by the AIMessageEngine for smart replies,
 * sentiment analysis, and content moderation.
 *
 * @module lib/ai/data
 */

import type { SmartReply } from './types';

// =============================================================================
// SMART REPLY TEMPLATES
// =============================================================================

export const SMART_REPLY_TEMPLATES: Record<string, SmartReply[]> = {
  greeting: [
    {
      id: 'gr1',
      text: 'Hey! How are you?',
      confidence: 0.9,
      tone: 'friendly',
      category: 'acknowledgment',
    },
    {
      id: 'gr2',
      text: 'Hi there! 👋',
      confidence: 0.85,
      tone: 'casual',
      category: 'acknowledgment',
    },
    {
      id: 'gr3',
      text: 'Hello! Nice to hear from you',
      confidence: 0.8,
      tone: 'professional',
      category: 'acknowledgment',
    },
  ],
  question: [
    {
      id: 'q1',
      text: 'Yes, absolutely!',
      confidence: 0.9,
      tone: 'friendly',
      category: 'affirmative',
    },
    {
      id: 'q2',
      text: "No, sorry I can't",
      confidence: 0.85,
      tone: 'empathetic',
      category: 'negative',
    },
    {
      id: 'q3',
      text: 'Let me check and get back to you',
      confidence: 0.8,
      tone: 'professional',
      category: 'action',
    },
    {
      id: 'q4',
      text: "I'm not sure, can you clarify?",
      confidence: 0.75,
      tone: 'casual',
      category: 'question',
    },
  ],
  thanks: [
    {
      id: 't1',
      text: "You're welcome! 😊",
      confidence: 0.95,
      tone: 'friendly',
      category: 'acknowledgment',
    },
    {
      id: 't2',
      text: 'No problem at all!',
      confidence: 0.9,
      tone: 'casual',
      category: 'acknowledgment',
    },
    {
      id: 't3',
      text: 'Happy to help!',
      confidence: 0.85,
      tone: 'professional',
      category: 'acknowledgment',
    },
  ],
  farewell: [
    {
      id: 'f1',
      text: 'Talk soon! 👋',
      confidence: 0.9,
      tone: 'friendly',
      category: 'acknowledgment',
    },
    {
      id: 'f2',
      text: 'Bye! Have a great day!',
      confidence: 0.85,
      tone: 'casual',
      category: 'acknowledgment',
    },
    {
      id: 'f3',
      text: 'Take care!',
      confidence: 0.8,
      tone: 'empathetic',
      category: 'acknowledgment',
    },
  ],
  agreement: [
    { id: 'a1', text: 'I agree!', confidence: 0.9, tone: 'casual', category: 'affirmative' },
    {
      id: 'a2',
      text: 'Exactly my thoughts!',
      confidence: 0.85,
      tone: 'friendly',
      category: 'affirmative',
    },
    {
      id: 'a3',
      text: 'That makes sense',
      confidence: 0.8,
      tone: 'professional',
      category: 'affirmative',
    },
  ],
  disagreement: [
    {
      id: 'd1',
      text: 'I see it differently',
      confidence: 0.8,
      tone: 'professional',
      category: 'negative',
    },
    {
      id: 'd2',
      text: "Hmm, I'm not so sure about that",
      confidence: 0.75,
      tone: 'casual',
      category: 'negative',
    },
    {
      id: 'd3',
      text: "Let's discuss this more",
      confidence: 0.7,
      tone: 'friendly',
      category: 'action',
    },
  ],
  excitement: [
    {
      id: 'e1',
      text: "That's amazing! 🎉",
      confidence: 0.95,
      tone: 'friendly',
      category: 'affirmative',
    },
    { id: 'e2', text: 'So excited!', confidence: 0.9, tone: 'casual', category: 'affirmative' },
    {
      id: 'e3',
      text: 'This is great news!',
      confidence: 0.85,
      tone: 'professional',
      category: 'affirmative',
    },
  ],
  sympathy: [
    {
      id: 's1',
      text: "I'm sorry to hear that 💙",
      confidence: 0.9,
      tone: 'empathetic',
      category: 'acknowledgment',
    },
    {
      id: 's2',
      text: 'That sounds tough. How can I help?',
      confidence: 0.85,
      tone: 'empathetic',
      category: 'question',
    },
    {
      id: 's3',
      text: "I'm here for you",
      confidence: 0.8,
      tone: 'empathetic',
      category: 'acknowledgment',
    },
  ],
};

// =============================================================================
// SENTIMENT LEXICON
// =============================================================================

export const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive words
  amazing: 0.9,
  awesome: 0.85,
  excellent: 0.9,
  fantastic: 0.9,
  great: 0.8,
  good: 0.6,
  nice: 0.5,
  wonderful: 0.85,
  love: 0.9,
  happy: 0.8,
  joy: 0.85,
  excited: 0.8,
  thrilled: 0.9,
  perfect: 0.95,
  beautiful: 0.8,
  brilliant: 0.85,
  outstanding: 0.9,
  superb: 0.9,
  thank: 0.6,
  thanks: 0.6,
  appreciate: 0.7,
  grateful: 0.8,
  yes: 0.3,
  sure: 0.3,
  okay: 0.2,
  agree: 0.4,
  definitely: 0.5,

  // Negative words
  terrible: -0.9,
  awful: -0.85,
  horrible: -0.9,
  bad: -0.6,
  poor: -0.5,
  disappointing: -0.7,
  sad: -0.7,
  angry: -0.8,
  frustrated: -0.7,
  annoyed: -0.6,
  hate: -0.9,
  dislike: -0.6,
  worried: -0.5,
  anxious: -0.6,
  stressed: -0.6,
  upset: -0.7,
  sorry: -0.3,
  unfortunately: -0.4,
  problem: -0.5,
  issue: -0.4,
  no: -0.2,
  never: -0.4,
  wrong: -0.5,
  fail: -0.7,
  failed: -0.7,
};

// =============================================================================
// SPAM/SCAM PATTERNS
// =============================================================================

export const SPAM_PATTERNS = [
  /\b(viagra|cialis|pharmacy)\b/i,
  /\b(free\s+money|lottery\s+winner|congratulations\s+you\s+won)\b/i,
  /\b(click\s+here|act\s+now|limited\s+time)\b/i,
  /\b(make\s+money\s+fast|work\s+from\s+home\s+\$\d+)/i,
  /\b(nigerian\s+prince|inheritance|unclaimed\s+funds)\b/i,
];

export const SCAM_PATTERNS = [
  /\b(send\s+\$?\d+|wire\s+transfer|western\s+union)\b/i,
  /\b(gift\s+card|itunes\s+card|google\s+play\s+card)\b/i,
  /\b(verify\s+your\s+(account|identity|password))\b/i,
  /\b(social\s+security|ssn|bank\s+account\s+number)\b/i,
  /\b(irs|tax\s+refund|government\s+agency)\b/i,
  /\b(crypto|bitcoin|wallet)\s+(invest|double|multiply)/i,
];

export const HARASSMENT_PATTERNS = [
  /\b(kill\s+yourself|kys|die)\b/i,
  /\b(threat|hurt\s+you|find\s+you)\b/i,
];

// =============================================================================
// STOP WORDS
// =============================================================================

export const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'shall',
  'can',
  'need',
  'dare',
  'to',
  'of',
  'in',
  'for',
  'on',
  'with',
  'at',
  'by',
  'from',
  'as',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'me',
  'him',
  'her',
  'and',
  'or',
  'but',
  'if',
  'then',
  'else',
  'when',
  'up',
  'down',
  'this',
  'that',
  'these',
  'those',
  'what',
  'which',
  'who',
  'whom',
]);

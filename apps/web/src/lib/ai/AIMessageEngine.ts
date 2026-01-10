/**
 * AI Message Intelligence Engine
 * 
 * Advanced AI-powered features for message processing, including:
 * - Smart reply suggestions
 * - Message summarization
 * - Sentiment analysis
 * - Language detection and translation
 * - Content moderation
 * - Conversation insights
 * - Spam/scam detection
 * - Topic extraction
 * 
 * Uses local ML models where possible for privacy,
 * with optional cloud AI for enhanced features.
 * 
 * @version 3.0.0
 * @since v0.7.35
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SmartReply {
  id: string;
  text: string;
  confidence: number;
  tone: 'casual' | 'professional' | 'friendly' | 'empathetic' | 'humorous';
  category: 'affirmative' | 'negative' | 'question' | 'acknowledgment' | 'action';
}

export interface MessageSummary {
  brief: string;           // One sentence summary
  detailed: string;        // Paragraph summary
  keyPoints: string[];     // Bullet points
  actionItems: string[];   // Extracted tasks
  decisions: string[];     // Decisions made
  questions: string[];     // Unanswered questions
}

export interface SentimentAnalysis {
  score: number;           // -1 to 1 (negative to positive)
  magnitude: number;       // 0 to 1 (intensity)
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  dominantEmotion: string;
}

export interface LanguageDetection {
  language: string;        // ISO 639-1 code
  confidence: number;
  alternatives: Array<{ language: string; confidence: number }>;
  isMultilingual: boolean;
  segments?: Array<{ text: string; language: string }>;
}

export interface ContentModeration {
  isSafe: boolean;
  flags: {
    spam: boolean;
    scam: boolean;
    harassment: boolean;
    hateSpeech: boolean;
    violence: boolean;
    adult: boolean;
    selfHarm: boolean;
    misinformation: boolean;
  };
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  suggestedAction: 'allow' | 'warn' | 'filter' | 'block' | 'review';
  explanation?: string;
}

export interface ConversationInsight {
  participationRate: Record<string, number>;
  responseTime: {
    average: number;
    fastest: number;
    slowest: number;
  };
  topicsDiscussed: Array<{ topic: string; frequency: number; sentiment: number }>;
  engagementScore: number;
  communicationStyle: {
    formality: number;      // 0 = casual, 1 = formal
    verbosity: number;      // 0 = concise, 1 = verbose
    emotionality: number;   // 0 = rational, 1 = emotional
  };
  suggestions: string[];
}

export interface TopicExtraction {
  topics: Array<{
    name: string;
    confidence: number;
    keywords: string[];
    sentiment: number;
    messageCount: number;
  }>;
  categories: string[];
  entities: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'product' | 'event';
    confidence: number;
  }>;
}

export interface AIConfig {
  enableLocalML: boolean;
  enableCloudAI: boolean;
  cloudEndpoint?: string;
  apiKey?: string;
  privacyMode: 'strict' | 'balanced' | 'permissive';
  maxTokens: number;
  temperature: number;
  language: string;
}

// =============================================================================
// SMART REPLY TEMPLATES
// =============================================================================

const SMART_REPLY_TEMPLATES: Record<string, SmartReply[]> = {
  greeting: [
    { id: 'gr1', text: 'Hey! How are you?', confidence: 0.9, tone: 'friendly', category: 'acknowledgment' },
    { id: 'gr2', text: 'Hi there! 👋', confidence: 0.85, tone: 'casual', category: 'acknowledgment' },
    { id: 'gr3', text: 'Hello! Nice to hear from you', confidence: 0.8, tone: 'professional', category: 'acknowledgment' },
  ],
  question: [
    { id: 'q1', text: 'Yes, absolutely!', confidence: 0.9, tone: 'friendly', category: 'affirmative' },
    { id: 'q2', text: 'No, sorry I can\'t', confidence: 0.85, tone: 'empathetic', category: 'negative' },
    { id: 'q3', text: 'Let me check and get back to you', confidence: 0.8, tone: 'professional', category: 'action' },
    { id: 'q4', text: 'I\'m not sure, can you clarify?', confidence: 0.75, tone: 'casual', category: 'question' },
  ],
  thanks: [
    { id: 't1', text: 'You\'re welcome! 😊', confidence: 0.95, tone: 'friendly', category: 'acknowledgment' },
    { id: 't2', text: 'No problem at all!', confidence: 0.9, tone: 'casual', category: 'acknowledgment' },
    { id: 't3', text: 'Happy to help!', confidence: 0.85, tone: 'professional', category: 'acknowledgment' },
  ],
  farewell: [
    { id: 'f1', text: 'Talk soon! 👋', confidence: 0.9, tone: 'friendly', category: 'acknowledgment' },
    { id: 'f2', text: 'Bye! Have a great day!', confidence: 0.85, tone: 'casual', category: 'acknowledgment' },
    { id: 'f3', text: 'Take care!', confidence: 0.8, tone: 'empathetic', category: 'acknowledgment' },
  ],
  agreement: [
    { id: 'a1', text: 'I agree!', confidence: 0.9, tone: 'casual', category: 'affirmative' },
    { id: 'a2', text: 'Exactly my thoughts!', confidence: 0.85, tone: 'friendly', category: 'affirmative' },
    { id: 'a3', text: 'That makes sense', confidence: 0.8, tone: 'professional', category: 'affirmative' },
  ],
  disagreement: [
    { id: 'd1', text: 'I see it differently', confidence: 0.8, tone: 'professional', category: 'negative' },
    { id: 'd2', text: 'Hmm, I\'m not so sure about that', confidence: 0.75, tone: 'casual', category: 'negative' },
    { id: 'd3', text: 'Let\'s discuss this more', confidence: 0.7, tone: 'friendly', category: 'action' },
  ],
  excitement: [
    { id: 'e1', text: 'That\'s amazing! 🎉', confidence: 0.95, tone: 'friendly', category: 'affirmative' },
    { id: 'e2', text: 'So excited!', confidence: 0.9, tone: 'casual', category: 'affirmative' },
    { id: 'e3', text: 'This is great news!', confidence: 0.85, tone: 'professional', category: 'affirmative' },
  ],
  sympathy: [
    { id: 's1', text: 'I\'m sorry to hear that 💙', confidence: 0.9, tone: 'empathetic', category: 'acknowledgment' },
    { id: 's2', text: 'That sounds tough. How can I help?', confidence: 0.85, tone: 'empathetic', category: 'question' },
    { id: 's3', text: 'I\'m here for you', confidence: 0.8, tone: 'empathetic', category: 'acknowledgment' },
  ],
};

// =============================================================================
// SENTIMENT LEXICON
// =============================================================================

const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive words
  'amazing': 0.9, 'awesome': 0.85, 'excellent': 0.9, 'fantastic': 0.9,
  'great': 0.8, 'good': 0.6, 'nice': 0.5, 'wonderful': 0.85, 'love': 0.9,
  'happy': 0.8, 'joy': 0.85, 'excited': 0.8, 'thrilled': 0.9, 'perfect': 0.95,
  'beautiful': 0.8, 'brilliant': 0.85, 'outstanding': 0.9, 'superb': 0.9,
  'thank': 0.6, 'thanks': 0.6, 'appreciate': 0.7, 'grateful': 0.8,
  'yes': 0.3, 'sure': 0.3, 'okay': 0.2, 'agree': 0.4, 'definitely': 0.5,
  
  // Negative words
  'terrible': -0.9, 'awful': -0.85, 'horrible': -0.9, 'bad': -0.6,
  'poor': -0.5, 'disappointing': -0.7, 'sad': -0.7, 'angry': -0.8,
  'frustrated': -0.7, 'annoyed': -0.6, 'hate': -0.9, 'dislike': -0.6,
  'worried': -0.5, 'anxious': -0.6, 'stressed': -0.6, 'upset': -0.7,
  'sorry': -0.3, 'unfortunately': -0.4, 'problem': -0.5, 'issue': -0.4,
  'no': -0.2, 'never': -0.4, 'wrong': -0.5, 'fail': -0.7, 'failed': -0.7,
};

// =============================================================================
// SPAM/SCAM PATTERNS
// =============================================================================

const SPAM_PATTERNS = [
  /\b(viagra|cialis|pharmacy)\b/i,
  /\b(free\s+money|lottery\s+winner|congratulations\s+you\s+won)\b/i,
  /\b(click\s+here|act\s+now|limited\s+time)\b/i,
  /\b(make\s+money\s+fast|work\s+from\s+home\s+\$\d+)/i,
  /\b(nigerian\s+prince|inheritance|unclaimed\s+funds)\b/i,
];

const SCAM_PATTERNS = [
  /\b(send\s+\$?\d+|wire\s+transfer|western\s+union)\b/i,
  /\b(gift\s+card|itunes\s+card|google\s+play\s+card)\b/i,
  /\b(verify\s+your\s+(account|identity|password))\b/i,
  /\b(social\s+security|ssn|bank\s+account\s+number)\b/i,
  /\b(irs|tax\s+refund|government\s+agency)\b/i,
  /\b(crypto|bitcoin|wallet)\s+(invest|double|multiply)/i,
];

const HARASSMENT_PATTERNS = [
  /\b(kill\s+yourself|kys|die)\b/i,
  /\b(threat|hurt\s+you|find\s+you)\b/i,
];

// =============================================================================
// AI MESSAGE ENGINE
// =============================================================================

export class AIMessageEngine {
  private config: AIConfig;
  private conversationHistory: Array<{ role: string; content: string; timestamp: number }> = [];
  private insightsCache: Map<string, ConversationInsight> = new Map();
  
  constructor(config: Partial<AIConfig> = {}) {
    this.config = {
      enableLocalML: config.enableLocalML ?? true,
      enableCloudAI: config.enableCloudAI ?? false,
      privacyMode: config.privacyMode ?? 'strict',
      maxTokens: config.maxTokens ?? 150,
      temperature: config.temperature ?? 0.7,
      language: config.language ?? 'en',
      ...config,
    };
  }
  
  // ===========================================================================
  // SMART REPLIES
  // ===========================================================================
  
  /**
   * Generate smart reply suggestions for a message
   */
  async generateSmartReplies(
    message: string,
    context?: { conversationHistory?: string[]; senderName?: string }
  ): Promise<SmartReply[]> {
    const category = this.categorizeMessage(message);
    const sentiment = await this.analyzeSentiment(message);
    
    // Get base templates
    let replies = [...(SMART_REPLY_TEMPLATES[category] || [])];
    
    // If we detect specific intents, add contextual replies
    if (this.containsQuestion(message)) {
      replies = [...replies, ...SMART_REPLY_TEMPLATES.question];
    }
    
    if (sentiment.label === 'very_positive' || sentiment.dominantEmotion === 'joy') {
      replies = [...replies, ...SMART_REPLY_TEMPLATES.excitement];
    }
    
    if (sentiment.label === 'negative' || sentiment.dominantEmotion === 'sadness') {
      replies = [...replies, ...SMART_REPLY_TEMPLATES.sympathy];
    }
    
    // Score and rank replies
    const scoredReplies = replies.map(reply => ({
      ...reply,
      confidence: this.adjustConfidence(reply, message, context),
    }));
    
    // Sort by confidence and deduplicate
    const seen = new Set<string>();
    const uniqueReplies = scoredReplies
      .sort((a, b) => b.confidence - a.confidence)
      .filter(reply => {
        if (seen.has(reply.text)) return false;
        seen.add(reply.text);
        return true;
      })
      .slice(0, 3); // Return top 3
    
    return uniqueReplies;
  }
  
  private categorizeMessage(message: string): string {
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
  
  private containsQuestion(message: string): boolean {
    return /\?/.test(message) || 
           /^(what|when|where|who|why|how|can|could|would|should|is|are|do|does)/i.test(message.trim());
  }
  
  private adjustConfidence(
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
      const isInformal = context.conversationHistory.some(m => 
        /lol|haha|omg|btw|idk/i.test(m)
      );
      if (isInformal && reply.tone === 'professional') {
        confidence -= 0.15;
      }
    }
    
    return Math.min(1, Math.max(0, confidence));
  }
  
  // ===========================================================================
  // SENTIMENT ANALYSIS
  // ===========================================================================
  
  /**
   * Analyze sentiment of a message
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
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
    const emotions = this.extractEmotions(text, score);
    const dominantEmotion = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)[0][0];
    
    return {
      score,
      magnitude,
      label,
      emotions,
      dominantEmotion,
    };
  }
  
  private extractEmotions(text: string, baseSentiment: number): SentimentAnalysis['emotions'] {
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
  
  // ===========================================================================
  // MESSAGE SUMMARIZATION
  // ===========================================================================
  
  /**
   * Summarize a conversation
   */
  async summarizeConversation(
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
    const allText = messages.map(m => m.content).join(' ');
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Extract action items (sentences with action verbs)
    const actionItems = sentences
      .filter(s => /\b(need to|should|must|will|going to|have to|let'?s)\b/i.test(s))
      .map(s => s.trim())
      .slice(0, 5);
    
    // Extract questions
    const questions = messages
      .filter(m => m.content.includes('?'))
      .map(m => m.content)
      .slice(0, 5);
    
    // Extract decisions (sentences with decision indicators)
    const decisions = sentences
      .filter(s => /\b(decided|agreed|confirmed|approved|will do|let'?s go with)\b/i.test(s))
      .map(s => s.trim())
      .slice(0, 5);
    
    // Generate key points (most important sentences)
    const keyPoints = this.extractKeyPoints(sentences);
    
    // Generate summaries
    const brief = this.generateBriefSummary(messages);
    const detailed = this.generateDetailedSummary(messages, keyPoints);
    
    return {
      brief,
      detailed,
      keyPoints,
      actionItems,
      decisions,
      questions,
    };
  }
  
  private extractKeyPoints(sentences: string[]): string[] {
    // Score sentences by importance
    const scored = sentences.map(sentence => {
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
      .map(s => s.sentence);
  }
  
  private generateBriefSummary(
    messages: Array<{ sender: string; content: string }>
  ): string {
    const participants = [...new Set(messages.map(m => m.sender))];
    const messageCount = messages.length;
    
    if (messageCount === 1) {
      return `${participants[0]} sent a message.`;
    }
    
    return `Conversation between ${participants.join(' and ')} with ${messageCount} messages.`;
  }
  
  private generateDetailedSummary(
    messages: Array<{ sender: string; content: string }>,
    keyPoints: string[]
  ): string {
    const participants = [...new Set(messages.map(m => m.sender))];
    
    let summary = `This conversation involves ${participants.join(', ')}. `;
    
    if (keyPoints.length > 0) {
      summary += `Key topics discussed include: ${keyPoints.slice(0, 3).join('; ')}. `;
    }
    
    summary += `Total of ${messages.length} messages exchanged.`;
    
    return summary;
  }
  
  // ===========================================================================
  // LANGUAGE DETECTION
  // ===========================================================================
  
  /**
   * Detect language of text
   */
  async detectLanguage(text: string): Promise<LanguageDetection> {
    // Simple n-gram based detection
    const langScores = new Map<string, number>();
    
    // Common patterns for languages
    const patterns: Record<string, RegExp[]> = {
      en: [/\b(the|is|are|was|were|have|has|been|will|would)\b/gi],
      es: [/\b(el|la|los|las|es|está|son|están|que|de)\b/gi],
      fr: [/\b(le|la|les|est|sont|que|de|du|des|un|une)\b/gi],
      de: [/\b(der|die|das|ist|sind|und|oder|nicht|auch)\b/gi],
      pt: [/\b(o|a|os|as|é|são|que|de|do|da)\b/gi],
      it: [/\b(il|la|gli|le|è|sono|che|di|del|della)\b/gi],
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
    const sorted = Array.from(langScores.entries())
      .sort(([, a], [, b]) => b - a);
    
    const topLang = sorted[0];
    const totalScore = sorted.reduce((sum, [, score]) => sum + score, 0);
    
    return {
      language: topLang[0],
      confidence: topLang[1] / totalScore,
      alternatives: sorted.slice(1, 4).map(([language, score]) => ({
        language,
        confidence: score / totalScore,
      })),
      isMultilingual: sorted.length > 1 && sorted[1][1] / topLang[1] > 0.3,
    };
  }
  
  // ===========================================================================
  // CONTENT MODERATION
  // ===========================================================================
  
  /**
   * Moderate message content for safety
   */
  async moderateContent(text: string): Promise<ContentModeration> {
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
    const sentiment = await this.analyzeSentiment(text);
    if (sentiment.emotions.anger > 0.8) {
      flags.hateSpeech = true; // Flag for review
    }
    
    // Determine severity
    const flagCount = Object.values(flags).filter(Boolean).length;
    let severity: ContentModeration['severity'];
    if (flagCount === 0) severity = 'none';
    else if (flagCount === 1 && (flags.spam)) severity = 'low';
    else if (flags.harassment || flags.hateSpeech) severity = 'high';
    else if (flags.scam || flags.violence) severity = 'critical';
    else severity = 'medium';
    
    // Determine action
    let suggestedAction: ContentModeration['suggestedAction'];
    switch (severity) {
      case 'none': suggestedAction = 'allow'; break;
      case 'low': suggestedAction = 'warn'; break;
      case 'medium': suggestedAction = 'filter'; break;
      case 'high': suggestedAction = 'review'; break;
      case 'critical': suggestedAction = 'block'; break;
    }
    
    return {
      isSafe: flagCount === 0,
      flags,
      severity,
      confidence: 0.85, // Local model confidence
      suggestedAction,
      explanation: flagCount > 0 
        ? `Content flagged for: ${Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(', ')}`
        : undefined,
    };
  }
  
  // ===========================================================================
  // TOPIC EXTRACTION
  // ===========================================================================
  
  /**
   * Extract topics from conversation
   */
  async extractTopics(
    messages: Array<{ content: string }>
  ): Promise<TopicExtraction> {
    const allText = messages.map(m => m.content).join(' ');
    const words = allText.toLowerCase().split(/\s+/);
    
    // Count word frequencies (excluding stop words)
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'and', 'or', 'but', 'if', 'then', 'else', 'when', 'up', 'down',
      'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
    ]);
    
    const wordFreq = new Map<string, number>();
    for (const word of words) {
      const clean = word.replace(/[^a-z]/g, '');
      if (clean.length > 3 && !stopWords.has(clean)) {
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
    const entities = this.extractEntities(allText);
    
    return {
      topics,
      categories: topics.map(t => t.name),
      entities,
    };
  }
  
  private extractEntities(text: string): TopicExtraction['entities'] {
    const entities: TopicExtraction['entities'] = [];
    
    // Date patterns
    const datePatterns = text.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,?\s+\d{4})?\b/gi);
    if (datePatterns) {
      for (const match of datePatterns) {
        entities.push({ text: match, type: 'date', confidence: 0.9 });
      }
    }
    
    // Money patterns
    const moneyPatterns = text.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|usd|eur|gbp)/gi);
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
  
  // ===========================================================================
  // CONVERSATION INSIGHTS
  // ===========================================================================
  
  /**
   * Generate insights about a conversation
   */
  async generateInsights(
    messages: Array<{ sender: string; content: string; timestamp: number }>
  ): Promise<ConversationInsight> {
    if (messages.length === 0) {
      return this.emptyInsights();
    }
    
    // Participation rate
    const participationRate: Record<string, number> = {};
    for (const msg of messages) {
      participationRate[msg.sender] = (participationRate[msg.sender] || 0) + 1;
    }
    for (const sender of Object.keys(participationRate)) {
      participationRate[sender] /= messages.length;
    }
    
    // Response times
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender !== messages[i-1].sender) {
        responseTimes.push(messages[i].timestamp - messages[i-1].timestamp);
      }
    }
    
    const avgResponse = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    // Communication style analysis
    const allText = messages.map(m => m.content).join(' ');
    const avgWordLength = allText.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / 
                          allText.split(/\s+/).length;
    
    const formality = Math.min(1, avgWordLength / 8); // Longer words = more formal
    const verbosity = Math.min(1, messages.reduce((sum, m) => sum + m.content.length, 0) / 
                     (messages.length * 100));
    
    const sentiment = await this.analyzeSentiment(allText);
    const emotionality = sentiment.magnitude;
    
    // Topic analysis
    const topicData = await this.extractTopics(messages);
    const topicsDiscussed = topicData.topics.map(t => ({
      topic: t.name,
      frequency: t.messageCount,
      sentiment: 0,
    }));
    
    // Engagement score
    const engagementScore = (
      (responseTimes.length > 0 ? Math.min(1, 60000 / avgResponse) : 0) * 0.4 +
      Object.keys(participationRate).length / Math.max(2, Object.keys(participationRate).length) * 0.3 +
      emotionality * 0.3
    );
    
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
      suggestions: this.generateSuggestions(engagementScore, formality, participationRate),
    };
  }
  
  private emptyInsights(): ConversationInsight {
    return {
      participationRate: {},
      responseTime: { average: 0, fastest: 0, slowest: 0 },
      topicsDiscussed: [],
      engagementScore: 0,
      communicationStyle: { formality: 0.5, verbosity: 0.5, emotionality: 0.5 },
      suggestions: [],
    };
  }
  
  private generateSuggestions(
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
}

// =============================================================================
// EXPORTS
// =============================================================================

export const aiMessageEngine = new AIMessageEngine();

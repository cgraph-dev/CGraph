# Backend Integration Guide for CGraph Web v0.8.0

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [WebSocket Events](#websocket-events)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Models](#data-models)
7. [Implementation Examples](#implementation-examples)
8. [Testing Checklist](#testing-checklist)
9. [Migration Guide](#migration-guide)
10. [Performance Considerations](#performance-considerations)

---

## Overview

This guide provides everything needed to connect the new CGraph Web v0.8.0 frontend features to your backend. All features are currently frontend-only with persistent local storage. This guide shows how to sync them with your backend API.

**New Features Requiring Backend Integration:**
- UI Customization Preferences (50+ settings)
- Animated Avatar Styles
- Chat Bubble Customization (30+ options)
- Gamification System (XP, achievements, quests, lore)
- Message Reactions
- E2EE Connection Testing
- Rich Media Embeds
- Read Receipts
- Forum Nested Comments

---

## Database Schema

### 1. User Preferences Table

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL, -- 'ui', 'avatar', 'chat_bubble'
  preferences JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, preference_type)
);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON user_preferences(preference_type);
```

**Example Data:**

```json
{
  "preference_type": "ui",
  "preferences": {
    "theme": "midnight",
    "backgroundGradient": "aurora",
    "primaryColor": "#8b5cf6",
    "glassEffect": "holographic",
    "glassBlur": 24,
    "animationSpeed": "normal"
  }
}
```

### 2. Gamification Tables

```sql
-- User gamification data
CREATE TABLE user_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_login DATE,
  title VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Achievements
CREATE TABLE achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  xp_reward INTEGER NOT NULL,
  icon VARCHAR(50),
  requirements JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User achievements (junction table)
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Quests
CREATE TABLE quests (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  xp_reward INTEGER NOT NULL,
  requirements JSONB NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User quests
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id VARCHAR(50) NOT NULL REFERENCES quests(id),
  progress JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- Lore unlocks
CREATE TABLE user_lore (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Indexes
CREATE INDEX idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX idx_user_gamification_level ON user_gamification(level DESC);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_user_quests_completed ON user_quests(completed);
```

### 3. Message Reactions Table

```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
```

### 4. Read Receipts Table

```sql
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes
CREATE INDEX idx_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user_id ON message_read_receipts(user_id);
```

### 5. Forum Comments Table

```sql
CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_best_answer BOOLEAN DEFAULT FALSE,
  edited BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comment votes
CREATE TABLE forum_comment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL, -- 'upvote' or 'downvote'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_parent_id ON forum_comments(parent_id);
CREATE INDEX idx_forum_comments_author_id ON forum_comments(author_id);
CREATE INDEX idx_forum_comment_votes_comment_id ON forum_comment_votes(comment_id);
```

### 6. Media Metadata Table

```sql
CREATE TABLE media_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'image', 'video', 'audio', 'link'
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_media_metadata_url ON media_metadata(url);
CREATE INDEX idx_media_metadata_type ON media_metadata(type);
```

---

## API Endpoints

### User Preferences Endpoints

#### Get User Preferences
```http
GET /api/v1/users/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ui": {
    "theme": "midnight",
    "backgroundGradient": "aurora",
    "primaryColor": "#8b5cf6",
    "secondaryColor": "#3b82f6",
    "accentColor": "#ec4899",
    "glassEffect": "holographic",
    "glassBlur": 24,
    "glassOpacity": 15,
    "glassBorderWidth": 1,
    "glassGlowIntensity": 50,
    "particleDensity": "medium",
    "particleColor": "rainbow",
    "particleShape": "circle",
    "animationSpeed": "normal",
    "animationIntensity": "medium",
    "enableTransitions": true,
    "enableHoverEffects": true,
    "enable3DTransforms": true,
    "enableParallax": true,
    "fontSize": "base",
    "fontFamily": "inter",
    "fontWeight": "normal",
    "lineHeight": "normal",
    "letterSpacing": "normal",
    "spacingScale": 1,
    "borderRadius": "medium",
    "contentWidth": "full",
    "reducedMotion": false,
    "highContrast": false,
    "focusIndicators": true,
    "largeClickTargets": false,
    "enableHardwareAcceleration": true,
    "enableLazyLoading": true
  },
  "avatar": {
    "borderStyle": "rainbow",
    "borderWidth": 3,
    "borderColor": "#8b5cf6",
    "glowIntensity": 20,
    "animationSpeed": "normal",
    "shape": "circle"
  },
  "chatBubble": {
    "ownMessageBg": "#8b5cf6",
    "ownMessageText": "#ffffff",
    "otherMessageBg": "#374151",
    "otherMessageText": "#f3f4f6",
    "useGradient": false,
    "gradientDirection": "to-r",
    "borderRadius": 16,
    "bubbleShape": "rounded",
    "showTail": true,
    "glassEffect": false,
    "glassBlur": 10,
    "shadowIntensity": 20,
    "borderStyle": "none",
    "borderWidth": 1,
    "borderColor": "#ffffff20",
    "entranceAnimation": "slide",
    "hoverEffect": true,
    "sendAnimation": "bounce",
    "maxWidth": 70,
    "messageSpacing": 8,
    "groupSpacing": 16,
    "alignment": "default",
    "showTimestamp": true,
    "timestampPosition": "bottom",
    "showAvatar": true,
    "avatarPosition": "left",
    "groupMessages": true
  }
}
```

#### Update User Preferences
```http
PUT /api/v1/users/preferences
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "preference_type": "ui",
  "preferences": {
    "theme": "midnight",
    "glassEffect": "holographic",
    "animationSpeed": "fast"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": { /* updated preferences */ }
}
```

#### Reset Preferences to Default
```http
DELETE /api/v1/users/preferences/:type
Authorization: Bearer <token>
```

### Gamification Endpoints

#### Get User Gamification Data
```http
GET /api/v1/gamification/progress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "level": 5,
  "xp": 350,
  "totalXp": 2850,
  "xpToNextLevel": 650,
  "streakDays": 7,
  "lastLogin": "2026-01-11",
  "title": "Privacy Guardian",
  "achievements": [
    {
      "id": "first_message",
      "name": "Breaking the Ice",
      "description": "Send your first message",
      "category": "social",
      "rarity": "common",
      "xpReward": 50,
      "icon": "💬",
      "unlockedAt": "2026-01-01T10:00:00Z",
      "progress": { "current": 1, "required": 1 }
    }
  ],
  "activeQuests": [
    {
      "id": "daily_messages",
      "name": "Daily Communicator",
      "description": "Send 5 messages today",
      "type": "daily",
      "xpReward": 100,
      "progress": { "current": 3, "required": 5 },
      "expiresAt": "2026-01-12T00:00:00Z"
    }
  ],
  "unlockedLore": ["chapter1_fragment1", "chapter1_fragment2"]
}
```

#### Award XP
```http
POST /api/v1/gamification/xp
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50,
  "source": "message_sent",
  "metadata": {
    "messageId": "msg-123",
    "conversationId": "conv-456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "xpAwarded": 50,
  "bonusXp": 25,
  "totalXp": 375,
  "level": 5,
  "leveledUp": false,
  "newAchievements": [],
  "streakBonus": 1.5
}
```

#### Unlock Achievement
```http
POST /api/v1/gamification/achievements
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "achievementId": "first_message",
  "progress": { "current": 1, "required": 1 }
}
```

**Response:**
```json
{
  "success": true,
  "achievement": {
    "id": "first_message",
    "name": "Breaking the Ice",
    "xpReward": 50,
    "unlockedAt": "2026-01-11T09:15:00Z"
  },
  "leveledUp": false,
  "newLevel": 5
}
```

#### Update Quest Progress
```http
POST /api/v1/gamification/quests/:questId/progress
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "progress": { "current": 3, "required": 5 }
}
```

**Response:**
```json
{
  "success": true,
  "quest": {
    "id": "daily_messages",
    "progress": { "current": 3, "required": 5 },
    "completed": false
  }
}
```

### Message Reactions Endpoints

#### Add Reaction
```http
POST /api/v1/messages/:messageId/reactions
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response:**
```json
{
  "success": true,
  "reaction": {
    "id": "reaction-123",
    "messageId": "msg-456",
    "userId": "user-789",
    "emoji": "👍",
    "createdAt": "2026-01-11T09:15:00Z"
  }
}
```

#### Remove Reaction
```http
DELETE /api/v1/messages/:messageId/reactions/:emoji
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Reaction removed"
}
```

#### Get Message Reactions
```http
GET /api/v1/messages/:messageId/reactions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "reactions": [
    {
      "emoji": "👍",
      "count": 5,
      "users": [
        {
          "id": "user-1",
          "username": "alice",
          "avatar": "https://..."
        },
        {
          "id": "user-2",
          "username": "bob",
          "avatar": "https://..."
        }
      ],
      "hasReacted": true
    },
    {
      "emoji": "❤️",
      "count": 3,
      "users": [...],
      "hasReacted": false
    }
  ]
}
```

### Read Receipts Endpoints

#### Mark Message as Read
```http
POST /api/v1/messages/:messageId/read
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "readAt": "2026-01-11T09:15:00Z"
}
```

#### Get Read Receipts
```http
GET /api/v1/messages/:messageId/read-receipts
Authorization: Bearer <token>
```

**Response:**
```json
{
  "readBy": [
    {
      "id": "user-1",
      "username": "alice",
      "avatar": "https://...",
      "readAt": "2026-01-11T09:15:00Z"
    },
    {
      "id": "user-2",
      "username": "bob",
      "avatar": "https://...",
      "readAt": "2026-01-11T09:16:00Z"
    }
  ],
  "totalReaders": 5
}
```

### E2EE Testing Endpoints

#### Get Public Key
```http
GET /api/v1/keys/public/:userId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "userId": "user-123",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "algorithm": "ECDH",
  "curve": "P-256",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

#### Ping Test
```http
POST /api/v1/ping
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "timestamp": 1704960000000
}
```

**Response:**
```json
{
  "pong": true,
  "timestamp": 1704960000000,
  "serverTime": 1704960001234,
  "latency": 50
}
```

#### Test E2EE Message
```http
POST /api/v1/conversations/:conversationId/test-e2ee
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "encryptedPayload": "base64_encrypted_data",
  "iv": "base64_iv",
  "authTag": "base64_auth_tag"
}
```

**Response:**
```json
{
  "success": true,
  "decrypted": "Test message decrypted successfully",
  "latency": 45
}
```

### Forum Comments Endpoints

#### Create Comment
```http
POST /api/v1/comments
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "postId": "post-123",
  "parentId": "comment-456",
  "content": "Great post! I agree with your points."
}
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment-789",
    "postId": "post-123",
    "parentId": "comment-456",
    "authorId": "user-111",
    "author": {
      "id": "user-111",
      "username": "alice",
      "avatar": "https://...",
      "karma": 1250
    },
    "content": "Great post! I agree with your points.",
    "upvotes": 0,
    "downvotes": 0,
    "isBestAnswer": false,
    "edited": false,
    "createdAt": "2026-01-11T09:15:00Z"
  }
}
```

#### Update Comment
```http
PUT /api/v1/comments/:commentId
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment-789",
    "content": "Updated comment content",
    "edited": true,
    "updatedAt": "2026-01-11T09:20:00Z"
  }
}
```

#### Delete Comment
```http
DELETE /api/v1/comments/:commentId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

#### Vote on Comment
```http
POST /api/v1/comments/:commentId/vote
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "voteType": "upvote"
}
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment-789",
    "upvotes": 15,
    "downvotes": 2,
    "userVote": "upvote"
  }
}
```

#### Mark as Best Answer
```http
POST /api/v1/comments/:commentId/best-answer
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment-789",
    "isBestAnswer": true
  }
}
```

#### Get Comments with Nesting
```http
GET /api/v1/posts/:postId/comments?sort=best&depth=5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "comments": [
    {
      "id": "comment-1",
      "postId": "post-123",
      "parentId": null,
      "author": {
        "id": "user-1",
        "username": "alice",
        "avatar": "https://...",
        "karma": 1250,
        "badges": ["verified", "contributor"]
      },
      "content": "This is a top-level comment",
      "upvotes": 25,
      "downvotes": 2,
      "isBestAnswer": false,
      "edited": false,
      "createdAt": "2026-01-11T09:00:00Z",
      "replies": [
        {
          "id": "comment-2",
          "parentId": "comment-1",
          "author": { /* ... */ },
          "content": "Great point!",
          "upvotes": 10,
          "downvotes": 0,
          "replies": [
            {
              "id": "comment-3",
              "parentId": "comment-2",
              "content": "I agree completely",
              "replies": []
            }
          ]
        }
      ]
    }
  ],
  "total": 45,
  "page": 1,
  "perPage": 20
}
```

### Media Metadata Endpoints

#### Fetch URL Metadata
```http
POST /api/v1/media/metadata
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "url": "https://example.com/article",
    "type": "link",
    "title": "Amazing Article Title",
    "description": "This is a description of the article",
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "siteName": "Example Site",
    "author": "John Doe",
    "publishedDate": "2026-01-10",
    "metadata": {
      "ogType": "article",
      "twitterCard": "summary_large_image"
    }
  }
}
```

---

## WebSocket Events

### Client → Server Events

#### Typing Indicator
```javascript
socket.emit('typing', {
  conversationId: 'conv-123',
  isTyping: true
});
```

#### Add Reaction
```javascript
socket.emit('reaction', {
  messageId: 'msg-456',
  emoji: '👍',
  action: 'add' // or 'remove'
});
```

#### Read Receipt
```javascript
socket.emit('read_receipt', {
  messageId: 'msg-456',
  readAt: '2026-01-11T09:15:00Z'
});
```

#### Presence Update
```javascript
socket.emit('presence', {
  status: 'online', // 'online', 'idle', 'dnd', 'offline'
  lastSeen: '2026-01-11T09:15:00Z'
});
```

### Server → Client Events

#### New Message
```javascript
socket.on('new_message', (data) => {
  // data: { conversationId, message: { id, content, sender, ... } }
  console.log('New message received:', data);
});
```

#### Reaction Update
```javascript
socket.on('reaction_update', (data) => {
  // data: { messageId, emoji, action, user, aggregatedReactions }
  console.log('Reaction updated:', data);
});
```

#### Typing Update
```javascript
socket.on('typing_update', (data) => {
  // data: { conversationId, userId, username, isTyping }
  console.log('User typing:', data);
});
```

#### Presence Update
```javascript
socket.on('presence_update', (data) => {
  // data: { userId, status, lastSeen }
  console.log('User presence changed:', data);
});
```

#### Achievement Unlocked
```javascript
socket.on('achievement_unlocked', (data) => {
  // data: { achievementId, name, description, xpReward, icon }
  console.log('Achievement unlocked:', data);
});
```

#### XP Gained
```javascript
socket.on('xp_gained', (data) => {
  // data: { amount, source, totalXp, level, leveledUp }
  console.log('XP gained:', data);
});
```

---

## Authentication & Authorization

### JWT Token Structure

All API requests require a Bearer token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Payload:**
```json
{
  "userId": "user-123",
  "username": "alice",
  "email": "alice@example.com",
  "role": "user",
  "iat": 1704960000,
  "exp": 1705046400
}
```

### Permission Checks

**Preferences:**
- Users can only read/update their own preferences

**Gamification:**
- Users can only view their own gamification data
- XP awards require server-side validation
- Achievement unlocks require progress verification

**Reactions:**
- Users can add/remove their own reactions
- Anyone can view reactions on messages they have access to

**Comments:**
- Users can edit/delete only their own comments
- Post authors can mark best answers
- Moderators can delete any comment

---

## Data Models

### TypeScript Interfaces (Frontend)

```typescript
// UI Preferences
export interface UIPreferences {
  theme: 'dark' | 'darker' | 'midnight' | 'amoled';
  backgroundGradient: 'none' | 'subtle' | 'vibrant' | 'rainbow' | 'aurora';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glassEffect: 'none' | 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'matrix';
  glassBlur: number;
  glassOpacity: number;
  glassBorderWidth: number;
  glassGlowIntensity: number;
  particleDensity: 'none' | 'minimal' | 'medium' | 'heavy' | 'extreme';
  particleColor: 'primary' | 'rainbow' | 'monochrome';
  particleShape: 'circle' | 'square' | 'star' | 'heart';
  animationSpeed: 'instant' | 'fast' | 'normal' | 'slow' | 'very-slow';
  animationIntensity: 'minimal' | 'low' | 'medium' | 'high' | 'ultra';
  enableTransitions: boolean;
  enableHoverEffects: boolean;
  enable3DTransforms: boolean;
  enableParallax: boolean;
  fontSize: 'small' | 'base' | 'large' | 'xlarge';
  fontFamily: 'system' | 'inter' | 'jetbrains';
  fontWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'tight' | 'normal' | 'wide' | 'wider';
  spacingScale: number;
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  contentWidth: 'narrow' | 'default' | 'wide' | 'full';
  reducedMotion: boolean;
  highContrast: boolean;
  focusIndicators: boolean;
  largeClickTargets: boolean;
  enableHardwareAcceleration: boolean;
  enableLazyLoading: boolean;
}

// Avatar Style
export interface AvatarStyle {
  borderStyle: 'none' | 'solid' | 'gradient' | 'rainbow' | 'pulse' | 'spin' | 'glow' | 'neon' | 'fire' | 'electric';
  borderWidth: number;
  borderColor: string;
  glowIntensity: number;
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast';
  shape: 'circle' | 'rounded-square' | 'hexagon' | 'star';
}

// Chat Bubble Style
export interface ChatBubbleStyle {
  ownMessageBg: string;
  ownMessageText: string;
  otherMessageBg: string;
  otherMessageText: string;
  useGradient: boolean;
  gradientDirection: 'to-r' | 'to-l' | 'to-br' | 'to-bl' | 'to-tr' | 'to-tl';
  borderRadius: number;
  bubbleShape: 'rounded' | 'sharp' | 'super-rounded' | 'bubble' | 'modern';
  showTail: boolean;
  glassEffect: boolean;
  glassBlur: number;
  shadowIntensity: number;
  borderStyle: 'none' | 'solid' | 'gradient' | 'glow';
  borderWidth: number;
  borderColor: string;
  entranceAnimation: 'none' | 'slide' | 'fade' | 'scale' | 'bounce' | 'flip';
  hoverEffect: boolean;
  sendAnimation: 'none' | 'bounce' | 'shake' | 'pulse';
  maxWidth: number;
  messageSpacing: number;
  groupSpacing: number;
  alignment: 'default' | 'center' | 'justify';
  showTimestamp: boolean;
  timestampPosition: 'bottom' | 'side' | 'tooltip';
  showAvatar: boolean;
  avatarPosition: 'left' | 'right' | 'top';
  groupMessages: boolean;
  compactMode: boolean;
  showReadReceipts: boolean;
  showReactions: boolean;
}

// Gamification
export interface UserGamification {
  level: number;
  xp: number;
  totalXp: number;
  xpToNextLevel: number;
  streakDays: number;
  lastLogin: string;
  title?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'social' | 'content' | 'exploration' | 'mastery' | 'legendary' | 'secret';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  xpReward: number;
  icon: string;
  requirements: {
    type: string;
    target: number;
  };
  unlockedAt?: string;
  progress?: {
    current: number;
    required: number;
  };
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  xpReward: number;
  requirements: {
    type: string;
    target: number;
  };
  progress: {
    current: number;
    required: number;
  };
  expiresAt: string;
}

// Message Reaction
export interface MessageReaction {
  emoji: string;
  count: number;
  users: {
    id: string;
    username: string;
    avatar: string;
  }[];
  hasReacted: boolean;
}

// Forum Comment
export interface ForumComment {
  id: string;
  postId: string;
  parentId?: string;
  author: {
    id: string;
    username: string;
    avatar: string;
    karma: number;
    badges?: string[];
  };
  content: string;
  upvotes: number;
  downvotes: number;
  isBestAnswer: boolean;
  edited: boolean;
  createdAt: string;
  updatedAt?: string;
  replies?: ForumComment[];
}
```

---

## Implementation Examples

### 1. Syncing UI Preferences

**Frontend (when user changes settings):**

```typescript
import { useUIPreferences } from '@/components/settings/UICustomizationSettings';
import { useAuthStore } from '@/stores/authStore';

const { preferences, updatePreference } = useUIPreferences();
const { token } = useAuthStore();

async function syncPreferencesToBackend(type: string, prefs: any) {
  try {
    const response = await fetch('/api/v1/users/preferences', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preference_type: type,
        preferences: prefs,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync preferences');
    }

    const data = await response.json();
    console.log('Preferences synced:', data);
  } catch (error) {
    console.error('Error syncing preferences:', error);
    // Show error toast to user
  }
}

// Call this when user changes preferences
updatePreference('theme', 'midnight');
await syncPreferencesToBackend('ui', preferences);
```

**Backend (Node.js/Express example):**

```javascript
// PUT /api/v1/users/preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { preference_type, preferences } = req.body;

  // Validate preference_type
  const validTypes = ['ui', 'avatar', 'chat_bubble'];
  if (!validTypes.includes(preference_type)) {
    return res.status(400).json({ error: 'Invalid preference type' });
  }

  try {
    // Upsert preferences
    const result = await db.query(
      `INSERT INTO user_preferences (user_id, preference_type, preferences, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, preference_type)
       DO UPDATE SET preferences = $3, updated_at = NOW()
       RETURNING *`,
      [userId, preference_type, preferences]
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: result.rows[0].preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. Loading Preferences on Login

**Frontend:**

```typescript
import { useUIPreferences } from '@/components/settings/UICustomizationSettings';
import { useAvatarStyle } from '@/components/ui/AnimatedAvatar';
import { useChatBubbleStyle } from '@/stores/chatBubbleStore';

async function loadUserPreferences() {
  try {
    const response = await fetch('/api/v1/users/preferences', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load preferences');
    }

    const data = await response.json();

    // Apply each preference type
    if (data.ui) {
      const { preferences } = useUIPreferences.getState();
      Object.entries(data.ui).forEach(([key, value]) => {
        updatePreference(key as any, value);
      });
    }

    if (data.avatar) {
      const { updateStyle } = useAvatarStyle.getState();
      Object.entries(data.avatar).forEach(([key, value]) => {
        updateStyle(key as any, value);
      });
    }

    if (data.chatBubble) {
      const { updateStyle } = useChatBubbleStyle.getState();
      Object.entries(data.chatBubble).forEach(([key, value]) => {
        updateStyle(key as any, value);
      });
    }

    console.log('Preferences loaded successfully');
  } catch (error) {
    console.error('Error loading preferences:', error);
    // Fall back to local storage defaults
  }
}

// Call this after successful login
await loadUserPreferences();
```

**Backend:**

```javascript
// GET /api/v1/users/preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const result = await db.query(
      `SELECT preference_type, preferences
       FROM user_preferences
       WHERE user_id = $1`,
      [userId]
    );

    // Transform array to object
    const preferences = {};
    result.rows.forEach(row => {
      preferences[row.preference_type] = row.preferences;
    });

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 3. Awarding XP and Achievements

**Frontend (trigger XP award):**

```typescript
async function awardXP(amount: number, source: string, metadata?: any) {
  try {
    const response = await fetch('/api/v1/gamification/xp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, source, metadata }),
    });

    const data = await response.json();

    if (data.leveledUp) {
      // Show level-up modal
      showLevelUpModal(data.level);
    }

    if (data.newAchievements?.length > 0) {
      // Show achievement notifications
      data.newAchievements.forEach(achievement => {
        showAchievementNotification(achievement);
      });
    }

    // Update local gamification store
    const { setUserData } = useGamificationStore.getState();
    setUserData({
      level: data.level,
      xp: data.totalXp % getXPForLevel(data.level),
      totalXp: data.totalXp,
    });

  } catch (error) {
    console.error('Error awarding XP:', error);
  }
}

// Example: Award XP when user sends a message
socket.on('new_message', (message) => {
  if (message.senderId === currentUserId) {
    awardXP(10, 'message_sent', { messageId: message.id });
  }
});
```

**Backend:**

```javascript
// POST /api/v1/gamification/xp
router.post('/xp', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { amount, source, metadata } = req.body;

  try {
    // Get current user gamification data
    const userResult = await db.query(
      'SELECT * FROM user_gamification WHERE user_id = $1',
      [userId]
    );

    let userData = userResult.rows[0];
    if (!userData) {
      // Create initial record
      const initResult = await db.query(
        `INSERT INTO user_gamification (user_id, level, xp, total_xp)
         VALUES ($1, 1, 0, 0)
         RETURNING *`,
        [userId]
      );
      userData = initResult.rows[0];
    }

    // Calculate streak bonus
    let streakBonus = 1.0;
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = userData.last_login?.toISOString().split('T')[0];

    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastLogin === yesterdayStr) {
        // Continue streak
        userData.streak_days += 1;
      } else if (!lastLogin || lastLogin < yesterdayStr) {
        // Reset streak
        userData.streak_days = 1;
      }

      // Update last login
      await db.query(
        'UPDATE user_gamification SET last_login = CURRENT_DATE, streak_days = $1 WHERE user_id = $2',
        [userData.streak_days, userId]
      );
    }

    // Apply streak multiplier
    if (userData.streak_days >= 7) streakBonus = 2.0;
    else if (userData.streak_days >= 3) streakBonus = 1.5;

    const bonusXp = Math.floor(amount * (streakBonus - 1));
    const totalAwarded = amount + bonusXp;

    // Calculate new XP and level
    const newTotalXp = userData.total_xp + totalAwarded;
    const newLevel = calculateLevel(newTotalXp);
    const leveledUp = newLevel > userData.level;

    // Update user gamification
    await db.query(
      `UPDATE user_gamification
       SET xp = $1, total_xp = $2, level = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [newTotalXp % getXPForLevel(newLevel), newTotalXp, newLevel, userId]
    );

    // Check for new achievements
    const newAchievements = await checkAchievements(userId, source, metadata);

    // Emit WebSocket event
    io.to(userId).emit('xp_gained', {
      amount: totalAwarded,
      source,
      totalXp: newTotalXp,
      level: newLevel,
      leveledUp,
    });

    res.json({
      success: true,
      xpAwarded: amount,
      bonusXp,
      totalXp: newTotalXp,
      level: newLevel,
      leveledUp,
      newAchievements,
      streakBonus,
    });

  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateLevel(totalXp) {
  let level = 1;
  while (getXPForLevel(level) <= totalXp) {
    level++;
  }
  return level - 1;
}

function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.8));
}

async function checkAchievements(userId, source, metadata) {
  // Implementation depends on your achievement system
  // Example: Check if user unlocked "first_message" achievement
  if (source === 'message_sent') {
    const messageCount = await getMessageCount(userId);
    if (messageCount === 1) {
      return await unlockAchievement(userId, 'first_message');
    }
  }
  return [];
}
```

### 4. Real-time Reactions with WebSocket

**Frontend:**

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://your-backend.com', {
  auth: { token },
});

// Add reaction
async function addReaction(messageId: string, emoji: string) {
  try {
    // Optimistic update
    const { addReaction } = useMessageStore.getState();
    addReaction(messageId, emoji, currentUser);

    // Emit WebSocket event
    socket.emit('reaction', {
      messageId,
      emoji,
      action: 'add',
    });

    // Also call REST API for persistence
    const response = await fetch(`/api/v1/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emoji }),
    });

    if (!response.ok) {
      // Revert optimistic update
      removeReaction(messageId, emoji, currentUser);
      throw new Error('Failed to add reaction');
    }
  } catch (error) {
    console.error('Error adding reaction:', error);
  }
}

// Listen for reaction updates
socket.on('reaction_update', (data) => {
  const { messageId, emoji, action, user, aggregatedReactions } = data;

  // Update message store with new reactions
  const { updateMessageReactions } = useMessageStore.getState();
  updateMessageReactions(messageId, aggregatedReactions);
});
```

**Backend (WebSocket handler):**

```javascript
io.on('connection', (socket) => {
  const { userId } = socket.handshake.auth;

  socket.on('reaction', async (data) => {
    const { messageId, emoji, action } = data;

    try {
      if (action === 'add') {
        // Add reaction to database
        await db.query(
          `INSERT INTO message_reactions (message_id, user_id, emoji)
           VALUES ($1, $2, $3)
           ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
          [messageId, userId, emoji]
        );
      } else if (action === 'remove') {
        // Remove reaction from database
        await db.query(
          `DELETE FROM message_reactions
           WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
          [messageId, userId, emoji]
        );
      }

      // Get aggregated reactions
      const reactionsResult = await db.query(
        `SELECT emoji, COUNT(*) as count,
                json_agg(json_build_object('id', u.id, 'username', u.username, 'avatar', u.avatar)) as users
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = $1
         GROUP BY emoji`,
        [messageId]
      );

      const aggregatedReactions = reactionsResult.rows.map(row => ({
        emoji: row.emoji,
        count: parseInt(row.count),
        users: row.users,
      }));

      // Get conversation ID to broadcast to all participants
      const msgResult = await db.query(
        'SELECT conversation_id FROM messages WHERE id = $1',
        [messageId]
      );
      const conversationId = msgResult.rows[0].conversation_id;

      // Broadcast to all users in the conversation
      io.to(`conversation:${conversationId}`).emit('reaction_update', {
        messageId,
        emoji,
        action,
        user: { id: userId },
        aggregatedReactions,
      });

    } catch (error) {
      console.error('Error handling reaction:', error);
      socket.emit('error', { message: 'Failed to process reaction' });
    }
  });
});
```

### 5. E2EE Connection Testing

**Frontend (from E2EEConnectionTester component):**

```typescript
async function testKeyExchange() {
  // Generate ephemeral key pair
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  // Export public key
  const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));

  // Fetch recipient's public key from backend
  const response = await fetch(`/api/v1/keys/public/${recipientId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const { publicKey: recipientPublicKeyPem } = await response.json();

  // Import recipient's public key
  const recipientPublicKey = await importPublicKey(recipientPublicKeyPem);

  // Derive shared secret
  const sharedSecret = await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: recipientPublicKey },
    keyPair.privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return sharedSecret;
}
```

**Backend:**

```javascript
// GET /api/v1/keys/public/:userId
router.get('/keys/public/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await db.query(
      'SELECT public_key, algorithm, curve, created_at FROM user_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Public key not found' });
    }

    res.json({
      userId,
      publicKey: result.rows[0].public_key,
      algorithm: result.rows[0].algorithm,
      curve: result.rows[0].curve,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Testing Checklist

### API Endpoints Testing

- [ ] **User Preferences**
  - [ ] GET /api/v1/users/preferences returns all preference types
  - [ ] PUT /api/v1/users/preferences updates UI preferences
  - [ ] PUT /api/v1/users/preferences updates avatar preferences
  - [ ] PUT /api/v1/users/preferences updates chat bubble preferences
  - [ ] DELETE /api/v1/users/preferences/:type resets to defaults
  - [ ] Preferences persist across sessions
  - [ ] Invalid preference types return 400 error

- [ ] **Gamification**
  - [ ] GET /api/v1/gamification/progress returns user XP, level, achievements
  - [ ] POST /api/v1/gamification/xp awards XP correctly
  - [ ] XP calculations include streak bonuses
  - [ ] Level-up triggers when XP threshold is reached
  - [ ] POST /api/v1/gamification/achievements unlocks achievements
  - [ ] Duplicate achievement unlocks are prevented
  - [ ] Quest progress updates correctly

- [ ] **Message Reactions**
  - [ ] POST /api/v1/messages/:id/reactions adds reaction
  - [ ] DELETE /api/v1/messages/:id/reactions/:emoji removes reaction
  - [ ] GET /api/v1/messages/:id/reactions returns aggregated reactions
  - [ ] Duplicate reactions by same user are prevented
  - [ ] Reactions are deleted when message is deleted (CASCADE)

- [ ] **Read Receipts**
  - [ ] POST /api/v1/messages/:id/read marks message as read
  - [ ] GET /api/v1/messages/:id/read-receipts returns all readers
  - [ ] Duplicate read receipts are prevented
  - [ ] Read receipts respect conversation permissions

- [ ] **E2EE Testing**
  - [ ] GET /api/v1/keys/public/:userId returns public key
  - [ ] POST /api/v1/ping responds with pong and latency
  - [ ] POST /api/v1/conversations/:id/test-e2ee decrypts test message

- [ ] **Forum Comments**
  - [ ] POST /api/v1/comments creates comment with nesting
  - [ ] PUT /api/v1/comments/:id updates comment and sets edited flag
  - [ ] DELETE /api/v1/comments/:id soft deletes comment
  - [ ] POST /api/v1/comments/:id/vote adds/updates vote
  - [ ] POST /api/v1/comments/:id/best-answer marks as best answer
  - [ ] GET /api/v1/posts/:id/comments returns nested structure

### WebSocket Events Testing

- [ ] **Connection**
  - [ ] Socket connects successfully with valid JWT token
  - [ ] Socket rejects connection with invalid token
  - [ ] Socket reconnects after disconnect

- [ ] **Real-time Events**
  - [ ] 'typing' event broadcasts to conversation participants
  - [ ] 'reaction' event updates all connected clients
  - [ ] 'read_receipt' event notifies sender
  - [ ] 'presence' event updates user status
  - [ ] 'achievement_unlocked' event triggers notification
  - [ ] 'xp_gained' event updates gamification UI

### Integration Testing

- [ ] **User Flow: Customize UI**
  - [ ] User logs in
  - [ ] Backend loads saved preferences
  - [ ] Frontend applies preferences to DOM
  - [ ] User changes theme
  - [ ] Changes sync to backend
  - [ ] Preferences persist after logout/login

- [ ] **User Flow: Send Message with Reaction**
  - [ ] User sends message
  - [ ] XP is awarded for message
  - [ ] Other user adds reaction
  - [ ] Reaction appears in real-time
  - [ ] Reaction count updates correctly

- [ ] **User Flow: Unlock Achievement**
  - [ ] User performs action (e.g., sends 10 messages)
  - [ ] Backend checks achievement requirements
  - [ ] Achievement is unlocked
  - [ ] WebSocket event triggers notification
  - [ ] XP is awarded for achievement
  - [ ] Achievement appears in user profile

### Performance Testing

- [ ] API responds within 200ms for preference updates
- [ ] Gamification calculations complete within 100ms
- [ ] WebSocket events have <50ms latency
- [ ] Nested comments with 100+ replies load in <500ms
- [ ] Media metadata caching reduces redundant fetches

### Security Testing

- [ ] JWT tokens expire correctly
- [ ] Users cannot access other users' preferences
- [ ] Users cannot award themselves XP directly
- [ ] Users cannot unlock achievements without meeting requirements
- [ ] SQL injection is prevented in all queries
- [ ] XSS is prevented in comment content
- [ ] CSRF protection is enabled for state-changing operations

---

## Migration Guide

### For Existing Users

When deploying v0.8.0, existing users will have preferences stored in localStorage. Here's how to migrate them to the backend:

**1. Migration Endpoint**

Create a migration endpoint that accepts bulk preferences:

```javascript
// POST /api/v1/users/preferences/migrate
router.post('/preferences/migrate', authenticateToken, async (req, res) => {
  const { userId } = req.user;
  const { ui, avatar, chatBubble } = req.body;

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    if (ui) {
      await client.query(
        `INSERT INTO user_preferences (user_id, preference_type, preferences)
         VALUES ($1, 'ui', $2)
         ON CONFLICT (user_id, preference_type) DO UPDATE SET preferences = $2`,
        [userId, ui]
      );
    }

    if (avatar) {
      await client.query(
        `INSERT INTO user_preferences (user_id, preference_type, preferences)
         VALUES ($1, 'avatar', $2)
         ON CONFLICT (user_id, preference_type) DO UPDATE SET preferences = $2`,
        [userId, avatar]
      );
    }

    if (chatBubble) {
      await client.query(
        `INSERT INTO user_preferences (user_id, preference_type, preferences)
         VALUES ($1, 'chat_bubble', $2)
         ON CONFLICT (user_id, preference_type) DO UPDATE SET preferences = $2`,
        [userId, chatBubble]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Preferences migrated successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  } finally {
    client.release();
  }
});
```

**2. Frontend Migration Logic**

Add this to your login flow:

```typescript
async function migrateLocalPreferencesToBackend() {
  try {
    // Check if migration has already been done
    const migrated = localStorage.getItem('preferences_migrated');
    if (migrated === 'true') return;

    // Get all local preferences
    const uiPrefs = localStorage.getItem('cgraph-ui-preferences');
    const avatarPrefs = localStorage.getItem('cgraph-avatar-style');
    const chatBubblePrefs = localStorage.getItem('cgraph-chat-bubble-style');

    if (!uiPrefs && !avatarPrefs && !chatBubblePrefs) {
      // No local preferences to migrate
      localStorage.setItem('preferences_migrated', 'true');
      return;
    }

    // Parse preferences
    const data: any = {};
    if (uiPrefs) data.ui = JSON.parse(uiPrefs).state?.preferences;
    if (avatarPrefs) data.avatar = JSON.parse(avatarPrefs).state?.style;
    if (chatBubblePrefs) data.chatBubble = JSON.parse(chatBubblePrefs).state?.style;

    // Send to backend
    const response = await fetch('/api/v1/users/preferences/migrate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      localStorage.setItem('preferences_migrated', 'true');
      console.log('Preferences migrated to backend successfully');
    }

  } catch (error) {
    console.error('Error migrating preferences:', error);
    // Don't block user, they can migrate later
  }
}

// Call after login
await migrateLocalPreferencesToBackend();
```

### Database Migration SQL

```sql
-- Run this migration to add all required tables

BEGIN;

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL,
  preferences JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, preference_type)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON user_preferences(preference_type);

-- Gamification
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_login DATE,
  title VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  rarity VARCHAR(20) NOT NULL,
  xp_reward INTEGER NOT NULL,
  icon VARCHAR(50),
  requirements JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW(),
  progress JSONB,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS quests (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  xp_reward INTEGER NOT NULL,
  requirements JSONB NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id VARCHAR(50) NOT NULL REFERENCES quests(id),
  progress JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  started_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

CREATE TABLE IF NOT EXISTS user_lore (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- Read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_read_receipts_message_id ON message_read_receipts(message_id);

-- Forum comments
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_best_answer BOOLEAN DEFAULT FALSE,
  edited BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_comment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id ON forum_comments(parent_id);

-- Media metadata
CREATE TABLE IF NOT EXISTS media_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_metadata_url ON media_metadata(url);

COMMIT;
```

---

## Performance Considerations

### 1. Caching Strategy

**Preferences:**
- Cache user preferences in Redis with 1-hour TTL
- Invalidate cache on preference update
- Fallback to database if cache miss

```javascript
async function getUserPreferences(userId) {
  const cacheKey = `preferences:${userId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fallback to database
  const result = await db.query(
    'SELECT preference_type, preferences FROM user_preferences WHERE user_id = $1',
    [userId]
  );

  const preferences = {};
  result.rows.forEach(row => {
    preferences[row.preference_type] = row.preferences;
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(preferences));

  return preferences;
}
```

**Media Metadata:**
- Cache Open Graph metadata for 24 hours
- Use ETags for conditional requests
- Implement background refresh for popular URLs

### 2. Database Optimization

**Indexes:**
- All foreign keys should have indexes
- Composite indexes for common queries
- JSONB GIN indexes for preference searches

```sql
-- Add GIN index for JSONB searches
CREATE INDEX idx_user_preferences_jsonb ON user_preferences USING GIN (preferences);

-- Composite index for reactions query
CREATE INDEX idx_reactions_message_user ON message_reactions(message_id, user_id);
```

**Connection Pooling:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum 20 connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 3. WebSocket Optimization

**Room-based Broadcasting:**
```javascript
// Join conversation room on connection
socket.join(`conversation:${conversationId}`);

// Broadcast only to conversation participants
io.to(`conversation:${conversationId}`).emit('reaction_update', data);
```

**Event Throttling:**
```javascript
// Throttle typing indicators to max 1 per second
const typingThrottle = {};

socket.on('typing', (data) => {
  const key = `${data.conversationId}:${userId}`;
  const now = Date.now();

  if (!typingThrottle[key] || now - typingThrottle[key] > 1000) {
    typingThrottle[key] = now;
    io.to(`conversation:${data.conversationId}`).emit('typing_update', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });
  }
});
```

### 4. Frontend Optimization

**Debounce Preference Updates:**
```typescript
import { debounce } from 'lodash';

const syncToBackend = debounce(async (type, preferences) => {
  await fetch('/api/v1/users/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ preference_type: type, preferences }),
  });
}, 500); // Wait 500ms after last change

// Usage
updatePreference('glassBlur', 24);
syncToBackend('ui', preferences);
```

**Virtualized Lists for Comments:**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function CommentsList({ comments }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: comments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <Comment comment={comments[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Summary

This guide provides everything needed to integrate CGraph Web v0.8.0 features with your backend:

✅ **Database schema** for all new features
✅ **API endpoints** with request/response examples
✅ **WebSocket events** for real-time functionality
✅ **Authentication & authorization** patterns
✅ **TypeScript data models** matching frontend
✅ **Complete implementation examples** in Node.js/Express
✅ **Testing checklist** for quality assurance
✅ **Migration guide** for existing users
✅ **Performance optimizations** for production

**Next Steps:**
1. Run the database migration SQL
2. Implement the API endpoints
3. Set up WebSocket event handlers
4. Test with the provided checklist
5. Deploy and migrate existing users

For questions or issues, refer to:
- [WHATS_NEW.md](./WHATS_NEW.md) - User-facing feature guide
- [FEATURES_DOCUMENTATION.md](./FEATURES_DOCUMENTATION.md) - Technical implementation details
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Developer summary

**Happy integrating! 🚀**

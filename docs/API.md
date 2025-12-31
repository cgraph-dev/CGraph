# CGraph API Reference

> Your gateway to real-time communication, groups, forums, and more.

This document provides a complete reference for the CGraph REST API and WebSocket events. Whether you're building an integration, mobile app, or just exploring—you'll find everything you need here.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [REST API Reference](#rest-api-reference)
6. [WebSocket API](#websocket-api)
7. [OpenAPI Specification](#openapi-specification)
8. [SDKs and Examples](#sdks-and-examples)

---

## Overview

### Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://api.cgraph.org/api/v1` |
| Staging | `https://staging-api.cgraph.org/api/v1` |
| Local | `http://localhost:4000/api/v1` |

### Request Format

All requests should include:

```http
Content-Type: application/json
Accept: application/json
```

For authenticated endpoints, include:

```http
Authorization: Bearer <your-jwt-token>
```

### Response Format

All responses follow this structure:

**Success:**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 156
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Username is already taken",
    "details": {
      "username": ["has already been taken"]
    }
  }
}
```

---

## Authentication

CGraph supports two authentication methods:

### 1. Email/Password Authentication

**Register:**
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "username": "alice",
  "password": "securePassword123!"
}
```

**Response:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "usr_abc123",
      "email": "alice@example.com",
      "username": "alice"
    }
  }
}
```

**Login:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "securePassword123!"
}
```

**Refresh Token:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2. Wallet-Based Anonymous Authentication

For privacy-focused users. No email required.

**Generate Wallet:**
```http
POST /api/v1/auth/wallet/generate
Content-Type: application/json

{}
```

**Response:**
```json
{
  "data": {
    "wallet_address": "0xabc123def456...",
    "mnemonic": "witch collapse practice feed shame open despair creek road again ice least",
    "recovery_code": "CGRAPH-ABCD-EFGH-IJKL-MNOP",
    "recovery_file": "base64-encoded-file-content"
  }
}
```

> ⚠️ **Important:** The mnemonic and recovery code are shown only once. Store them securely!

**Register with Wallet:**
```http
POST /api/v1/auth/wallet/register
Content-Type: application/json

{
  "wallet_address": "0xabc123def456...",
  "signature": "signed-challenge-string",
  "username": "anonymous_user",
  "pin_hash": "sha256-of-user-pin"
}
```

**Login with Wallet:**
```http
POST /api/v1/auth/wallet/login
Content-Type: application/json

{
  "wallet_address": "0xabc123def456...",
  "signature": "signed-challenge-string"
}
```

### Token Lifecycle

| Token Type | Expiry | Use |
|------------|--------|-----|
| Access Token | 15 minutes | API requests |
| Refresh Token | 7 days | Get new access token |

---

## Rate Limiting

Requests are rate limited per IP/user:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public (auth) | 20 requests | 1 minute |
| Authenticated | 100 requests | 1 minute |
| Upload | 10 requests | 1 minute |
| Search | 30 requests | 1 minute |

**Rate limit headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699876543
```

**When rate limited:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests, please try again in 45 seconds"
  }
}
```

---

## Error Handling

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `bad_request` | Malformed request |
| 400 | `validation_error` | Invalid input data |
| 401 | `unauthorized` | Missing or invalid token |
| 403 | `forbidden` | Insufficient permissions |
| 404 | `not_found` | Resource doesn't exist |
| 409 | `conflict` | Resource already exists |
| 422 | `unprocessable` | Semantic error |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error |

### Validation Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {
      "email": ["can't be blank", "is not a valid email"],
      "password": ["should be at least 8 characters"]
    }
  }
}
```

---

## REST API Reference

### Health Check

#### `GET /health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /ready`

Check if the API is ready to serve traffic (database connected, etc.).

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok"
  }
}
```

---

### Users

#### `GET /me`

Get the current authenticated user.

**Response:**
```json
{
  "data": {
    "id": "usr_abc123",
    "user_id": 42,
    "user_id_display": "#0042",
    "email": "alice@example.com",
    "username": "alice",
    "display_name": "Alice Johnson",
    "avatar_url": "https://cdn.cgraph.org/avatars/abc123.jpg",
    "bio": "Love building things!",
    "status": "online",
    "can_change_username": true,
    "next_username_change_at": null,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

Note: `username` can be `null` if user registered without one. `can_change_username` is `false` if changed within last 14 days.

#### `PUT /me`

Update the current user's profile.

**Request:**
```json
{
  "display_name": "Alice J.",
  "bio": "Building cool stuff at CGraph"
}
```

#### `PUT /me/username`

Change the current user's username. Subject to 14-day cooldown.

**Request:**
```json
{
  "username": "new_username"
}
```

**Response (success):**
```json
{
  "data": {
    "username": "new_username",
    "can_change_username": false,
    "next_username_change_at": "2024-01-29T10:30:00Z"
  }
}
```

**Response (cooldown active):**
```json
{
  "error": "Username can only be changed once every 14 days",
  "next_change_at": "2024-01-29T10:30:00Z"
}
```

#### `DELETE /me`

Delete the current user's account. Initiates 30-day grace period.

#### `POST /me/avatar`

Upload a new avatar.

**Request:**
```http
Content-Type: multipart/form-data

file: (binary)
```

#### `GET /me/sessions`

List all active sessions for the current user.

**Response:**
```json
{
  "data": [
    {
      "id": "sess_123",
      "ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "location": "New York, US",
      "current": true,
      "last_active_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `DELETE /me/sessions/:id`

Revoke a specific session (log out that device).

---

### User Settings

#### `GET /settings`

Get all user settings.

**Response:**
```json
{
  "data": {
    "notifications": {
      "push_enabled": true,
      "email_enabled": true,
      "message_notifications": true,
      "mention_notifications": true,
      "friend_request_notifications": true,
      "quiet_hours_enabled": false,
      "quiet_hours_start": null,
      "quiet_hours_end": null
    },
    "privacy": {
      "profile_visibility": "friends",
      "online_status_visible": true,
      "read_receipts_enabled": true,
      "typing_indicators_enabled": true,
      "allow_friend_requests": true,
      "allow_group_invites": "friends"
    },
    "appearance": {
      "theme": "system",
      "compact_mode": false,
      "font_size": "medium"
    },
    "locale": {
      "language": "en",
      "timezone": "America/New_York",
      "date_format": "MMM d, yyyy",
      "time_format": "12h"
    }
  }
}
```

#### `PUT /settings`

Update all settings at once.

#### `PUT /settings/notifications`

Update notification settings only.

**Request:**
```json
{
  "push_enabled": true,
  "quiet_hours_enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "07:00"
}
```

#### `PUT /settings/privacy`

Update privacy settings only.

#### `PUT /settings/appearance`

Update appearance settings only.

#### `PUT /settings/locale`

Update locale settings only.

#### `POST /settings/reset`

Reset all settings to defaults.

---

### Conversations (Direct Messages)

#### `GET /conversations`

List all conversations for the current user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `per_page` | int | Items per page (default: 20, max: 100) |

**Response:**
```json
{
  "data": [
    {
      "id": "conv_abc123",
      "participant": {
        "id": "usr_xyz789",
        "username": "bob",
        "avatar_url": "..."
      },
      "last_message": {
        "id": "msg_123",
        "content": "Hey, how's it going?",
        "created_at": "2024-01-15T10:30:00Z"
      },
      "unread_count": 3,
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 45
  }
}
```

#### `POST /conversations`

Start a new conversation.

**Request:**
```json
{
  "recipient_id": "usr_xyz789",
  "message": "Hey! Want to grab coffee?"
}
```

#### `GET /conversations/:id`

Get a specific conversation.

#### `GET /conversations/:id/messages`

Get messages in a conversation.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `per_page` | int | Messages per page |
| `before` | string | Get messages before this message ID |
| `after` | string | Get messages after this message ID |

#### `POST /conversations/:id/messages`

Send a message.

**Request:**
```json
{
  "content": "Hello!",
  "attachments": ["file_abc123"]
}
```

**Response:**
```json
{
  "data": {
    "id": "msg_xyz789",
    "content": "Hello!",
    "sender": {
      "id": "usr_abc123",
      "username": "alice"
    },
    "attachments": [],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### `POST /conversations/:id/messages/:id/read`

Mark a message as read.

#### `POST /conversations/:id/typing`

Send typing indicator. Call repeatedly while user is typing.

---

### Friends

#### `GET /friends`

List all friends.

**Response:**
```json
{
  "data": [
    {
      "id": "friendship_id",
      "user": {
        "id": "usr_xyz789",
        "username": "bob",
        "display_name": "Bob Smith",
        "avatar_url": "...",
        "status": "online",
        "user_id": 42,
        "user_id_display": "#0042"
      },
      "nickname": null,
      "since": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 50,
    "total": 10
  }
}
```

#### `GET /friends/pending`

List pending friend requests (received).

**Response:**
```json
{
  "data": [
    {
      "id": "request_id",
      "user": {
        "id": "usr_abc123",
        "username": "alice",
        "display_name": "Alice",
        "avatar_url": "..."
      },
      "created_at": "2024-01-15T10:30:00Z",
      "type": "incoming"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 1 }
}
```

#### `GET /friends/sent`

List sent friend requests (outgoing).

#### `POST /friends`

Send a friend request. Accepts either `user_id` or `username`.

**Request (by username):**
```json
{
  "username": "alice"
}
```

**Request (by user_id):**
```json
{
  "user_id": "usr_xyz789"
}
```

**Response:**
```json
{
  "data": {
    "id": "request_id",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### `POST /friends/:id/accept`

Accept a friend request.

#### `POST /friends/:id/decline`

Decline a friend request.

#### `DELETE /friends/:id`

Remove a friend or cancel sent request.

#### `POST /friends/:id/block`

Block a user.

#### `DELETE /friends/:id/block`

Unblock a user.

#### `GET /friends/:id/mutual`

Get mutual friends with a user.

#### `GET /friends/suggestions`

Get friend suggestions based on mutual friends, groups, etc.

---

### Groups

#### `GET /groups`

List all groups the user is a member of.

#### `POST /groups`

Create a new group.

**Request:**
```json
{
  "name": "Cool Developers",
  "description": "A place to discuss cool dev stuff",
  "icon_url": "https://...",
  "visibility": "public"
}
```

#### `GET /groups/:id`

Get group details.

**Response:**
```json
{
  "data": {
    "id": "grp_abc123",
    "name": "Cool Developers",
    "description": "A place to discuss cool dev stuff",
    "icon_url": "...",
    "member_count": 156,
    "owner": {
      "id": "usr_abc123",
      "username": "alice"
    },
    "channels": [
      {
        "id": "ch_general",
        "name": "general",
        "type": "text"
      },
      {
        "id": "ch_voice",
        "name": "voice-chat",
        "type": "voice"
      }
    ],
    "my_roles": ["admin", "moderator"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### `PUT /groups/:id`

Update group settings (requires admin).

#### `DELETE /groups/:id`

Delete group (requires owner).

### Group Channels

#### `GET /groups/:id/channels`

List channels in a group.

#### `POST /groups/:id/channels`

Create a new channel.

**Request:**
```json
{
  "name": "announcements",
  "type": "text",
  "topic": "Important announcements only",
  "position": 0
}
```

#### `GET /groups/:id/channels/:channel_id/messages`

Get messages in a channel.

#### `POST /groups/:id/channels/:channel_id/messages`

Send a message to a channel.

### Group Members

#### `GET /groups/:id/members`

List group members.

#### `POST /groups/:id/members`

Add a member (admin only).

#### `POST /groups/:id/members/:user_id/kick`

Kick a member.

#### `POST /groups/:id/members/:user_id/ban`

Ban a member.

#### `POST /groups/:id/members/:user_id/mute`

Mute a member.

### Group Roles

#### `GET /groups/:id/roles`

List roles in a group.

#### `POST /groups/:id/roles`

Create a new role.

**Request:**
```json
{
  "name": "Moderator",
  "color": "#3498db",
  "permissions": ["kick_members", "delete_messages", "pin_messages"]
}
```

### Group Invites

#### `GET /groups/:id/invites`

List active invites.

#### `POST /groups/:id/invites`

Create an invite link.

**Request:**
```json
{
  "max_uses": 10,
  "expires_at": "2024-02-01T00:00:00Z"
}
```

**Response:**
```json
{
  "data": {
    "code": "abc123",
    "url": "https://cgraph.org/join/abc123",
    "uses": 0,
    "max_uses": 10,
    "expires_at": "2024-02-01T00:00:00Z"
  }
}
```

#### `POST /invites/:code/join`

Join a group via invite code.

---

### Forums

#### `GET /forums`

List all forums.

#### `POST /forums`

Create a new forum.

**Request:**
```json
{
  "name": "Tech Discussion",
  "description": "Discuss all things tech",
  "visibility": "public"
}
```

#### `GET /forums/:id`

Get forum details.

### Forum Posts

#### `GET /forums/:id/posts`

List posts in a forum.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sort` | string | `hot`, `new`, `top` |
| `time` | string | `day`, `week`, `month`, `year`, `all` (for `top`) |
| `page` | int | Page number |

#### `POST /forums/:id/posts`

Create a new post.

**Request:**
```json
{
  "title": "Check out this cool project",
  "content": "I've been working on...",
  "link_url": "https://github.com/...",
  "category_id": "cat_abc123"
}
```

#### `POST /forums/:id/posts/:post_id/vote`

Vote on a post.

**Request:**
```json
{
  "direction": 1
}
```

`direction`: `1` for upvote, `-1` for downvote, `0` to remove vote.

#### `POST /forums/:id/posts/:post_id/save`

Save a post for later.

### Post Comments

#### `GET /forums/:id/posts/:post_id/comments`

Get comments on a post.

#### `POST /forums/:id/posts/:post_id/comments`

Add a comment.

**Request:**
```json
{
  "content": "Great post!",
  "parent_id": null
}
```

---

### Notifications

#### `GET /notifications`

Get notifications for the current user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `unread_only` | bool | Only return unread notifications |
| `page` | int | Page number |

**Response:**
```json
{
  "data": [
    {
      "id": "notif_abc123",
      "type": "friend_request",
      "title": "New friend request",
      "body": "Bob wants to be your friend",
      "data": {
        "user_id": "usr_xyz789"
      },
      "read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### `POST /notifications/:id/read`

Mark a notification as read.

#### `POST /notifications/read`

Mark all notifications as read.

---

### File Uploads

#### `POST /upload`

Upload a file.

**Request:**
```http
Content-Type: multipart/form-data

file: (binary)
type: attachment
```

`type`: `avatar`, `attachment`, `group_icon`, `forum_banner`

**Response:**
```json
{
  "data": {
    "id": "file_abc123",
    "url": "https://cdn.cgraph.org/files/abc123.jpg",
    "filename": "photo.jpg",
    "size": 102400,
    "mime_type": "image/jpeg"
  }
}
```

#### `GET /files/:id`

Get file metadata.

---

### Search

#### `GET /search/users`

Search for users.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `limit` | int | Max results (default: 20) |

#### `GET /search/messages`

Search messages in conversations.

#### `GET /search/posts`

Search forum posts.

---

## WebSocket API

CGraph uses Phoenix Channels for real-time communication.

### Connection

```javascript
import { Socket } from 'phoenix';

const socket = new Socket('wss://api.cgraph.org/socket', {
  params: { token: 'your-jwt-token' }
});

socket.connect();
```

### Channels

| Channel | Description |
|---------|-------------|
| `user:{user_id}` | Personal notifications, presence |
| `conversation:{conv_id}` | Direct message conversation |
| `channel:{channel_id}` | Group channel |
| `forum:{forum_id}` | Forum real-time updates |

### Joining a Channel

```javascript
const conversationChannel = socket.channel('conversation:conv_abc123', {});

conversationChannel.join()
  .receive('ok', resp => console.log('Joined!', resp))
  .receive('error', resp => console.log('Unable to join', resp));
```

### Events

#### Incoming Events (Server → Client)

**`new_message`**
```javascript
channel.on('new_message', payload => {
  console.log('New message:', payload.message);
});

// Payload:
{
  "message": {
    "id": "msg_xyz789",
    "content": "Hello!",
    "sender": { "id": "usr_abc123", "username": "alice" },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**`message_updated`**
```javascript
channel.on('message_updated', payload => {
  console.log('Message edited:', payload.message);
});
```

**`message_deleted`**
```javascript
channel.on('message_deleted', payload => {
  console.log('Message deleted:', payload.message_id);
});
```

**`typing`**
```javascript
channel.on('typing', payload => {
  console.log(`${payload.user.username} is typing...`);
});
```

**`presence_state`**
```javascript
channel.on('presence_state', state => {
  // Initial presence state when joining
  console.log('Online users:', Object.keys(state));
});
```

**`presence_diff`**
```javascript
channel.on('presence_diff', diff => {
  console.log('Users joined:', diff.joins);
  console.log('Users left:', diff.leaves);
});
```

#### Outgoing Events (Client → Server)

**`new_message`**
```javascript
channel.push('new_message', {
  content: 'Hello!',
  attachments: []
})
.receive('ok', resp => console.log('Sent!', resp))
.receive('error', resp => console.log('Failed', resp));
```

**`typing`**
```javascript
channel.push('typing', {});
// Call this every few seconds while user is typing
```

**`read`**
```javascript
channel.push('read', { message_id: 'msg_xyz789' });
```

### Presence

Track who's online in a channel:

```javascript
import { Presence } from 'phoenix';

const presence = new Presence(channel);

presence.onSync(() => {
  const online = presence.list();
  console.log('Online:', online);
});

presence.onJoin((id, current, newPres) => {
  console.log('User joined:', id);
});

presence.onLeave((id, current, leftPres) => {
  console.log('User left:', id);
});
```

---

## OpenAPI Specification

Full OpenAPI 3.0 spec available at:
- **Interactive Docs:** https://api.cgraph.org/docs
- **OpenAPI JSON:** https://api.cgraph.org/openapi.json

### Sample OpenAPI Snippet

```yaml
openapi: 3.0.3
info:
  title: CGraph API
  version: 1.0.0
  description: |
    CGraph is a real-time communication platform combining:
    - Direct messaging (Telegram-style)
    - Group channels (Discord-style)
    - Forums (Reddit-style)
  contact:
    email: api@cgraph.org
  license:
    name: MIT

servers:
  - url: https://api.cgraph.org/api/v1
    description: Production
  - url: https://staging-api.cgraph.org/api/v1
    description: Staging
  - url: http://localhost:4000/api/v1
    description: Local development

security:
  - bearerAuth: []

paths:
  /auth/login:
    post:
      summary: Login with email/password
      tags: [Authentication]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: alice@example.com
                password:
                  type: string
                  format: password
                  minLength: 8
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /me:
    get:
      summary: Get current user
      tags: [Users]
      responses:
        '200':
          description: Current user details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /conversations:
    get:
      summary: List conversations
      tags: [Messaging]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PerPageParam'
      responses:
        '200':
          description: List of conversations
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Conversation'
                  meta:
                    $ref: '#/components/schemas/Pagination'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          example: usr_abc123
        email:
          type: string
          format: email
        username:
          type: string
        display_name:
          type: string
        avatar_url:
          type: string
          format: uri
        bio:
          type: string
        status:
          type: string
          enum: [online, away, dnd, offline]
        created_at:
          type: string
          format: date-time

    AuthResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            token:
              type: string
            refresh_token:
              type: string
            user:
              $ref: '#/components/schemas/User'

    Conversation:
      type: object
      properties:
        id:
          type: string
        participant:
          $ref: '#/components/schemas/User'
        last_message:
          $ref: '#/components/schemas/Message'
        unread_count:
          type: integer
        updated_at:
          type: string
          format: date-time

    Message:
      type: object
      properties:
        id:
          type: string
        content:
          type: string
        sender:
          $ref: '#/components/schemas/User'
        attachments:
          type: array
          items:
            $ref: '#/components/schemas/Attachment'
        created_at:
          type: string
          format: date-time

    Attachment:
      type: object
      properties:
        id:
          type: string
        url:
          type: string
          format: uri
        filename:
          type: string
        size:
          type: integer
        mime_type:
          type: string

    Pagination:
      type: object
      properties:
        page:
          type: integer
        per_page:
          type: integer
        total:
          type: integer

  parameters:
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        default: 1
        minimum: 1

    PerPageParam:
      name: per_page
      in: query
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: object
                properties:
                  code:
                    type: string
                    example: unauthorized
                  message:
                    type: string
                    example: Invalid or expired token
```

---

## SDKs and Examples

### JavaScript/TypeScript

```typescript
import { CGraphClient } from '@cgraph/sdk';

const client = new CGraphClient({
  baseUrl: 'https://api.cgraph.org/api/v1',
  token: 'your-jwt-token'
});

// Get current user
const me = await client.users.me();

// Send a message
const message = await client.conversations.sendMessage('conv_abc123', {
  content: 'Hello!'
});

// Real-time messaging
client.connect();
client.joinConversation('conv_abc123');
client.on('new_message', (message) => {
  console.log('New message:', message);
});
```

### Python

```python
from cgraph import CGraphClient

client = CGraphClient(
    base_url="https://api.cgraph.org/api/v1",
    token="your-jwt-token"
)

# Get current user
me = client.users.me()

# List conversations
conversations = client.conversations.list(page=1, per_page=20)

# Send a message
message = client.conversations.send_message(
    conversation_id="conv_abc123",
    content="Hello from Python!"
)
```

### cURL Examples

```bash
# Login
curl -X POST https://api.cgraph.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'

# Get current user
curl https://api.cgraph.org/api/v1/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send a message
curl -X POST https://api.cgraph.org/api/v1/conversations/conv_abc123/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!"}'
```

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication (email/password + wallet)
- Direct messaging
- Groups and channels
- Forums and posts
- Friend system
- Notifications

---

*Questions? Email api@cgraph.org or open an issue on GitHub.*

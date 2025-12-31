# CGraph API Reference

Complete API documentation for CGraph backend services. All endpoints return JSON unless otherwise specified.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Users](#users)
4. [Settings](#settings)
5. [Friends](#friends)
6. [Messaging](#messaging)
7. [Groups](#groups)
8. [Forums](#forums)
9. [Notifications](#notifications)
10. [Uploads](#uploads)
11. [Search](#search)
12. [WebSocket Events](#websocket-events)
13. [Error Codes](#error-codes)

---

## Overview

### Base URL

```
Production: https://api.cgraph.org/api/v1
Development: http://localhost:4000/api/v1
```

### Request Headers

All authenticated requests require:

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response Format

Successful responses:
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

Error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| API (standard) | 100 requests | 1 minute |
| Search | 30 requests | 1 minute |
| File uploads | 10 requests | 1 minute |

Rate limit headers are included in every response:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## Authentication

### Register

Creates a new user account with email and password. Username is optional and can be set later.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "user": {
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepassword123",
    "display_name": "John Doe"
  }
}
```

Note: `username` is optional. If omitted, user will be identified by their `user_id` (e.g., `#0042`).

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 42,
      "user_id_display": "#0042",
      "email": "user@example.com",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": null,
      "can_change_username": true,
      "next_username_change_at": null,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login

Authenticates a user and returns tokens.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Refresh Token

Exchanges a refresh token for new access tokens.

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Logout

Invalidates the current session.

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### Wallet Authentication (Anonymous)

For users who want to use CGraph without an email address.

#### Request Challenge

```http
POST /wallet/challenge
```

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "challenge": "Sign this message to login to CGraph: nonce=abc123...",
    "expires_at": "2024-01-15T10:35:00Z"
  }
}
```

#### Verify Signature

```http
POST /wallet/verify
```

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f...",
  "signature": "0x4a3e...",
  "pin": "1234"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "recovery_codes": ["XXXX-XXXX", "YYYY-YYYY", ...]
  }
}
```

---

## Users

### Get Current User

```http
GET /me
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar_url": "https://cdn.cgraph.org/avatars/...",
    "bio": "Hello world!",
    "status": "online",
    "is_anonymous": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update Current User

```http
PUT /me
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user": {
    "display_name": "John D.",
    "bio": "Updated bio",
    "status": "away"
  }
}
```

**Response:** `200 OK`

### Upload Avatar

```http
POST /me/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `avatar`: Image file (JPEG, PNG, WebP, max 5MB)

**Response:** `200 OK`
```json
{
  "data": {
    "avatar_url": "https://cdn.cgraph.org/avatars/..."
  }
}
```

### Get User Profile

```http
GET /users/:username/profile
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "...",
    "username": "johndoe",
    "display_name": "John Doe",
    "avatar_url": "...",
    "bio": "...",
    "mutual_friends": 5,
    "is_friend": true,
    "friend_status": "accepted"
  }
}
```

### List Active Sessions

```http
GET /me/sessions
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "session-123",
      "device": "Chrome on macOS",
      "ip_address": "192.168.1.1",
      "location": "San Francisco, CA",
      "last_active": "2024-01-15T10:30:00Z",
      "current": true
    }
  ]
}
```

### Revoke Session

```http
DELETE /me/sessions/:id
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Settings

### Get Settings

```http
GET /settings
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "notifications": {
      "email_notifications": true,
      "push_notifications": true,
      "notify_messages": true,
      "notify_mentions": true,
      "notify_friend_requests": true,
      "notification_sound": true,
      "quiet_hours_enabled": false,
      "quiet_hours_start": null,
      "quiet_hours_end": null
    },
    "privacy": {
      "show_online_status": true,
      "show_read_receipts": true,
      "profile_visibility": "public",
      "allow_friend_requests": true,
      "allow_message_requests": true
    },
    "appearance": {
      "theme": "system",
      "compact_mode": false,
      "font_size": "medium"
    },
    "locale": {
      "language": "en",
      "timezone": "America/Los_Angeles",
      "date_format": "mdy",
      "time_format": "twelve_hour"
    }
  }
}
```

### Update Settings

```http
PUT /settings
Authorization: Bearer <token>
```

**Request Body:** (partial update supported)
```json
{
  "theme": "dark",
  "compact_mode": true,
  "notify_messages": false
}
```

### Update Notification Settings

```http
PUT /settings/notifications
Authorization: Bearer <token>
```

### Update Privacy Settings

```http
PUT /settings/privacy
Authorization: Bearer <token>
```

### Update Appearance Settings

```http
PUT /settings/appearance
Authorization: Bearer <token>
```

### Reset to Defaults

```http
POST /settings/reset
Authorization: Bearer <token>
```

---

## Friends

### List Friends

```http
GET /friends
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status: `accepted`, `pending`, `blocked` (default: `accepted`)
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "friendship-id",
      "user": {
        "id": "user-id",
        "username": "janedoe",
        "display_name": "Jane Doe",
        "avatar_url": "...",
        "status": "online"
      },
      "since": "2024-01-10T08:00:00Z"
    }
  ],
  "meta": {
    "total": 42
  }
}
```

### Get Pending Requests

```http
GET /friends/pending
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": {
    "incoming": [
      {
        "id": "request-id",
        "user": { ... },
        "sent_at": "2024-01-15T09:00:00Z"
      }
    ],
    "outgoing": [
      {
        "id": "request-id",
        "user": { ... },
        "sent_at": "2024-01-15T08:00:00Z"
      }
    ]
  }
}
```

### Send Friend Request

```http
POST /friends
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "user_id": "target-user-id"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "friendship-id",
    "status": "pending",
    "user": { ... }
  }
}
```

### Accept Friend Request

```http
POST /friends/:id/accept
Authorization: Bearer <token>
```

**Response:** `200 OK`

### Decline Friend Request

```http
POST /friends/:id/decline
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### Remove Friend

```http
DELETE /friends/:id
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### Block User

```http
POST /friends/:id/block
Authorization: Bearer <token>
```

**Response:** `200 OK`

### Unblock User

```http
DELETE /friends/:id/block
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### Get Mutual Friends

```http
GET /friends/:id/mutual
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "user-id",
      "username": "mutualfriend",
      "display_name": "Mutual Friend",
      "avatar_url": "..."
    }
  ]
}
```

### Get Friend Suggestions

```http
GET /friends/suggestions
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "user": { ... },
      "mutual_friends_count": 5,
      "reason": "5 mutual friends"
    }
  ]
}
```

---

## Messaging

### List Conversations

```http
GET /conversations
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` - Max results (default: 20)
- `cursor` - Cursor for pagination

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "conv-id",
      "type": "direct",
      "participants": [
        {
          "id": "user-id",
          "username": "janedoe",
          "display_name": "Jane Doe",
          "avatar_url": "..."
        }
      ],
      "last_message": {
        "id": "msg-id",
        "content": "Hey there!",
        "sender_id": "user-id",
        "sent_at": "2024-01-15T10:00:00Z"
      },
      "unread_count": 2,
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "next_cursor": "eyJpZCI6..."
  }
}
```

### Create Conversation

```http
POST /conversations
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "participant_ids": ["user-id-1", "user-id-2"]
}
```

### Get Conversation

```http
GET /conversations/:id
Authorization: Bearer <token>
```

### List Messages

```http
GET /conversations/:id/messages
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` - Max results (default: 50)
- `before` - Get messages before this message ID
- `after` - Get messages after this message ID

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "msg-id",
      "content": "Hello!",
      "sender": {
        "id": "user-id",
        "username": "johndoe",
        "display_name": "John Doe",
        "avatar_url": "..."
      },
      "attachments": [],
      "reactions": [
        {
          "emoji": "👍",
          "count": 2,
          "users": ["user-1", "user-2"]
        }
      ],
      "reply_to": null,
      "edited_at": null,
      "sent_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Send Message

```http
POST /conversations/:id/messages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Hello there!",
  "attachments": ["upload-id-1"],
  "reply_to": "message-id-to-reply-to"
}
```

**Response:** `201 Created`

### Send Typing Indicator

```http
POST /conversations/:id/typing
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### Mark Message as Read

```http
POST /conversations/:id/messages/:message_id/read
Authorization: Bearer <token>
```

### Add Reaction

```http
POST /messages/:id/reactions
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "emoji": "👍"
}
```

### Remove Reaction

```http
DELETE /messages/:id/reactions/:emoji
Authorization: Bearer <token>
```

---

## Groups

### List Groups

```http
GET /groups
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "group-id",
      "name": "My Server",
      "description": "A cool server",
      "icon_url": "...",
      "member_count": 150,
      "role": "owner",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Group

```http
POST /groups
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My New Server",
  "description": "A place for friends",
  "icon": "upload-id"
}
```

### Get Group

```http
GET /groups/:id
Authorization: Bearer <token>
```

### Update Group

```http
PUT /groups/:id
Authorization: Bearer <token>
```

### Delete Group

```http
DELETE /groups/:id
Authorization: Bearer <token>
```

### List Channels

```http
GET /groups/:id/channels
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "channel-id",
      "name": "general",
      "type": "text",
      "topic": "General discussion",
      "position": 0,
      "category_id": "category-id"
    }
  ]
}
```

### Create Channel

```http
POST /groups/:id/channels
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "announcements",
  "type": "text",
  "topic": "Important announcements",
  "category_id": "category-id"
}
```

### List Members

```http
GET /groups/:id/members
Authorization: Bearer <token>
```

### Kick Member

```http
POST /groups/:id/members/:user_id/kick
Authorization: Bearer <token>
```

### Ban Member

```http
POST /groups/:id/members/:user_id/ban
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Violation of community guidelines",
  "delete_messages_days": 7
}
```

### Create Invite

```http
POST /groups/:id/invites
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "max_uses": 10,
  "expires_in": 86400
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "code": "abc123",
    "url": "https://cgraph.org/invite/abc123",
    "expires_at": "2024-01-16T10:00:00Z"
  }
}
```

### Join via Invite

```http
POST /invites/:code/join
Authorization: Bearer <token>
```

---

## Forums

### List Forums

```http
GET /forums
Authorization: Bearer <token>
```

### Create Forum

```http
POST /forums
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Technology",
  "description": "Discuss tech topics",
  "type": "public"
}
```

### List Posts

```http
GET /forums/:id/posts
Authorization: Bearer <token>
```

**Query Parameters:**
- `sort` - `hot`, `new`, `top` (default: `hot`)
- `time` - For `top`: `day`, `week`, `month`, `year`, `all`
- `limit` - Max results (default: 25)
- `cursor` - Pagination cursor

### Create Post

```http
POST /forums/:id/posts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "My first post",
  "content": "This is the content...",
  "category_id": "category-id",
  "attachments": ["upload-id"]
}
```

### Vote on Post

```http
POST /forums/:forum_id/posts/:id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "direction": 1
}
```

Direction: `1` for upvote, `-1` for downvote, `0` to remove vote.

### Save Post

```http
POST /forums/:forum_id/posts/:id/save
Authorization: Bearer <token>
```

### List Comments

```http
GET /forums/:forum_id/posts/:post_id/comments
Authorization: Bearer <token>
```

### Create Comment

```http
POST /forums/:forum_id/posts/:post_id/comments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Great post!",
  "parent_id": null
}
```

---

## Forum Hosting Platform (MyBB-style)

The forum hosting platform allows users to create fully-featured forums with boards, threads, posts, and complete customization. Forums also participate in Reddit-style discovery and voting.

### Forum Voting (Competition)

#### Upvote/Downvote a Forum

```http
POST /forums/:forum_id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "value": 1
}
```

Value: `1` for upvote, `-1` for downvote. Voting again with the same value removes the vote.

**Response:** `200 OK`
```json
{
  "data": {
    "voted": true,
    "value": 1,
    "score": 42
  }
}
```

#### Get Forum Leaderboard

```http
GET /forums/leaderboard
Authorization: Bearer <token>
```

**Query Parameters:**
- `sort` - `hot`, `top`, `weekly`, `monthly` (default: `hot`)
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "forum-id",
      "name": "TechHub",
      "score": 1543,
      "upvotes": 1600,
      "downvotes": 57,
      "member_count": 15000,
      "category": "technology"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 100 }
}
```

### Boards (Forum Sections)

#### List Boards

```http
GET /forums/:forum_id/boards
Authorization: Bearer <token>
```

**Query Parameters:**
- `parent_id` - Filter by parent board (for sub-boards)
- `include_hidden` - Include hidden boards (moderators only)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "board-id",
      "name": "General Discussion",
      "slug": "general-discussion",
      "description": "Talk about anything!",
      "position": 1,
      "thread_count": 150,
      "post_count": 2300
    }
  ]
}
```

#### Create Board

```http
POST /forums/:forum_id/boards
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "board": {
    "name": "Announcements",
    "description": "Official announcements",
    "icon": "📢",
    "position": 0,
    "parent_board_id": null
  }
}
```

#### Update Board

```http
PUT /forums/:forum_id/boards/:id
Authorization: Bearer <token>
```

#### Delete Board

```http
DELETE /forums/:forum_id/boards/:id
Authorization: Bearer <token>
```

### Threads

#### List Threads in a Board

```http
GET /boards/:board_id/threads
Authorization: Bearer <token>
```

**Query Parameters:**
- `sort` - `latest`, `hot`, `top`, `views` (default: `latest`)
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "thread-id",
      "title": "Welcome to our forum!",
      "slug": "welcome-to-our-forum",
      "is_pinned": true,
      "is_locked": false,
      "view_count": 5000,
      "reply_count": 120,
      "score": 45,
      "author": {
        "id": "user-id",
        "username": "admin",
        "avatar_url": "https://..."
      },
      "last_post_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 150 }
}
```

#### Create Thread

```http
POST /boards/:board_id/threads
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "thread": {
    "title": "My new thread",
    "content": "This is the thread content...",
    "prefix": "Discussion"
  }
}
```

#### Get Thread

```http
GET /boards/:board_id/threads/:id
Authorization: Bearer <token>
```

#### Pin/Unpin Thread

```http
POST /boards/:board_id/threads/:id/pin
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "pinned": true
}
```

#### Lock/Unlock Thread

```http
POST /boards/:board_id/threads/:id/lock
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "locked": true
}
```

#### Vote on Thread

```http
POST /boards/:board_id/threads/:id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "value": 1
}
```

### Thread Posts (Replies)

#### List Posts in a Thread

```http
GET /threads/:thread_id/posts
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `per_page` - Posts per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "post-id",
      "content": "Great thread!",
      "content_html": "<p>Great thread!</p>",
      "is_edited": false,
      "score": 5,
      "position": 1,
      "author": {
        "id": "user-id",
        "username": "member123",
        "avatar_url": "https://..."
      },
      "inserted_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total": 50 }
}
```

#### Create Post (Reply)

```http
POST /threads/:thread_id/posts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "post": {
    "content": "Thanks for the information!",
    "reply_to_id": null
  }
}
```

#### Update Post

```http
PUT /threads/:thread_id/posts/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "post": {
    "content": "Updated content...",
    "edit_reason": "Fixed typo"
  }
}
```

#### Vote on Post

```http
POST /threads/:thread_id/posts/:id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "value": 1
}
```

---

## Notifications

### Register Push Token

Register a device for push notifications. Re-registering the same token updates the existing record.

```http
POST /push-tokens
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxx]",
  "platform": "ios"
}
```

**Platform Values:**
- `ios` - Apple Push Notification Service (mapped to `apns` internally)
- `android` - Firebase Cloud Messaging (mapped to `fcm` internally)
- `web` - Web Push (stored as `web`)
- `expo` - Expo Push Notifications (stored as `expo`)

**Response:** `201 Created`
```json
{
  "data": {
    "id": "push-token-id",
    "token": "ExponentPushToken[xxxxxxxxxxxxx]",
    "platform": "apns",
    "registered": true,
    "inserted_at": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses:**
- `422 Unprocessable Entity` - Invalid platform or missing token

### Delete Push Token

Unregister a device from push notifications.

```http
DELETE /push-tokens/:id
Authorization: Bearer <token>
```

**Response:** `204 No Content`

### List Notifications

```http
GET /notifications
Authorization: Bearer <token>
```

**Query Parameters:**
- `unread_only` - Boolean (default: false)
- `types` - Comma-separated notification types
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "notif-id",
      "type": "friend_request",
      "title": "New friend request",
      "body": "John Doe wants to be your friend",
      "data": {
        "user_id": "user-id"
      },
      "read": false,
      "actor": {
        "id": "user-id",
        "username": "johndoe",
        "avatar_url": "..."
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "unread_count": 5
  }
}
```

### Mark Notification as Read

```http
POST /notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read

```http
POST /notifications/read
Authorization: Bearer <token>
```

---

## Uploads

### Upload File

```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The file to upload
- `type`: `image`, `video`, `audio`, `document`

**Response:** `201 Created`
```json
{
  "data": {
    "id": "upload-id",
    "url": "https://cdn.cgraph.org/uploads/...",
    "filename": "photo.jpg",
    "content_type": "image/jpeg",
    "size": 1024567,
    "width": 1920,
    "height": 1080
  }
}
```

### Get Upload

```http
GET /files/:id
Authorization: Bearer <token>
```

---

## Search

### Search Users

```http
GET /search/users?q=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` - Search query (required)
- `limit` - Max results (default: 20)

### Search Messages

```http
GET /search/messages?q=hello
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` - Search query (required)
- `in` - Conversation or channel ID (optional)
- `from` - User ID (optional)
- `limit` - Max results (default: 25)

### Search Posts

```http
GET /search/posts?q=technology
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` - Search query (required)
- `forum` - Forum ID (optional)
- `sort` - `relevance`, `new`, `top` (default: `relevance`)
- `limit` - Max results (default: 25)

---

## WebSocket Events

Connect to the WebSocket at:
```
wss://api.cgraph.org/socket/websocket?token=<jwt_token>
```

### Channels

Join channels to receive real-time events:

```javascript
// User's personal channel (notifications, presence)
socket.channel("user:USER_ID")

// Conversation channel
socket.channel("conversation:CONVERSATION_ID")

// Group channel
socket.channel("group:GROUP_ID")

// Specific text channel in a group
socket.channel("channel:CHANNEL_ID")
```

### Events

#### Incoming Events (Server → Client)

**new_message**
```json
{
  "id": "msg-id",
  "content": "Hello!",
  "sender": { ... },
  "sent_at": "2024-01-15T10:00:00Z"
}
```

**message_updated**
```json
{
  "id": "msg-id",
  "content": "Hello! (edited)",
  "edited_at": "2024-01-15T10:05:00Z"
}
```

**message_deleted**
```json
{
  "id": "msg-id"
}
```

**typing**
```json
{
  "user_id": "user-id",
  "username": "johndoe"
}
```

**presence_diff**
```json
{
  "joins": {
    "user-id": { "status": "online" }
  },
  "leaves": {
    "user-id": {}
  }
}
```

**notification**
```json
{
  "id": "notif-id",
  "type": "friend_request",
  "title": "New friend request",
  "body": "...",
  "data": { ... }
}
```

#### Outgoing Events (Client → Server)

**typing**
```json
{
  "typing": true
}
```

**mark_read**
```json
{
  "message_id": "msg-id"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Common Error Responses

**Validation Error:**
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["has already been taken"],
    "password": ["is too short"]
  }
}
```

**Rate Limited:**
```json
{
  "error": "Rate limit exceeded. Please slow down.",
  "code": "RATE_LIMITED",
  "retry_after": 60
}
```

---

## SDK Libraries

Official client libraries:

- **JavaScript/TypeScript**: `npm install @cgraph/client`
- **React Native**: `npm install @cgraph/react-native`
- **Swift (iOS)**: Coming soon
- **Kotlin (Android)**: Coming soon

---

*API Version: 1.0.0 | Last Updated: January 2024*

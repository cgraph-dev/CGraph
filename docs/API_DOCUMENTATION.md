# CGraph API Documentation

> **Version: 0.9.8** | Last Updated: January 2026

Complete reference for the CGraph REST and WebSocket APIs.

---

## Base URLs

| Environment | REST API                                | WebSocket                             |
| ----------- | --------------------------------------- | ------------------------------------- |
| Production  | `https://cgraph-backend.fly.dev/api/v1` | `wss://cgraph-backend.fly.dev/socket` |
| Staging     | `https://api.staging.cgraph.org/api/v1` | `wss://api.staging.cgraph.org/socket` |

---

## Authentication

### JWT Bearer Token

All authenticated endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Obtaining Tokens

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_abc123...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe"
  }
}
```

#### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "rt_abc123..."
}
```

**Response:** Same as login

---

## Rate Limits

| Endpoint Category | Limit        | Window     |
| ----------------- | ------------ | ---------- |
| Authentication    | 5 requests   | 15 minutes |
| Messages          | 60 requests  | 1 minute   |
| Search            | 30 requests  | 1 minute   |
| File uploads      | 10 requests  | 1 minute   |
| General API       | 300 requests | 1 minute   |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706400000
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "short_code",
  "message": "Human-readable description",
  "details": {}
}
```

| Status Code | Error Code         | Description              |
| ----------- | ------------------ | ------------------------ |
| 400         | `validation_error` | Invalid input data       |
| 401         | `unauthorized`     | Missing or invalid token |
| 403         | `forbidden`        | Insufficient permissions |
| 404         | `not_found`        | Resource doesn't exist   |
| 409         | `conflict`         | Resource already exists  |
| 429         | `rate_limited`     | Too many requests        |
| 500         | `internal_error`   | Server error             |

---

## Endpoints

### Users

#### Get Current User

```http
GET /users/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar_url": "https://cdn.cgraph.org/avatars/abc123.webp",
  "status": "online",
  "created_at": "2026-01-15T10:30:00Z"
}
```

#### Update Profile

```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "display_name": "John D.",
  "status": "away"
}
```

#### Get User by ID

```http
GET /users/:user_id
Authorization: Bearer <token>
```

---

### Servers

#### List User's Servers

```http
GET /servers
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": [
    {
      "id": "srv_abc123",
      "name": "My Community",
      "icon_url": "https://cdn.cgraph.org/icons/abc123.webp",
      "owner_id": "usr_abc123",
      "member_count": 150,
      "created_at": "2026-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "per_page": 25
  }
}
```

#### Create Server

```http
POST /servers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My New Server",
  "visibility": "private"
}
```

#### Get Server Details

```http
GET /servers/:server_id
Authorization: Bearer <token>
```

#### Update Server

```http
PATCH /servers/:server_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "New description"
}
```

#### Delete Server

```http
DELETE /servers/:server_id
Authorization: Bearer <token>
```

---

### Channels

#### List Server Channels

```http
GET /servers/:server_id/channels
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": [
    {
      "id": "ch_abc123",
      "name": "general",
      "type": "text",
      "position": 0,
      "category_id": "cat_xyz789"
    },
    {
      "id": "ch_def456",
      "name": "Voice Chat",
      "type": "voice",
      "position": 1,
      "category_id": "cat_xyz789"
    }
  ]
}
```

#### Create Channel

```http
POST /servers/:server_id/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "announcements",
  "type": "text",
  "category_id": "cat_xyz789"
}
```

Channel types: `text`, `voice`, `forum`, `announcement`

---

### Messages

#### List Channel Messages

```http
GET /channels/:channel_id/messages
Authorization: Bearer <token>
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`limit` | integer | Max messages (1-100, default 50) | | `before` | string | Message ID for
pagination | | `after` | string | Message ID for pagination |

**Response:**

```json
{
  "data": [
    {
      "id": "msg_abc123",
      "content": "Hello everyone!",
      "author": {
        "id": "usr_abc123",
        "username": "johndoe",
        "display_name": "John Doe"
      },
      "created_at": "2026-01-27T12:00:00Z",
      "edited_at": null,
      "attachments": [],
      "reactions": []
    }
  ]
}
```

#### Send Message

```http
POST /channels/:channel_id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello, world!",
  "attachments": []
}
```

#### Edit Message

```http
PATCH /channels/:channel_id/messages/:message_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content"
}
```

#### Delete Message

```http
DELETE /channels/:channel_id/messages/:message_id
Authorization: Bearer <token>
```

---

### Direct Messages (E2EE)

#### List DM Conversations

```http
GET /dms
Authorization: Bearer <token>
```

#### Create DM Conversation

```http
POST /dms
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipient_id": "usr_def456"
}
```

#### Send Encrypted Message

```http
POST /dms/:conversation_id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "ciphertext": "base64_encrypted_content...",
  "session_id": "sess_abc123",
  "message_type": 1
}
```

⚠️ **Note:** DM content is end-to-end encrypted. The server only stores ciphertext.

---

### E2EE Key Management

#### Upload Pre-Keys

```http
POST /keys/prekeys
Authorization: Bearer <token>
Content-Type: application/json

{
  "identity_key": "base64_public_key...",
  "signed_pre_key": {
    "key_id": 1,
    "public_key": "base64_public_key...",
    "signature": "base64_signature..."
  },
  "one_time_pre_keys": [
    {"key_id": 1, "public_key": "base64_public_key..."},
    {"key_id": 2, "public_key": "base64_public_key..."}
  ]
}
```

#### Fetch Recipient's Pre-Key Bundle

```http
GET /keys/bundle/:user_id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "identity_key": "base64_public_key...",
  "signed_pre_key": {
    "key_id": 1,
    "public_key": "base64_public_key...",
    "signature": "base64_signature..."
  },
  "one_time_pre_key": {
    "key_id": 42,
    "public_key": "base64_public_key..."
  }
}
```

---

### File Uploads

#### Upload File

```http
POST /upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

**Response:**

```json
{
  "id": "file_abc123",
  "url": "https://cdn.cgraph.org/files/abc123.pdf",
  "filename": "document.pdf",
  "size": 102400,
  "content_type": "application/pdf"
}
```

**Limits:**

- Max file size: 25MB (100MB for premium)
- Allowed types: images, videos, documents, audio

---

## WebSocket API

### Connection

Connect to the WebSocket endpoint with authentication:

```javascript
const socket = new WebSocket('wss://cgraph-backend.fly.dev/socket');

socket.onopen = () => {
  socket.send(
    JSON.stringify({
      type: 'auth',
      token: 'Bearer <access_token>',
    })
  );
};
```

### Event Types

#### Outgoing (Client → Server)

| Event         | Payload                | Description              |
| ------------- | ---------------------- | ------------------------ |
| `auth`        | `{token: string}`      | Authenticate connection  |
| `subscribe`   | `{channel_id: string}` | Subscribe to channel     |
| `unsubscribe` | `{channel_id: string}` | Unsubscribe from channel |
| `typing`      | `{channel_id: string}` | Indicate typing          |
| `heartbeat`   | `{}`                   | Keep connection alive    |

#### Incoming (Server → Client)

| Event             | Payload                 | Description         |
| ----------------- | ----------------------- | ------------------- |
| `ready`           | `{user: User}`          | Auth successful     |
| `message_create`  | `{message: Message}`    | New message         |
| `message_update`  | `{message: Message}`    | Message edited      |
| `message_delete`  | `{id: string}`          | Message deleted     |
| `typing_start`    | `{user_id, channel_id}` | User started typing |
| `presence_update` | `{user_id, status}`     | User status changed |

### Example: Real-time Messages

```javascript
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'message_create':
      console.log('New message:', data.message);
      break;
    case 'typing_start':
      showTypingIndicator(data.user_id);
      break;
  }
};

// Subscribe to a channel
socket.send(
  JSON.stringify({
    type: 'subscribe',
    channel_id: 'ch_abc123',
  })
);
```

---

## Pagination

List endpoints use cursor-based pagination:

```http
GET /channels/:id/messages?limit=50&before=msg_abc123
```

Response includes pagination info:

```json
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "msg_xyz789"
  }
}
```

---

## Webhooks

Servers can configure webhooks to receive events:

```http
POST /servers/:server_id/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "events": ["message_create", "member_join"]
}
```

Webhook payloads include a signature header:

```http
X-CGraph-Signature: sha256=abc123...
```

Verify with:

```javascript
const crypto = require('crypto');
const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
```

---

## SDK Libraries

| Language              | Package       | Repository  |
| --------------------- | ------------- | ----------- |
| JavaScript/TypeScript | `@cgraph/sdk` | Coming soon |
| Python                | `cgraph-py`   | Coming soon |
| Elixir                | `cgraph`      | Coming soon |

---

<sub>**CGraph API Documentation** • Version 0.9.28 • [OpenAPI Spec](/api/openapi.json)</sub>

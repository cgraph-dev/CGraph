/**
 * Documentation Article Page - Individual doc article rendering
 *
 * Renders full article content for each documentation topic using slug-based routing.
 * All content reflects real platform features and architecture.
 *
 * @since v0.9.15
 */

import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { MarketingLayout } from '@/components/marketing';
import { NeonIcon } from '@/components/marketing/ui';

interface DocArticleData {
  title: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  readTime: string;
  content: string;
}

const docArticles: Record<string, DocArticleData> = {
  'what-is-cgraph': {
    title: 'What is CGraph?',
    category: 'Getting Started',
    categoryIcon: '🚀',
    categoryColor: '#34d399',
    readTime: '3 min read',
    content: `
<p>CGraph is a <strong>community platform</strong> that combines real-time messaging, forum discussions, and end-to-end encryption in one app — with RPG-style gamification baked in.</p>

<h3>Core Features</h3>
<ul>
  <li><strong>Real-Time Messaging</strong> — Text, voice, and video chat with servers, channels, and direct messages. WebSocket-powered with typing indicators, read receipts, and presence.</li>
  <li><strong>Community Forums</strong> — Threaded discussions with voting, karma, nested comments, polls, and rich text editing using a custom BBCode parser.</li>
  <li><strong>Post-Quantum Encryption</strong> — End-to-end encryption using Triple Ratchet (PQXDH + ML-KEM-768) for all private messages.</li>
  <li><strong>RPG Gamification</strong> — 30+ achievements across 6 categories, XP/level progression, daily and weekly quests, streak multipliers, and a virtual marketplace.</li>
</ul>

<h3>Technical Foundation</h3>
<table>
  <thead><tr><th>Layer</th><th>Technology</th><th>Details</th></tr></thead>
  <tbody>
    <tr><td><strong>Frontend (Web)</strong></td><td>React 19, TypeScript 5.8, Vite 6.3</td><td>62 lazy-loaded pages, 168 build chunks</td></tr>
    <tr><td><strong>Frontend (Mobile)</strong></td><td>React Native 0.81, Expo SDK 54</td><td>Full feature parity with web</td></tr>
    <tr><td><strong>Backend</strong></td><td>Elixir 1.17+, Phoenix 1.8</td><td>91 DB tables, 3-tier caching</td></tr>
    <tr><td><strong>Database</strong></td><td>PostgreSQL 16</td><td>Cursor-based pagination throughout</td></tr>
    <tr><td><strong>Real-time</strong></td><td>Phoenix Channels (WebSocket)</td><td>Presence tracking, typing indicators</td></tr>
    <tr><td><strong>Infrastructure</strong></td><td>Fly.io, Cloudflare, Vercel</td><td>Multi-region deployment</td></tr>
  </tbody>
</table>

<h3>Current Status</h3>
<p>CGraph is in active development at <strong>v0.9.26</strong> with 59 of 69 planned features complete (85%), 1,633 passing tests, and an architecture quality score of 9.2/10. The platform is approaching its v1.0 public launch.</p>
`,
  },
  'creating-your-account': {
    title: 'Creating Your Account',
    category: 'Getting Started',
    categoryIcon: '🚀',
    categoryColor: '#34d399',
    readTime: '2 min read',
    content: `
<p>CGraph supports multiple authentication methods to get you started quickly and securely.</p>

<h3>Authentication Methods</h3>
<table>
  <thead><tr><th>Method</th><th>How It Works</th><th>Security Level</th></tr></thead>
  <tbody>
    <tr><td><strong>Email + Password</strong></td><td>Traditional registration with email verification</td><td>Argon2id hashed, 2FA available</td></tr>
    <tr><td><strong>OAuth Providers</strong></td><td>Google, Apple, Facebook, TikTok sign-in</td><td>Delegated authentication</td></tr>
    <tr><td><strong>Web3 Wallet</strong></td><td>Ethereum/Polygon wallet connection</td><td>Cryptographic signature verification</td></tr>
  </tbody>
</table>

<h3>Account Security</h3>
<ul>
  <li>Passwords are hashed using <strong>Argon2id</strong> (memory-hard, resistant to GPU attacks)</li>
  <li>JWT tokens with 15-minute access tokens and refresh token rotation</li>
  <li>Optional two-factor authentication (TOTP)</li>
  <li>Rate limiting: 5 auth attempts per 15 minutes</li>
  <li>Session management across multiple devices</li>
</ul>

<h3>Profile Setup</h3>
<p>After creating your account, you can customize your profile with:</p>
<ul>
  <li>Display name and bio</li>
  <li>Avatar upload (or generate from wallet address)</li>
  <li>Theme selection (dark, light, or matrix green)</li>
  <li>Notification preferences</li>
  <li>Privacy settings (online status visibility, read receipts)</li>
</ul>
`,
  },
  'setting-up-your-first-server': {
    title: 'Setting Up Your First Server',
    category: 'Getting Started',
    categoryIcon: '🚀',
    categoryColor: '#34d399',
    readTime: '5 min read',
    content: `
<p>Servers are the core organizational unit in CGraph — with built-in forums and gamification.</p>

<h3>Creating a Server</h3>
<ol>
  <li>Click the <strong>+</strong> button in the server sidebar</li>
  <li>Choose a template or start from scratch</li>
  <li>Set your server name, description, and icon</li>
  <li>Configure default channels (text, voice, forum, announcements)</li>
  <li>Set up role-based permissions</li>
</ol>

<h3>Channel Types</h3>
<table>
  <thead><tr><th>Type</th><th>Purpose</th><th>Features</th></tr></thead>
  <tbody>
    <tr><td><strong>Text</strong></td><td>Real-time messaging</td><td>Reactions, threads, file sharing, voice messages</td></tr>
    <tr><td><strong>Voice</strong></td><td>Voice/video calls</td><td>WebRTC, screen sharing, up to 25 participants</td></tr>
    <tr><td><strong>Forum</strong></td><td>Threaded discussions</td><td>Voting, karma, rich text, polls, thread prefixes</td></tr>
    <tr><td><strong>Announcements</strong></td><td>One-way updates</td><td>Read-only for members, push notification support</td></tr>
  </tbody>
</table>

<h3>Permission System</h3>
<p>CGraph uses a hierarchical role-based permission system:</p>
<ul>
  <li><strong>Server Owner</strong> — Full administrative control</li>
  <li><strong>Admin</strong> — Manage channels, roles, and members</li>
  <li><strong>Moderator</strong> — Ban/kick, pin messages, manage content</li>
  <li><strong>Member</strong> — Send messages, join voice, participate in forums</li>
  <li><strong>Custom Roles</strong> — Granular per-channel permissions</li>
</ul>
`,
  },
  'channels-text-voice-forum-announcements': {
    title: 'Channels: Text, Voice, Forum & Announcements',
    category: 'Getting Started',
    categoryIcon: '🚀',
    categoryColor: '#34d399',
    readTime: '6 min read',
    content: `
<p>Channels are where conversations happen in CGraph. Each server can have unlimited channels organized into categories.</p>

<h3>Text Channels</h3>
<p>Real-time messaging with rich features:</p>
<ul>
  <li><strong>Message formatting</strong> — Markdown support with bold, italic, code blocks, and spoilers</li>
  <li><strong>File sharing</strong> — Up to 25MB (free) or 100MB (premium) per file</li>
  <li><strong>Message reactions</strong> — Full emoji support with custom server emojis</li>
  <li><strong>Threads</strong> — Branch conversations without cluttering the main channel</li>
  <li><strong>Message pinning</strong> — Pin important messages for easy reference</li>
  <li><strong>Voice messages</strong> — Record and send voice clips with waveform visualization</li>
</ul>

<h3>Voice Channels</h3>
<p>Built on WebRTC for low-latency communication:</p>
<ul>
  <li>Real-time voice chat with automatic gain control</li>
  <li>Video calls with up to 25 simultaneous participants</li>
  <li>Screen sharing for presentations and collaboration</li>
  <li>Push-to-talk and voice activity detection modes</li>
</ul>

<h3>Forum Channels</h3>
<p>Threaded discussions within your server:</p>
<ul>
  <li>Create posts with rich text (BBCode parser)</li>
  <li>Nested comment threads (unlimited depth)</li>
  <li>Upvote/downvote system with karma tracking</li>
  <li>Thread prefixes for organization (Discussion, Question, Guide, etc.)</li>
  <li>Polls and ratings on posts</li>
  <li>RSS/Atom feed support for external syndication</li>
</ul>
`,
  },
  'inviting-members-permissions': {
    title: 'Inviting Members & Permissions',
    category: 'Getting Started',
    categoryIcon: '🚀',
    categoryColor: '#34d399',
    readTime: '4 min read',
    content: `
<p>Growing your community starts with inviting members and configuring the right permissions.</p>

<h3>Invitation Methods</h3>
<ul>
  <li><strong>Invite Links</strong> — Generate shareable links with optional expiry and max uses</li>
  <li><strong>Direct Invites</strong> — Send invitations to specific CGraph users by username</li>
  <li><strong>QR Codes</strong> — Generate QR codes for in-person invitations (mobile)</li>
</ul>

<h3>Role-Based Access Control</h3>
<p>CGraph implements granular RBAC with the following permission categories:</p>
<table>
  <thead><tr><th>Category</th><th>Permissions</th></tr></thead>
  <tbody>
    <tr><td><strong>General</strong></td><td>View Channels, Manage Server, Manage Roles, Manage Channels</td></tr>
    <tr><td><strong>Text</strong></td><td>Send Messages, Embed Links, Attach Files, Add Reactions, Manage Messages</td></tr>
    <tr><td><strong>Voice</strong></td><td>Connect, Speak, Stream, Mute Members, Move Members</td></tr>
    <tr><td><strong>Forum</strong></td><td>Create Posts, Vote, Pin Threads, Lock Threads, Moderate</td></tr>
  </tbody>
</table>

<h3>Permission Hierarchy</h3>
<p>Permissions are resolved in this order:</p>
<ol>
  <li>Server-level role permissions (base)</li>
  <li>Channel-level permission overrides (specific)</li>
  <li>User-specific overrides (highest priority)</li>
</ol>
<p>The <code>@everyone</code> role sets default permissions for all members. Custom roles can add or deny specific permissions on top of this base.</p>
`,
  },
  'real-time-messaging-typing-indicators': {
    title: 'Real-Time Messaging & Typing Indicators',
    category: 'Messaging & Communication',
    categoryIcon: '💬',
    categoryColor: '#60a5fa',
    readTime: '5 min read',
    content: `
<p>CGraph's messaging system is built for speed and reliability, powered by Phoenix Channels over WebSocket connections.</p>

<h3>Architecture Overview</h3>
<p>Messages flow through this pipeline:</p>
<ol>
  <li><strong>Client sends</strong> — Message is encrypted (for DMs) and sent via WebSocket</li>
  <li><strong>Server processes</strong> — Validation, rate limiting, content moderation checks</li>
  <li><strong>Persistence</strong> — Stored in PostgreSQL with cursor-based pagination keys</li>
  <li><strong>Broadcast</strong> — Phoenix PubSub broadcasts to all channel subscribers</li>
  <li><strong>Delivery</strong> — Recipients receive via WebSocket or push notification (offline)</li>
</ol>

<h3>Typing Indicators</h3>
<p>Typing indicators are implemented as lightweight WebSocket events:</p>
<ul>
  <li><code>typing:start</code> — Sent when user begins typing (debounced to 3 seconds)</li>
  <li><code>typing:stop</code> — Sent when user stops typing or sends message</li>
  <li>Automatic timeout after 5 seconds of inactivity</li>
  <li>Shows up to 3 typing users, then "several people are typing..."</li>
</ul>

<h3>Message Features</h3>
<ul>
  <li><strong>Delivery status</strong> — Sent, delivered, read (configurable)</li>
  <li><strong>Read receipts</strong> — Optional per-conversation</li>
  <li><strong>Message search</strong> — Full-text search across conversations</li>
  <li><strong>Offline queuing</strong> — Messages are queued locally and sent when reconnected</li>
  <li><strong>Rate limiting</strong> — 60 messages per minute per user</li>
</ul>
`,
  },
  'message-editing-deletion-forwarding': {
    title: 'Message Editing, Deletion & Forwarding',
    category: 'Messaging & Communication',
    categoryIcon: '💬',
    categoryColor: '#60a5fa',
    readTime: '4 min read',
    content: `
<p>CGraph provides full message lifecycle management with editing, deletion, and forwarding capabilities.</p>

<h3>Message Editing</h3>
<ul>
  <li>Edit any message you've sent (no time limit)</li>
  <li>Edit history is preserved and viewable by other participants</li>
  <li>"(edited)" indicator shown on modified messages</li>
  <li>Encrypted messages are re-encrypted with the updated content</li>
</ul>

<h3>Message Deletion</h3>
<table>
  <thead><tr><th>Action</th><th>Who Can Do It</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><strong>Delete for Me</strong></td><td>Any user</td><td>Hides message locally only</td></tr>
    <tr><td><strong>Delete for Everyone</strong></td><td>Message author</td><td>Removes from all clients</td></tr>
    <tr><td><strong>Moderator Delete</strong></td><td>Mods/Admins</td><td>Removes + logs to audit trail</td></tr>
  </tbody>
</table>

<h3>Message Forwarding</h3>
<ul>
  <li>Forward messages to any conversation (DM, channel, or forum)</li>
  <li>Forwarded messages show original author attribution</li>
  <li>Encrypted messages are re-encrypted for the target conversation</li>
  <li>Attachments are linked, not duplicated (saves storage)</li>
</ul>
`,
  },
  'voice-messages-waveform-visualization': {
    title: 'Voice Messages & Waveform Visualization',
    category: 'Messaging & Communication',
    categoryIcon: '💬',
    categoryColor: '#60a5fa',
    readTime: '3 min read',
    content: `
<p>Record and send voice clips directly in any text channel or DM, complete with visual waveform playback.</p>

<h3>Recording</h3>
<ul>
  <li>Press and hold the microphone button to record</li>
  <li>Swipe left to cancel, release to send</li>
  <li>Maximum duration: 5 minutes</li>
  <li>Opus codec for high-quality compression</li>
  <li>Preview before sending with playback controls</li>
</ul>

<h3>Waveform Visualization</h3>
<p>Voice messages display an animated waveform that represents the audio amplitude over time. The waveform is:</p>
<ul>
  <li>Generated client-side using the Web Audio API</li>
  <li>Stored as a compact array of amplitude values (64 samples)</li>
  <li>Rendered with smooth Reanimated v4 animations on mobile</li>
  <li>Interactive: tap/click to seek to any position</li>
</ul>

<h3>E2EE Support</h3>
<p>Voice messages in encrypted conversations are fully end-to-end encrypted. The audio file is encrypted before upload, and only participants with the conversation keys can decrypt and play the recording.</p>
`,
  },
  'voice-video-calls-webrtc': {
    title: 'Voice & Video Calls (WebRTC)',
    category: 'Messaging & Communication',
    categoryIcon: '💬',
    categoryColor: '#60a5fa',
    readTime: '8 min read',
    content: `
<p>CGraph's voice and video calling system is built on <strong>WebRTC</strong> for peer-to-peer connections with a TURN/STUN fallback for NAT traversal.</p>

<h3>Architecture</h3>
<table>
  <thead><tr><th>Component</th><th>Technology</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><strong>Signaling</strong></td><td>Phoenix Channels</td><td>Session negotiation (SDP exchange)</td></tr>
    <tr><td><strong>Media Transport</strong></td><td>WebRTC (SRTP)</td><td>Encrypted audio/video streams</td></tr>
    <tr><td><strong>NAT Traversal</strong></td><td>STUN/TURN</td><td>Connection through firewalls</td></tr>
    <tr><td><strong>Codec (Audio)</strong></td><td>Opus</td><td>Variable bitrate, low latency</td></tr>
    <tr><td><strong>Codec (Video)</strong></td><td>VP8/VP9</td><td>Adaptive quality based on bandwidth</td></tr>
  </tbody>
</table>

<h3>Features</h3>
<ul>
  <li><strong>1:1 calls</strong> — Direct peer-to-peer audio/video</li>
  <li><strong>Group calls</strong> — Up to 25 participants with SFU architecture</li>
  <li><strong>Screen sharing</strong> — Share your entire screen or a specific window</li>
  <li><strong>Push-to-talk</strong> — Toggle between voice activity and push-to-talk</li>
  <li><strong>Noise suppression</strong> — AI-powered background noise reduction</li>
  <li><strong>Adaptive quality</strong> — Automatic resolution/bitrate adjustment based on network</li>
</ul>

<h3>Mobile Support</h3>
<p>On mobile (React Native), calls use the native WebRTC implementation via <code>react-native-webrtc</code>. CallKit (iOS) and ConnectionService (Android) integration provides native call UI and lockscreen controls.</p>
`,
  },
  'screen-sharing-group-calls': {
    title: 'Screen Sharing & Group Calls',
    category: 'Messaging & Communication',
    categoryIcon: '💬',
    categoryColor: '#60a5fa',
    readTime: '5 min read',
    content: `
<p>Advanced call features for collaboration and group communication.</p>

<h3>Screen Sharing</h3>
<ul>
  <li>Share your entire screen, a specific window, or a browser tab</li>
  <li>Audio sharing supported (system audio capture)</li>
  <li>Viewers can zoom and pan the shared screen</li>
  <li>Works alongside your camera feed (picture-in-picture)</li>
  <li>Up to 1080p screen sharing on premium plans</li>
</ul>

<h3>Group Call Features</h3>
<table>
  <thead><tr><th>Feature</th><th>Free</th><th>Premium</th></tr></thead>
  <tbody>
    <tr><td>Max participants</td><td>8</td><td>25</td></tr>
    <tr><td>Video quality</td><td>720p</td><td>1080p</td></tr>
    <tr><td>Screen share quality</td><td>720p</td><td>1080p</td></tr>
    <tr><td>Duration limit</td><td>2 hours</td><td>Unlimited</td></tr>
  </tbody>
</table>

<h3>Technical Architecture</h3>
<p>Group calls use a <strong>Selective Forwarding Unit (SFU)</strong> architecture rather than mesh topology. Each participant sends one stream to the SFU, which then forwards it to other participants. This scales much better than peer-to-peer mesh for groups larger than 4 people.</p>
`,
  },
  'message-scheduling-reactions': {
    title: 'Message Scheduling & Reactions',
    category: 'Messaging & Communication',
    categoryIcon: '💬',
    categoryColor: '#60a5fa',
    readTime: '3 min read',
    content: `
<p>Advanced messaging features for better communication management.</p>

<h3>Message Scheduling</h3>
<ul>
  <li>Schedule messages for future delivery in any channel or DM</li>
  <li>Set specific date and time with timezone awareness</li>
  <li>Edit or cancel scheduled messages before delivery</li>
  <li>View all scheduled messages in one place</li>
  <li>Scheduled messages are stored encrypted (for E2EE conversations)</li>
</ul>

<h3>Reactions</h3>
<ul>
  <li><strong>Standard emoji</strong> — Full Unicode emoji set</li>
  <li><strong>Custom server emoji</strong> — Upload custom emoji for your server</li>
  <li><strong>Super Reactions</strong> — Premium animated reactions (premium tier)</li>
  <li><strong>Reaction roles</strong> — React to a message to receive a server role</li>
</ul>

<h3>Reaction Data</h3>
<p>Each reaction is stored with the user ID, emoji identifier, and timestamp. Reactions are aggregated and displayed as counts. You can click on a reaction count to see who reacted.</p>
`,
  },
  'e2ee-overview-pqxdh-triple-ratchet': {
    title: 'E2EE Overview: PQXDH + Triple Ratchet',
    category: 'Security & Encryption',
    categoryIcon: '🔐',
    categoryColor: '#f87171',
    readTime: '15 min read',
    content: `
<p>CGraph implements the <strong>Triple Ratchet protocol</strong> (Signal Protocol Revision 4) for end-to-end encryption of direct messages. This is a post-quantum hybrid protocol that provides security against both classical and quantum attacks.</p>

<h3>Protocol Components</h3>
<table>
  <thead><tr><th>Component</th><th>Algorithm</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><strong>Key Agreement</strong></td><td>PQXDH (P-256 ECDH + ML-KEM-768)</td><td>Hybrid post-quantum key exchange</td></tr>
    <tr><td><strong>Message Encryption</strong></td><td>Triple Ratchet (EC DR ∥ SPQR)</td><td>Per-message key derivation with post-quantum forward secrecy</td></tr>
    <tr><td><strong>Symmetric Cipher</strong></td><td>AES-256-GCM</td><td>Authenticated encryption of message content</td></tr>
    <tr><td><strong>Key Derivation</strong></td><td>HKDF-SHA256 + KDF_HYBRID</td><td>Derive new keys from hybrid shared secrets</td></tr>
    <tr><td><strong>Curve</strong></td><td>P-256 (NIST)</td><td>Elliptic curve for classical DH key exchange</td></tr>
    <tr><td><strong>Post-Quantum KEM</strong></td><td>ML-KEM-768 (FIPS 203)</td><td>Lattice-based key encapsulation</td></tr>
    <tr><td><strong>Signatures</strong></td><td>Ed25519</td><td>Identity key signatures</td></tr>
  </tbody>
</table>

<h3>PQXDH Key Exchange</h3>
<p>When Alice wants to start an encrypted conversation with Bob:</p>
<ol>
  <li>Alice fetches Bob's <strong>prekey bundle</strong> from the server (identity key, signed prekey, one-time prekey, ML-KEM public key)</li>
  <li>Alice performs P-256 ECDH + ML-KEM-768 encapsulation to derive a hybrid shared secret</li>
  <li>Alice uses HKDF to derive the initial root key and chain keys from both classical and PQ secrets</li>
  <li>Alice sends her first message along with her ephemeral public key and KEM ciphertext</li>
  <li>Bob derives the same hybrid shared secret from Alice's keys and his own</li>
</ol>

<h3>Triple Ratchet</h3>
<p>After the initial PQXDH exchange, every message uses the Triple Ratchet algorithm:</p>
<ul>
  <li><strong>EC Double Ratchet</strong> — Classical symmetric + DH ratchet for proven forward secrecy</li>
  <li><strong>SPQR (Symmetric Post-Quantum Ratchet)</strong> — Periodic post-quantum key refreshes</li>
  <li><strong>KDF_HYBRID</strong> — Combines EC and PQ ratchet outputs into message keys</li>
  <li><strong>Forward secrecy</strong> — Compromising current keys cannot decrypt past messages</li>
  <li><strong>Future secrecy</strong> — Both EC and PQ ratchets ensure recovery from key compromise</li>
</ul>

<h3>CGraph's Implementation</h3>
<p>Our E2EE implementation is covered by a comprehensive test suite of 192 tests across 14 files verifying:</p>
<ul>
  <li>PQXDH key exchange correctness (classical + post-quantum)</li>
  <li>Triple Ratchet message encryption/decryption</li>
  <li>Post-quantum forward secrecy</li>
  <li>Adversarial scenarios (replay attacks, key tampering, out-of-order messages)</li>
  <li>Stress testing (1000+ message sequences, concurrent sessions)</li>
  <li>Cross-platform compatibility</li>
</ul>
`,
  },
  'key-exchange-pqxdh-aes-256-gcm': {
    title: 'Key Exchange: PQXDH & AES-256-GCM',
    category: 'Security & Encryption',
    categoryIcon: '🔐',
    categoryColor: '#f87171',
    readTime: '12 min read',
    content: `
<p>A deep dive into the cryptographic primitives used in CGraph's post-quantum encryption system.</p>

<h3>PQXDH Key Exchange</h3>
<p>PQXDH combines P-256 ECDH with ML-KEM-768 key encapsulation for hybrid post-quantum security:</p>
<ul>
  <li><strong>256-bit post-quantum security level</strong> — ML-KEM-768 provides NIST Level 3 security</li>
  <li><strong>Hybrid safety</strong> — If either primitive is broken, the other still protects</li>
  <li><strong>Classical P-256 ECDH</strong> — NIST-approved curve with constant-time implementation</li>
  <li><strong>ML-KEM-768 KEM</strong> — Lattice-based key encapsulation (FIPS 203)</li>
</ul>

<h3>AES-256-GCM</h3>
<p>AES-256-GCM provides authenticated encryption with associated data (AEAD):</p>
<ul>
  <li><strong>256-bit key size</strong> — Quantum-resistant security margin</li>
  <li><strong>Authentication</strong> — GCM mode provides built-in integrity verification</li>
  <li><strong>Nonce</strong> — 96-bit random nonce per message (never reused)</li>
  <li><strong>Associated data</strong> — Message metadata is authenticated but not encrypted</li>
</ul>

<h3>Key Management on Device</h3>
<table>
  <thead><tr><th>Key Type</th><th>Storage</th><th>Rotation</th></tr></thead>
  <tbody>
    <tr><td>Identity Key Pair</td><td>Secure keychain/keystore</td><td>Never (tied to account)</td></tr>
    <tr><td>Signed Prekey</td><td>Secure keychain/keystore</td><td>Every 7 days</td></tr>
    <tr><td>One-time Prekeys</td><td>Secure keychain/keystore</td><td>Single use, replenished</td></tr>
    <tr><td>Session Keys</td><td>Encrypted local storage</td><td>Per DH ratchet step</td></tr>
  </tbody>
</table>
`,
  },
  'forward-secrecy-key-derivation-hkdf': {
    title: 'Forward Secrecy & Key Derivation (HKDF)',
    category: 'Security & Encryption',
    categoryIcon: '🔐',
    categoryColor: '#f87171',
    readTime: '10 min read',
    content: `
<p>Forward secrecy is one of the most important properties of CGraph's encryption system. It ensures that even if long-term keys are compromised, past communications remain secure.</p>

<h3>How Forward Secrecy Works</h3>
<p>In the Triple Ratchet protocol:</p>
<ul>
  <li>Each message uses a <strong>unique message key</strong> derived from the chain key</li>
  <li>After deriving a message key, the chain key is advanced (one-way ratchet)</li>
  <li>Old chain keys and message keys are immediately deleted</li>
  <li>This means compromising a current key cannot recover previous keys</li>
</ul>

<h3>HKDF (HMAC-based Key Derivation Function)</h3>
<p>HKDF-SHA256 is used throughout the protocol for key derivation:</p>
<ol>
  <li><strong>Extract phase</strong> — Condenses input key material into a pseudorandom key using HMAC</li>
  <li><strong>Expand phase</strong> — Generates output key material of arbitrary length</li>
</ol>
<p>HKDF is used to derive:</p>
<ul>
  <li>Root keys from PQXDH hybrid shared secrets</li>
  <li>Chain keys from DH ratchet outputs</li>
  <li>Message keys from chain keys</li>
  <li>Encryption key + IV + authentication key from message keys</li>
</ul>

<h3>Key Deletion Policy</h3>
<p>CGraph aggressively deletes keys that are no longer needed:</p>
<ul>
  <li>One-time prekeys are deleted immediately after use</li>
  <li>Message keys are deleted after decryption</li>
  <li>Old chain keys are deleted when the ratchet advances</li>
  <li>The only long-lived key is the identity key pair</li>
</ul>
`,
  },
  'device-verification-safety-numbers': {
    title: 'Device Verification & Safety Numbers',
    category: 'Security & Encryption',
    categoryIcon: '🔐',
    categoryColor: '#f87171',
    readTime: '6 min read',
    content: `
<p>Safety numbers (also called security codes) allow you to verify that your encrypted conversations haven't been intercepted by a man-in-the-middle attack.</p>

<h3>How Safety Numbers Work</h3>
<ol>
  <li>Each user has a unique <strong>identity key</strong> (Ed25519 public key)</li>
  <li>A safety number is derived from both parties' identity keys</li>
  <li>If either party's identity key changes, the safety number changes</li>
  <li>Users can compare safety numbers in person (QR code) or out-of-band</li>
</ol>

<h3>Verification Methods</h3>
<table>
  <thead><tr><th>Method</th><th>How</th><th>Security Level</th></tr></thead>
  <tbody>
    <tr><td><strong>QR Code Scan</strong></td><td>Scan partner's QR code in person</td><td>Highest</td></tr>
    <tr><td><strong>Number Comparison</strong></td><td>Read/compare 60-digit safety number</td><td>High</td></tr>
    <tr><td><strong>Fingerprint</strong></td><td>Compare key fingerprints via trusted channel</td><td>High</td></tr>
  </tbody>
</table>

<h3>Key Change Notifications</h3>
<p>When a contact's identity key changes (e.g., they reinstalled the app), CGraph will:</p>
<ul>
  <li>Show a warning banner in the conversation</li>
  <li>Display the new safety number</li>
  <li>Require manual acknowledgment before sending new messages</li>
  <li>Mark the contact as "unverified" until re-verified</li>
</ul>
`,
  },
  'security-headers-csp-hsts-cors': {
    title: 'Security Headers: CSP, HSTS, CORS',
    category: 'Security & Encryption',
    categoryIcon: '🔐',
    categoryColor: '#f87171',
    readTime: '8 min read',
    content: `
<p>CGraph implements comprehensive HTTP security headers to protect against common web attacks.</p>

<h3>Security Header Configuration</h3>
<table>
  <thead><tr><th>Header</th><th>Value</th><th>Protection</th></tr></thead>
  <tbody>
    <tr><td><strong>Content-Security-Policy</strong></td><td>Strict script-src, connect-src whitelist</td><td>XSS prevention</td></tr>
    <tr><td><strong>Strict-Transport-Security</strong></td><td>max-age=63072000; includeSubDomains; preload</td><td>Forces HTTPS</td></tr>
    <tr><td><strong>X-Content-Type-Options</strong></td><td>nosniff</td><td>MIME type sniffing prevention</td></tr>
    <tr><td><strong>X-Frame-Options</strong></td><td>DENY</td><td>Clickjacking prevention</td></tr>
    <tr><td><strong>Referrer-Policy</strong></td><td>strict-origin-when-cross-origin</td><td>Referrer leakage prevention</td></tr>
    <tr><td><strong>Permissions-Policy</strong></td><td>camera=self, microphone=self, geolocation=()</td><td>Feature restriction</td></tr>
  </tbody>
</table>

<h3>CORS Configuration</h3>
<p>Cross-Origin Resource Sharing is configured to allow only trusted origins:</p>
<ul>
  <li><strong>Allowed origins</strong>: cgraph.org, web.cgraph.org, app.cgraph.org</li>
  <li><strong>Allowed methods</strong>: GET, POST, PUT, PATCH, DELETE, OPTIONS</li>
  <li><strong>Credentials</strong>: Included for authenticated requests</li>
  <li><strong>Max age</strong>: 86400 seconds (24 hours) for preflight caching</li>
</ul>

<h3>Additional Security Measures</h3>
<ul>
  <li><strong>Rate limiting</strong> — Per-IP and per-user rate limits on all endpoints</li>
  <li><strong>Input validation</strong> — All inputs sanitized with Ecto changesets</li>
  <li><strong>SQL injection</strong> — Parameterized queries via Ecto (never raw SQL)</li>
  <li><strong>CSRF protection</strong> — Token-based protection on state-changing requests</li>
</ul>
`,
  },
  'reporting-vulnerabilities': {
    title: 'Reporting Vulnerabilities',
    category: 'Security & Encryption',
    categoryIcon: '🔐',
    categoryColor: '#f87171',
    readTime: '3 min read',
    content: `
<p>CGraph maintains a responsible disclosure program for security researchers.</p>

<h3>How to Report</h3>
<ol>
  <li>Email <strong>security@cgraph.org</strong> with details of the vulnerability</li>
  <li>Include steps to reproduce, impact assessment, and any proof-of-concept</li>
  <li>We will acknowledge receipt within 24 hours</li>
  <li>We will provide an initial assessment within 72 hours</li>
</ol>

<h3>Scope</h3>
<p>In scope for our bug bounty program:</p>
<ul>
  <li>Authentication and authorization bypasses</li>
  <li>E2EE implementation flaws</li>
  <li>Remote code execution</li>
  <li>SQL injection, XSS, CSRF</li>
  <li>Data exposure or leakage</li>
  <li>Privilege escalation</li>
</ul>

<h3>Rules</h3>
<ul>
  <li>Do not access, modify, or delete other users' data</li>
  <li>Do not perform denial-of-service attacks</li>
  <li>Report vulnerabilities before disclosing publicly</li>
  <li>Allow reasonable time for us to fix the issue</li>
</ul>

<h3>Recognition</h3>
<p>We maintain a Security Hall of Fame and offer monetary rewards based on severity. Critical vulnerabilities affecting E2EE are eligible for our highest reward tier.</p>
`,
  },
  'xp-levels-how-progression-works': {
    title: 'XP, Levels & How Progression Works',
    category: 'Gamification & Rewards',
    categoryIcon: '🎮',
    categoryColor: '#fbbf24',
    readTime: '6 min read',
    content: `
<p>CGraph's gamification system adds RPG-style progression to community participation, rewarding active and helpful members.</p>

<h3>XP Sources</h3>
<table>
  <thead><tr><th>Action</th><th>XP Reward</th><th>Cooldown</th></tr></thead>
  <tbody>
    <tr><td>Send a message</td><td>10 XP</td><td>1 per minute</td></tr>
    <tr><td>Create a forum post</td><td>25 XP</td><td>5 per hour</td></tr>
    <tr><td>Receive an upvote</td><td>15 XP</td><td>None</td></tr>
    <tr><td>Complete daily quest</td><td>50-200 XP</td><td>Daily reset</td></tr>
    <tr><td>Complete weekly quest</td><td>200-500 XP</td><td>Weekly reset</td></tr>
    <tr><td>Unlock achievement</td><td>100-1000 XP</td><td>One-time</td></tr>
    <tr><td>Voice call participation</td><td>5 XP/min</td><td>Max 100/session</td></tr>
  </tbody>
</table>

<h3>Level Curve</h3>
<p>Leveling uses a polynomial curve: <code>XP needed = 100 × level^1.5</code>. This means early levels are fast (encouraging new users) while higher levels require sustained engagement.</p>

<h3>Level Rewards</h3>
<ul>
  <li>Custom profile borders and badges at milestone levels</li>
  <li>Unlock server creation permissions at level 5</li>
  <li>Custom emoji slots at level 10</li>
  <li>Bonus file upload size at level 20</li>
  <li>Special animated avatar effects at level 50</li>
</ul>
`,
  },
  '30-achievements-across-6-categories': {
    title: '30+ Achievements Across 6 Categories',
    category: 'Gamification & Rewards',
    categoryIcon: '🎮',
    categoryColor: '#fbbf24',
    readTime: '8 min read',
    content: `
<p>CGraph features over 30 achievements across 6 categories, each with bronze, silver, gold, and platinum tiers.</p>

<h3>Achievement Categories</h3>
<table>
  <thead><tr><th>Category</th><th>Icon</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td><strong>Social</strong></td><td>Chat</td><td>First Message, Conversation Starter, Community Builder</td></tr>
    <tr><td><strong>Forum</strong></td><td>Forum</td><td>Thread Creator, Popular Post, Karma King</td></tr>
    <tr><td><strong>Security</strong></td><td>Secure</td><td>Key Exchange, Verified Contact, 2FA Enabled</td></tr>
    <tr><td><strong>Voice</strong></td><td>Voice</td><td>First Call, Group Caller, Screen Sharer</td></tr>
    <tr><td><strong>Community</strong></td><td>Home</td><td>Server Creator, Event Host, Helper</td></tr>
    <tr><td><strong>Loyalty</strong></td><td>Star</td><td>7-Day Streak, Monthly Active, Veteran</td></tr>
  </tbody>
</table>

<h3>Achievement Tiers</h3>
<ul>
  <li><strong>Bronze</strong> — Basic milestone (e.g., send 10 messages)</li>
  <li><strong>Silver</strong> — Intermediate (e.g., send 100 messages)</li>
  <li><strong>Gold</strong> — Advanced (e.g., send 1,000 messages)</li>
  <li><strong>Platinum</strong> — Elite (e.g., send 10,000 messages)</li>
</ul>

<h3>Achievement Notifications</h3>
<p>When you unlock an achievement, you receive an animated notification with a sound effect. Achievements are displayed on your profile and contribute XP toward your level progression.</p>
`,
  },
  'daily-weekly-quests': {
    title: 'Daily & Weekly Quests',
    category: 'Gamification & Rewards',
    categoryIcon: '🎮',
    categoryColor: '#fbbf24',
    readTime: '4 min read',
    content: `
<p>Quests provide daily and weekly goals that encourage engagement and reward consistent participation.</p>

<h3>Daily Quests (Reset at 00:00 UTC)</h3>
<ul>
  <li><strong>Daily Check-in</strong> — Open the app (+50 XP)</li>
  <li><strong>Messenger</strong> — Send 5 messages (+75 XP)</li>
  <li><strong>Social Butterfly</strong> — React to 3 messages (+50 XP)</li>
  <li><strong>Forum Contributor</strong> — Create or comment on a post (+100 XP)</li>
  <li><strong>Voice Active</strong> — Spend 10 minutes in voice (+75 XP)</li>
</ul>

<h3>Weekly Quests (Reset Monday 00:00 UTC)</h3>
<ul>
  <li><strong>Community Champion</strong> — Send 50 messages across different channels (+300 XP)</li>
  <li><strong>Thread Master</strong> — Create 3 forum threads (+250 XP)</li>
  <li><strong>Helpful Hand</strong> — Receive 10 upvotes on forum posts (+400 XP)</li>
  <li><strong>Voice Leader</strong> — Host a group call with 3+ participants (+500 XP)</li>
</ul>

<h3>Quest Completion Bonus</h3>
<p>Completing all daily quests grants a <strong>bonus chest</strong> with random rewards. Completing all weekly quests grants a <strong>premium chest</strong> with guaranteed rare items for the virtual marketplace.</p>
`,
  },
  'streak-system-multipliers': {
    title: 'Streak System & Multipliers',
    category: 'Gamification & Rewards',
    categoryIcon: '🎮',
    categoryColor: '#fbbf24',
    readTime: '3 min read',
    content: `
<p>The streak system rewards consistent daily activity with XP multipliers.</p>

<h3>How Streaks Work</h3>
<ul>
  <li>Log in and complete at least one quest per day to maintain your streak</li>
  <li>Streak counter resets if you miss a day (grace period: 1 day for premium users)</li>
  <li>Visual flame indicator grows with longer streaks</li>
</ul>

<h3>XP Multipliers</h3>
<table>
  <thead><tr><th>Streak Length</th><th>XP Multiplier</th><th>Badge</th></tr></thead>
  <tbody>
    <tr><td>3 days</td><td>1.25x</td><td>Warm</td></tr>
    <tr><td>7 days</td><td>1.5x</td><td>Hot</td></tr>
    <tr><td>14 days</td><td>1.75x</td><td>Blazing</td></tr>
    <tr><td>30 days</td><td>2.0x</td><td>Legendary</td></tr>
    <tr><td>100 days</td><td>2.5x</td><td>Unstoppable</td></tr>
  </tbody>
</table>
`,
  },
  'virtual-currency-marketplace': {
    title: 'Virtual Currency & Marketplace',
    category: 'Gamification & Rewards',
    categoryIcon: '🎮',
    categoryColor: '#fbbf24',
    readTime: '5 min read',
    content: `
<p>CGraph features a virtual economy with earned currency and a marketplace for cosmetic items.</p>

<h3>CGraph Coins</h3>
<ul>
  <li>Earned through quests, achievements, and level-ups</li>
  <li>Cannot be purchased with real money (earned only)</li>
  <li>Used to buy cosmetic items in the marketplace</li>
  <li>Premium subscribers earn coins at 2x rate</li>
</ul>

<h3>Marketplace Items</h3>
<table>
  <thead><tr><th>Category</th><th>Examples</th><th>Price Range</th></tr></thead>
  <tbody>
    <tr><td><strong>Profile Borders</strong></td><td>Animated frames, seasonal themes</td><td>100-500 coins</td></tr>
    <tr><td><strong>Badges</strong></td><td>Custom badges, rare collectibles</td><td>200-1000 coins</td></tr>
    <tr><td><strong>Chat Effects</strong></td><td>Message animations, special fonts</td><td>150-750 coins</td></tr>
    <tr><td><strong>Themes</strong></td><td>Exclusive color themes and backgrounds</td><td>300-1000 coins</td></tr>
  </tbody>
</table>
`,
  },
  'leaderboards-seasonal-events': {
    title: 'Leaderboards & Seasonal Events',
    category: 'Gamification & Rewards',
    categoryIcon: '🎮',
    categoryColor: '#fbbf24',
    readTime: '5 min read',
    content: `
<p>Compete with your community and participate in limited-time events.</p>

<h3>Leaderboard Types</h3>
<ul>
  <li><strong>Global</strong> — Top users across all of CGraph</li>
  <li><strong>Server</strong> — Rankings within your server</li>
  <li><strong>Weekly</strong> — Resets every Monday, rewards top performers</li>
  <li><strong>Category</strong> — Separate boards for messaging, forums, voice, etc.</li>
</ul>

<h3>Seasonal Events</h3>
<p>Limited-time events with exclusive rewards:</p>
<ul>
  <li>Themed quests and challenges</li>
  <li>Exclusive cosmetic rewards (not available after event)</li>
  <li>Double XP weekends</li>
  <li>Community-wide goals with shared rewards</li>
  <li>Seasonal leaderboard with top-100 prizes</li>
</ul>
`,
  },
  'authentication-jwt-bearer-tokens': {
    title: 'Authentication: JWT Bearer Tokens',
    category: 'REST API Reference',
    categoryIcon: '📡',
    categoryColor: '#2dd4bf',
    readTime: '10 min read',
    content: `
<p>CGraph's API uses JWT (JSON Web Tokens) for authentication with a dual-token system.</p>

<h3>Token Types</h3>
<table>
  <thead><tr><th>Token</th><th>Lifetime</th><th>Storage</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><strong>Access Token</strong></td><td>15 minutes</td><td>Memory only</td><td>API request authentication</td></tr>
    <tr><td><strong>Refresh Token</strong></td><td>7 days</td><td>HttpOnly cookie</td><td>Access token renewal</td></tr>
  </tbody>
</table>

<h3>Authentication Flow</h3>
<ol>
  <li><code>POST /api/v1/auth/login</code> — Send credentials, receive access + refresh tokens</li>
  <li>Include access token in Authorization header: <code>Bearer &lt;token&gt;</code></li>
  <li>When access token expires, call <code>POST /api/v1/auth/refresh</code></li>
  <li>Refresh token is rotated on each use (old token is invalidated)</li>
</ol>

<h3>Token Security</h3>
<ul>
  <li>Access tokens are JWT signed with HS256</li>
  <li>Refresh tokens use secure, HttpOnly, SameSite=Strict cookies</li>
  <li>Refresh token rotation prevents token replay attacks</li>
  <li>Rate limit: 5 auth attempts per 15 minutes per IP</li>
  <li>Account lockout after 10 failed attempts (30 minute cooldown)</li>
</ul>
`,
  },
  'users-servers-channels-api': {
    title: 'Users, Servers & Channels API',
    category: 'REST API Reference',
    categoryIcon: '📡',
    categoryColor: '#2dd4bf',
    readTime: '12 min read',
    content: `
<p>Core CRUD endpoints for managing users, servers, and channels.</p>

<h3>Users API</h3>
<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><strong>GET</strong></td><td>/api/v1/users/me</td><td>Get authenticated user profile</td></tr>
    <tr><td><strong>PATCH</strong></td><td>/api/v1/users/me</td><td>Update profile (display name, bio, avatar)</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/users/:id/profile</td><td>Get public profile of another user</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/users/me/servers</td><td>List servers the user belongs to</td></tr>
    <tr><td><strong>DELETE</strong></td><td>/api/v1/users/me</td><td>Delete account and all data</td></tr>
  </tbody>
</table>

<h3>Servers API</h3>
<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><strong>GET</strong></td><td>/api/v1/servers</td><td>List user's servers</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/servers</td><td>Create a new server</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/servers/:id</td><td>Get server details</td></tr>
    <tr><td><strong>PATCH</strong></td><td>/api/v1/servers/:id</td><td>Update server settings</td></tr>
    <tr><td><strong>DELETE</strong></td><td>/api/v1/servers/:id</td><td>Delete server (owner only)</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/servers/:id/channels</td><td>List server channels</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/servers/:id/channels</td><td>Create channel in server</td></tr>
  </tbody>
</table>

<h3>Pagination</h3>
<p>All list endpoints use cursor-based pagination (never offset). Responses include:</p>
<ul>
  <li><code>data</code> — Array of items</li>
  <li><code>cursor</code> — Opaque cursor for next page</li>
  <li><code>has_more</code> — Boolean indicating more results</li>
</ul>
`,
  },
  'messages-api-paginated-cursor-based': {
    title: 'Messages API (Paginated, Cursor-Based)',
    category: 'REST API Reference',
    categoryIcon: '📡',
    categoryColor: '#2dd4bf',
    readTime: '8 min read',
    content: `
<p>The Messages API provides full CRUD operations on messages with cursor-based pagination.</p>

<h3>Endpoints</h3>
<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><strong>GET</strong></td><td>/api/v1/channels/:id/messages</td><td>List channel messages (paginated)</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/channels/:id/messages</td><td>Send a message to a channel</td></tr>
    <tr><td><strong>PATCH</strong></td><td>/api/v1/messages/:id</td><td>Edit a message (author only)</td></tr>
    <tr><td><strong>DELETE</strong></td><td>/api/v1/messages/:id</td><td>Delete a message</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/messages/:id/reactions</td><td>Add reaction to message</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/dms</td><td>List DM conversations</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/dms/:id/messages</td><td>Send DM (E2EE)</td></tr>
  </tbody>
</table>

<h3>Query Parameters</h3>
<ul>
  <li><code>cursor</code> — Pagination cursor from previous response</li>
  <li><code>limit</code> — Number of messages (default: 50, max: 100)</li>
  <li><code>before</code> — Get messages before this message ID</li>
  <li><code>after</code> — Get messages after this message ID</li>
</ul>

<h3>Rate Limits</h3>
<p>Message sending is rate-limited to 60 messages per minute per user. Burst allowance of 10 messages in 5 seconds for quick conversations. Rate limit headers are included in all responses.</p>
`,
  },
  'e2ee-key-exchange-endpoints': {
    title: 'E2EE Key Exchange Endpoints',
    category: 'REST API Reference',
    categoryIcon: '📡',
    categoryColor: '#2dd4bf',
    readTime: '10 min read',
    content: `
<p>API endpoints for managing E2EE encryption keys and establishing encrypted sessions.</p>

<h3>Key Management</h3>
<table>
  <thead><tr><th>Method</th><th>Endpoint</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><strong>POST</strong></td><td>/api/v1/e2ee/keys/upload</td><td>Upload identity key, signed prekey, one-time prekeys</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/e2ee/keys/:user_id</td><td>Fetch user's prekey bundle for session establishment</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/e2ee/sessions</td><td>Create an encrypted session with a user</td></tr>
    <tr><td><strong>GET</strong></td><td>/api/v1/e2ee/keys/count</td><td>Check remaining one-time prekeys</td></tr>
    <tr><td><strong>POST</strong></td><td>/api/v1/e2ee/keys/replenish</td><td>Upload additional one-time prekeys</td></tr>
  </tbody>
</table>

<h3>Prekey Bundle Response</h3>
<p>When fetching a user's prekey bundle, the response contains:</p>
<ul>
  <li><code>identity_key</code> — User's long-term identity public key (Ed25519)</li>
  <li><code>signed_prekey</code> — Regularly rotated prekey with signature</li>
  <li><code>signed_prekey_signature</code> — Ed25519 signature over the signed prekey</li>
  <li><code>one_time_prekey</code> — Single-use prekey (consumed after fetch)</li>
</ul>

<h3>Key Replenishment</h3>
<p>Clients should check their one-time prekey count regularly and replenish when it falls below 10. The server will not include a one-time prekey in the bundle if none are available (the protocol still works but with slightly reduced security).</p>
`,
  },
  'websocket-api-real-time-events': {
    title: 'WebSocket API & Real-Time Events',
    category: 'REST API Reference',
    categoryIcon: '📡',
    categoryColor: '#2dd4bf',
    readTime: '15 min read',
    content: `
<p>CGraph uses Phoenix Channels over WebSocket for all real-time communication.</p>

<h3>Connection</h3>
<p>Connect to: <code>wss://api.cgraph.org/socket?token=&lt;access_token&gt;</code></p>

<h3>Channel Topics</h3>
<table>
  <thead><tr><th>Topic</th><th>Description</th><th>Events</th></tr></thead>
  <tbody>
    <tr><td><code>channel:&lt;id&gt;</code></td><td>Server channel</td><td>message:new, message:edit, message:delete, typing:start</td></tr>
    <tr><td><code>dm:&lt;id&gt;</code></td><td>Direct message</td><td>message:new, message:edit, read:update</td></tr>
    <tr><td><code>presence:&lt;server_id&gt;</code></td><td>Presence tracking</td><td>presence:update, presence:diff</td></tr>
    <tr><td><code>user:&lt;id&gt;</code></td><td>User-specific</td><td>notification:new, friend:request</td></tr>
  </tbody>
</table>

<h3>Key Events</h3>
<ul>
  <li><code>message:new</code> — New message in channel/DM (includes encrypted payload for E2EE)</li>
  <li><code>typing:start</code> / <code>typing:stop</code> — Typing indicator events</li>
  <li><code>presence:update</code> — User online/offline/idle status changes</li>
  <li><code>notification:new</code> — Push notification for mentions, DMs, etc.</li>
  <li><code>channel:join</code> / <code>channel:leave</code> — Voice channel participation</li>
</ul>

<h3>Heartbeat</h3>
<p>Clients must send a heartbeat every 30 seconds to maintain the connection. Phoenix Channels handles this automatically with the client library.</p>
`,
  },
  'rate-limits-error-codes': {
    title: 'Rate Limits & Error Codes',
    category: 'REST API Reference',
    categoryIcon: '📡',
    categoryColor: '#2dd4bf',
    readTime: '5 min read',
    content: `
<p>Comprehensive rate limiting and error handling documentation.</p>

<h3>Rate Limits</h3>
<table>
  <thead><tr><th>Endpoint Category</th><th>Limit</th><th>Window</th></tr></thead>
  <tbody>
    <tr><td>General API</td><td>300 requests</td><td>1 minute</td></tr>
    <tr><td>Message sending</td><td>60 messages</td><td>1 minute</td></tr>
    <tr><td>Authentication</td><td>5 attempts</td><td>15 minutes</td></tr>
    <tr><td>File upload</td><td>10 files</td><td>1 minute</td></tr>
    <tr><td>Server creation</td><td>5 servers</td><td>1 hour</td></tr>
  </tbody>
</table>

<h3>Rate Limit Headers</h3>
<ul>
  <li><code>X-RateLimit-Limit</code> — Maximum requests allowed</li>
  <li><code>X-RateLimit-Remaining</code> — Remaining requests in window</li>
  <li><code>X-RateLimit-Reset</code> — Unix timestamp when window resets</li>
  <li><code>Retry-After</code> — Seconds to wait (on 429 responses)</li>
</ul>

<h3>Error Format</h3>
<p>All errors follow a consistent JSON format:</p>
<ul>
  <li><code>400</code> — Bad Request (validation errors)</li>
  <li><code>401</code> — Unauthorized (invalid/expired token)</li>
  <li><code>403</code> — Forbidden (insufficient permissions)</li>
  <li><code>404</code> — Not Found</li>
  <li><code>429</code> — Too Many Requests (rate limited)</li>
  <li><code>500</code> — Internal Server Error</li>
</ul>
`,
  },
  'monorepo-pnpm-workspaces-turborepo': {
    title: 'Monorepo: pnpm Workspaces + Turborepo',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '8 min read',
    content: `
<p>CGraph uses a monorepo architecture with pnpm workspaces for package management and Turborepo for build orchestration.</p>

<h3>Repository Structure</h3>
<ul>
  <li><code>apps/web</code> — Main web application (React 19, TypeScript 5.8, Vite 6.3)</li>
  <li><code>apps/landing</code> — Marketing site (cgraph.org)</li>
  <li><code>apps/mobile</code> — React Native app (Expo SDK 54)</li>
  <li><code>apps/backend</code> — Elixir/Phoenix API server</li>
  <li><code>packages/*</code> — 12 shared packages (ui, hooks, state, crypto, etc.)</li>
</ul>

<h3>Shared Packages</h3>
<table>
  <thead><tr><th>Package</th><th>Purpose</th><th>Used By</th></tr></thead>
  <tbody>
    <tr><td><strong>@cgraph/ui</strong></td><td>90+ shared UI components</td><td>Web, Mobile</td></tr>
    <tr><td><strong>@cgraph/hooks</strong></td><td>7 facade hooks</td><td>Web, Mobile</td></tr>
    <tr><td><strong>@cgraph/state</strong></td><td>Zustand stores</td><td>Web, Mobile</td></tr>
    <tr><td><strong>@cgraph/crypto</strong></td><td>E2EE Triple Ratchet / PQXDH</td><td>Web, Mobile</td></tr>
    <tr><td><strong>@cgraph/socket</strong></td><td>WebSocket client</td><td>Web, Mobile</td></tr>
    <tr><td><strong>@cgraph/api-client</strong></td><td>API client with types</td><td>Web, Mobile</td></tr>
  </tbody>
</table>

<h3>Turborepo Pipeline</h3>
<p>Turborepo manages the build pipeline with:</p>
<ul>
  <li>Incremental builds (only rebuild what changed)</li>
  <li>Remote caching for CI/CD</li>
  <li>Dependency-aware task scheduling</li>
  <li>Parallel execution where possible</li>
</ul>
`,
  },
  'dual-app-architecture-landing-vs-web-app': {
    title: 'Dual-App Architecture (Landing vs Web App)',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '10 min read',
    content: `
<p>CGraph separates the marketing site from the application for optimal performance and maintainability.</p>

<h3>Two Applications</h3>
<table>
  <thead><tr><th>Property</th><th>Landing (cgraph.org)</th><th>Web App (web.cgraph.org)</th></tr></thead>
  <tbody>
    <tr><td><strong>Bundle Size</strong></td><td>~200KB</td><td>~2MB</td></tr>
    <tr><td><strong>Pages</strong></td><td>~15 marketing pages</td><td>62 lazy-loaded pages</td></tr>
    <tr><td><strong>Build Chunks</strong></td><td>~20</td><td>168</td></tr>
    <tr><td><strong>Auth Required</strong></td><td>No</td><td>Yes</td></tr>
    <tr><td><strong>SEO</strong></td><td>Full (marketing content)</td><td>Minimal (app shell)</td></tr>
    <tr><td><strong>Hosting</strong></td><td>Vercel</td><td>Vercel</td></tr>
  </tbody>
</table>

<h3>Why Separate?</h3>
<ul>
  <li><strong>Performance</strong> — Landing page loads instantly without app code overhead</li>
  <li><strong>SEO</strong> — Marketing pages are fully crawlable without JavaScript app complexity</li>
  <li><strong>Independence</strong> — Teams can deploy landing changes without affecting the app</li>
  <li><strong>Security</strong> — App code and auth logic aren't exposed on public marketing pages</li>
</ul>

<h3>Routing</h3>
<p>Auth routes on cgraph.org (e.g., /login, /register) redirect to web.cgraph.org via Vercel rewrites, so users don’t notice the split.</p>
`,
  },
  '12-feature-modules-7-facade-hooks': {
    title: '12 Feature Modules & 7 Facade Hooks',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '12 min read',
    content: `
<p>CGraph's frontend follows a modular architecture with clean separation of concerns.</p>

<h3>12 Feature Modules</h3>
<table>
  <thead><tr><th>#</th><th>Module</th><th>Responsibility</th></tr></thead>
  <tbody>
    <tr><td>1</td><td><strong>Auth</strong></td><td>Authentication, registration, session management</td></tr>
    <tr><td>2</td><td><strong>Chat</strong></td><td>Real-time messaging, typing indicators, reactions</td></tr>
    <tr><td>3</td><td><strong>Voice</strong></td><td>WebRTC calls, screen sharing</td></tr>
    <tr><td>4</td><td><strong>Forums</strong></td><td>Threaded discussions, voting, moderation</td></tr>
    <tr><td>5</td><td><strong>Servers</strong></td><td>Server management, channels, roles</td></tr>
    <tr><td>6</td><td><strong>DMs</strong></td><td>Direct messages, E2EE</td></tr>
    <tr><td>7</td><td><strong>Gamification</strong></td><td>XP, achievements, quests, leaderboards</td></tr>
    <tr><td>8</td><td><strong>Marketplace</strong></td><td>Virtual currency, item shop</td></tr>
    <tr><td>9</td><td><strong>Settings</strong></td><td>User preferences, privacy, security settings</td></tr>
    <tr><td>10</td><td><strong>Notifications</strong></td><td>Push notifications, in-app alerts</td></tr>
    <tr><td>11</td><td><strong>Search</strong></td><td>Full-text search across messages and forums</td></tr>
    <tr><td>12</td><td><strong>Admin</strong></td><td>Server administration, moderation tools</td></tr>
  </tbody>
</table>

<h3>7 Facade Hooks</h3>
<p>Facades abstract 32 Zustand stores into 7 clean hooks:</p>
<ul>
  <li><code>useAuth()</code> — Login state, tokens, user profile</li>
  <li><code>useChat()</code> — Messages, channels, typing, reactions</li>
  <li><code>useGamification()</code> — XP, level, achievements, quests</li>
  <li><code>useSettings()</code> — Theme, language, notification prefs</li>
  <li><code>useCommunity()</code> — Servers, members, roles, forums</li>
  <li><code>useMarketplace()</code> — Currency, inventory, shop items</li>
  <li><code>useUI()</code> — Modals, toasts, sidebar state, navigation</li>
</ul>
`,
  },
  'backend-sub-module-architecture-defdelegate-pattern': {
    title: 'Backend Sub-module Architecture & Defdelegate Pattern',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '10 min read',
    content: `
<p>As of v0.9.25, CGraph enforces a strict <strong>500-line limit</strong> on all backend Elixir modules. Modules that exceed this limit are refactored using the <strong>sub-module + defdelegate pattern</strong> — business logic moves into focused sub-modules under the parent namespace, while the parent retains its public API via <code>defdelegate</code> calls.</p>

<h3>The Pattern</h3>
<p>Consider a module <code>Cgraph.Notifications</code> that grew to 680 lines. Instead of one monolithic file, it becomes:</p>

<pre><code>lib/cgraph/notifications.ex          # 312 lines — public API + defdelegate
lib/cgraph/notifications/delivery.ex  # ~120 lines — push, email, in-app delivery
lib/cgraph/notifications/preferences.ex # ~110 lines — user prefs, muting, schedules
lib/cgraph/notifications/templates.ex  # ~100 lines — notification templates, formatting
</code></pre>

<p>The parent module's public API stays identical:</p>

<pre><code>defmodule Cgraph.Notifications do
  alias Cgraph.Notifications.{Delivery, Preferences, Templates}

  defdelegate send_push(user, payload), to: Delivery
  defdelegate get_preferences(user_id), to: Preferences
  defdelegate render_template(type, assigns), to: Templates
  # ... all existing public functions remain callable
end
</code></pre>

<h3>Refactored Modules</h3>
<table>
  <thead><tr><th>Module</th><th>Before</th><th>After</th><th>Sub-modules</th></tr></thead>
  <tbody>
    <tr><td><strong>CgraphWeb.GroupChannel</strong></td><td>892 lines</td><td>285 lines</td><td>MessageHandler, ReactionHandler, TypingHandler, PinHandler</td></tr>
    <tr><td><strong>Cgraph.Notifications</strong></td><td>680 lines</td><td>312 lines</td><td>Delivery, Preferences, Templates</td></tr>
    <tr><td><strong>Cgraph.Audit</strong></td><td>620 lines</td><td>289 lines</td><td>Logger, QueryBuilder, Retention</td></tr>
    <tr><td><strong>Cgraph.Uploads</strong></td><td>590 lines</td><td>276 lines</td><td>Processor, Storage, Validator</td></tr>
    <tr><td><strong>Cgraph.Admin</strong></td><td>575 lines</td><td>298 lines</td><td>Reports, UserManagement, ServerManagement</td></tr>
    <tr><td><strong>Cgraph.TierLimits</strong></td><td>560 lines</td><td>267 lines</td><td>Calculator, Enforcer, FeatureGates</td></tr>
    <tr><td><strong>Cgraph.Friends</strong></td><td>545 lines</td><td>254 lines</td><td>Requests, Blocking, Suggestions</td></tr>
    <tr><td><strong>Cgraph.Events</strong></td><td>530 lines</td><td>241 lines</td><td>Scheduler, RSVP, Reminders</td></tr>
  </tbody>
</table>

<p>Total: <strong>4,992 lines refactored</strong> into 26 focused sub-modules averaging ~115 lines each.</p>

<h3>Benefits</h3>
<ul>
  <li><strong>Zero breaking changes</strong> — All callers continue using the parent module's API</li>
  <li><strong>Focused files</strong> — Each sub-module handles exactly one responsibility</li>
  <li><strong>Better compilation</strong> — Elixir only recompiles changed sub-modules</li>
  <li><strong>Easier testing</strong> — Sub-modules can be unit tested in isolation</li>
  <li><strong>Clear ownership</strong> — Smaller files are easier to review and maintain</li>
</ul>

<h3>Frontend Equivalent</h3>
<p>On the frontend, over-sized React components (&gt;300 lines) are split using <strong>component extraction + custom hooks</strong>. The same principle applies: the parent component coordinates, child components handle specific UI concerns, and hooks encapsulate shared state/logic.</p>

<h3>Enforcement</h3>
<p>The line limits are enforced in CI via a script that counts non-comment, non-blank lines. Any module or component that exceeds its limit will fail the build. The current score: <strong>0 / 63 backend modules</strong> and <strong>0 / 47 frontend components</strong> over limit.</p>
`,
  },
  '3-tier-caching-ets-cachex-redis': {
    title: '3-Tier Caching: ETS → Cachex → Redis',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '10 min read',
    content: `
<p>CGraph's backend uses a three-tier caching strategy for optimal performance.</p>

<h3>Cache Tiers</h3>
<table>
  <thead><tr><th>Tier</th><th>Technology</th><th>Latency</th><th>Scope</th><th>Use Case</th></tr></thead>
  <tbody>
    <tr><td><strong>L1</strong></td><td>ETS (Erlang Term Storage)</td><td>&lt;1μs</td><td>Per-node</td><td>Hot data, session state</td></tr>
    <tr><td><strong>L2</strong></td><td>Cachex</td><td>~10μs</td><td>Per-node with TTL</td><td>User profiles, permissions</td></tr>
    <tr><td><strong>L3</strong></td><td>Redis</td><td>~1ms</td><td>Shared across nodes</td><td>Distributed data, rate limits</td></tr>
  </tbody>
</table>

<h3>Cache Flow</h3>
<ol>
  <li>Check L1 (ETS) — Instant, in-process memory lookup</li>
  <li>If miss, check L2 (Cachex) — Process-level cache with TTL and eviction</li>
  <li>If miss, check L3 (Redis) — Network call to shared cache</li>
  <li>If miss, query PostgreSQL — Database query with result cached back through tiers</li>
</ol>

<h3>Cache Invalidation</h3>
<p>CGraph uses a combination of TTL-based and event-driven cache invalidation:</p>
<ul>
  <li>Short TTLs for frequently changing data (presence: 30s)</li>
  <li>Longer TTLs for stable data (server settings: 5min)</li>
  <li>PubSub-based invalidation for immediate consistency needs</li>
  <li>Cache warming on node startup for critical data</li>
</ul>
`,
  },
  'phoenix-supervision-tree': {
    title: 'Phoenix Supervision Tree',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '8 min read',
    content: `
<p>CGraph’s backend uses the BEAM VM’s supervision tree for fault-tolerant, self-healing services.</p>

<h3>Top-Level Supervisors</h3>
<ul>
  <li><strong>CGraph.Application</strong> — Root supervisor</li>
  <li><strong>CGraph.Repo</strong> — PostgreSQL connection pool (Ecto)</li>
  <li><strong>CGraph.Cache</strong> — Cachex cache instances</li>
  <li><strong>CGraph.PubSub</strong> — Phoenix PubSub for real-time events</li>
  <li><strong>CGraphWeb.Endpoint</strong> — HTTP/WebSocket server</li>
  <li><strong>CGraph.Presence</strong> — Distributed presence tracking</li>
</ul>

<h3>Supervision Strategies</h3>
<table>
  <thead><tr><th>Strategy</th><th>Used For</th><th>Behavior</th></tr></thead>
  <tbody>
    <tr><td><strong>one_for_one</strong></td><td>Independent workers</td><td>Restart only the failed child</td></tr>
    <tr><td><strong>one_for_all</strong></td><td>Interdependent processes</td><td>Restart all children if one fails</td></tr>
    <tr><td><strong>rest_for_one</strong></td><td>Sequential dependencies</td><td>Restart failed child and all after it</td></tr>
  </tbody>
</table>

<h3>Self-Healing</h3>
<p>The BEAM VM's "let it crash" philosophy means individual process failures don't bring down the system. If a WebSocket connection handler crashes, only that one connection is affected — it's automatically restarted and the client reconnects transparently.</p>
`,
  },
  'socket-architecture-channel-modules': {
    title: 'Socket Architecture & Channel Modules',
    category: 'Architecture & Design',
    categoryIcon: '🏗️',
    categoryColor: '#818cf8',
    readTime: '10 min read',
    content: `
<p>CGraph's real-time features are built on Phoenix Channels, structured into dedicated channel modules.</p>

<h3>Channel Modules</h3>
<table>
  <thead><tr><th>Module</th><th>Topic Pattern</th><th>Responsibility</th></tr></thead>
  <tbody>
    <tr><td><strong>ChatChannel</strong></td><td>channel:*</td><td>Text messaging, reactions, threads</td></tr>
    <tr><td><strong>DMChannel</strong></td><td>dm:*</td><td>Direct messages, E2EE payloads</td></tr>
    <tr><td><strong>PresenceChannel</strong></td><td>presence:*</td><td>Online/offline/idle tracking</td></tr>
    <tr><td><strong>VoiceChannel</strong></td><td>voice:*</td><td>WebRTC signaling (SDP, ICE)</td></tr>
    <tr><td><strong>NotificationChannel</strong></td><td>user:*</td><td>User-specific notifications</td></tr>
  </tbody>
</table>

<h3>Connection Lifecycle</h3>
<ol>
  <li><strong>Connect</strong> — Client establishes WebSocket with JWT auth</li>
  <li><strong>Join</strong> — Client joins specific channel topics</li>
  <li><strong>Communicate</strong> — Client sends/receives events on joined topics</li>
  <li><strong>Heartbeat</strong> — 30-second heartbeat maintains connection</li>
  <li><strong>Disconnect</strong> — Graceful or crash disconnect triggers cleanup</li>
</ol>

<h3>Scaling</h3>
<p>Phoenix PubSub distributes messages across multiple BEAM nodes. When CGraph scales horizontally, PubSub ensures messages reach all subscribers regardless of which node they're connected to.</p>
`,
  },
  'react-native-081-expo-sdk-54': {
    title: 'React Native 0.81 & Expo SDK 54',
    category: 'Mobile Development',
    categoryIcon: '📱',
    categoryColor: '#f472b6',
    readTime: '6 min read',
    content: `
<p>CGraph's mobile app is built with the latest React Native and Expo ecosystem.</p>

<h3>Technology Stack</h3>
<table>
  <thead><tr><th>Technology</th><th>Version</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td>React Native</td><td>0.81</td><td>Cross-platform mobile framework</td></tr>
    <tr><td>Expo SDK</td><td>54</td><td>Build tools, native modules, OTA updates</td></tr>
    <tr><td>TypeScript</td><td>5.8</td><td>Type safety (strict mode)</td></tr>
    <tr><td>Reanimated</td><td>v4</td><td>60 FPS animations on UI thread</td></tr>
    <tr><td>Gesture Handler</td><td>v2</td><td>Native-driven gesture recognition</td></tr>
  </tbody>
</table>

<h3>Platform Support</h3>
<ul>
  <li><strong>iOS</strong> — iPhone and iPad, minimum iOS 15</li>
  <li><strong>Android</strong> — Minimum API level 24 (Android 7.0)</li>
  <li><strong>Feature parity</strong> — 17/17 features across both platforms</li>
</ul>

<h3>Build & Distribution</h3>
<ul>
  <li>EAS Build for cloud-based native builds</li>
  <li>EAS Update for over-the-air JavaScript updates</li>
  <li>TestFlight (iOS) and Internal Testing (Android) for beta</li>
</ul>
`,
  },
  'offline-support-message-queuing': {
    title: 'Offline Support & Message Queuing',
    category: 'Mobile Development',
    categoryIcon: '📱',
    categoryColor: '#f472b6',
    readTime: '8 min read',
    content: `
<p>CGraph mobile works well even with bad or no connectivity.</p>

<h3>Offline Capabilities</h3>
<ul>
  <li><strong>Message viewing</strong> — Read cached messages while offline</li>
  <li><strong>Message composing</strong> — Write and queue messages for later delivery</li>
  <li><strong>Draft saving</strong> — Drafts are saved locally and synced when online</li>
  <li><strong>Profile viewing</strong> — View cached user profiles and server info</li>
</ul>

<h3>Message Queue</h3>
<p>When offline, messages are stored in a local SQLite queue:</p>
<ol>
  <li>User sends message → saved to local queue with "pending" status</li>
  <li>App detects network connectivity → processes queue in order</li>
  <li>Each message is sent via the API → status updated to "sent"</li>
  <li>If sending fails → retries with exponential backoff</li>
</ol>

<h3>Sync Strategy</h3>
<p>On reconnection, the app syncs in this order:</p>
<ol>
  <li>Process outgoing message queue</li>
  <li>Fetch missed messages (cursor-based, since last sync)</li>
  <li>Update presence status</li>
  <li>Sync notification state</li>
</ol>
`,
  },
  'reanimated-v4-gesture-handler': {
    title: 'Reanimated v4 & Gesture Handler',
    category: 'Mobile Development',
    categoryIcon: '📱',
    categoryColor: '#f472b6',
    readTime: '7 min read',
    content: `
<p>CGraph mobile uses Reanimated v4 for butter-smooth 60 FPS animations running on the UI thread.</p>

<h3>Migration from v3 to v4</h3>
<p>We completed a full migration from Reanimated v3 to v4, resolving 222 TypeScript errors in the process:</p>
<ul>
  <li>Updated all <code>useAnimatedStyle</code> hooks to new API</li>
  <li>Migrated <code>withSpring</code> and <code>withTiming</code> configurations</li>
  <li>Updated gesture handler compositions</li>
  <li>Zero runtime animation errors after migration</li>
</ul>

<h3>Animation Patterns Used</h3>
<ul>
  <li><strong>Shared element transitions</strong> — Between screens (e.g., chat list → chat view)</li>
  <li><strong>Layout animations</strong> — Message list insertions and removals</li>
  <li><strong>Gesture-driven</strong> — Swipe to reply, swipe to delete, pull to refresh</li>
  <li><strong>Micro-interactions</strong> — Button press feedback, loading states, typing indicator</li>
</ul>

<h3>Performance</h3>
<p>All animations run on the UI thread via Reanimated's worklet system, ensuring they maintain 60 FPS even during heavy JavaScript computation.</p>
`,
  },
  'push-notifications-biometric-auth': {
    title: 'Push Notifications & Biometric Auth',
    category: 'Mobile Development',
    categoryIcon: '📱',
    categoryColor: '#f472b6',
    readTime: '5 min read',
    content: `
<p>Native mobile features for notifications and security.</p>

<h3>Push Notifications</h3>
<ul>
  <li><strong>Provider</strong> — Expo Push Notifications (APNs for iOS, FCM for Android)</li>
  <li><strong>Categories</strong> — Messages, mentions, friend requests, achievements, server invites</li>
  <li><strong>Customization</strong> — Per-server, per-channel, and per-conversation mute settings</li>
  <li><strong>Rich notifications</strong> — Inline reply, mark as read, quick actions</li>
  <li><strong>E2EE aware</strong> — Encrypted message previews show "Encrypted message" in notification</li>
</ul>

<h3>Biometric Authentication</h3>
<table>
  <thead><tr><th>Platform</th><th>Method</th><th>API</th></tr></thead>
  <tbody>
    <tr><td>iOS</td><td>Face ID / Touch ID</td><td>LocalAuthentication</td></tr>
    <tr><td>Android</td><td>Fingerprint / Face Unlock</td><td>BiometricPrompt</td></tr>
  </tbody>
</table>
<p>Biometric auth is used for:</p>
<ul>
  <li>App unlock (optional setting)</li>
  <li>Confirming sensitive operations (account deletion, key export)</li>
  <li>Authorizing payments and transfers</li>
</ul>
`,
  },
  'customization-screens-6-screens': {
    title: 'Customization Screens (6 Screens)',
    category: 'Mobile Development',
    categoryIcon: '📱',
    categoryColor: '#f472b6',
    readTime: '4 min read',
    content: `
<p>CGraph mobile includes 6 dedicated customization screens for personalizing the experience.</p>

<h3>Customization Screens</h3>
<table>
  <thead><tr><th>#</th><th>Screen</th><th>Features</th></tr></thead>
  <tbody>
    <tr><td>1</td><td><strong>Theme Selection</strong></td><td>Dark, Light, Matrix Green, System auto</td></tr>
    <tr><td>2</td><td><strong>Chat Appearance</strong></td><td>Bubble style, font size, message density, timestamp format</td></tr>
    <tr><td>3</td><td><strong>Notification Settings</strong></td><td>Per-server, per-channel, DND schedule, sound selection</td></tr>
    <tr><td>4</td><td><strong>Privacy Controls</strong></td><td>Online status, read receipts, typing indicators, profile visibility</td></tr>
    <tr><td>5</td><td><strong>Accessibility</strong></td><td>Font scaling, reduced motion, high contrast, screen reader hints</td></tr>
    <tr><td>6</td><td><strong>Profile Customization</strong></td><td>Avatar, banner, bio, badges, profile border selection</td></tr>
  </tbody>
</table>

<p>All customization settings are synced across devices via the API, so your preferences follow you between web and mobile.</p>
`,
  },
  'creating-posts-nested-threads': {
    title: 'Creating Posts & Nested Threads',
    category: 'Community Forums',
    categoryIcon: '📋',
    categoryColor: '#a78bfa',
    readTime: '6 min read',
    content: `
<p>CGraph's forum system provides threaded discussions within your server communities.</p>

<h3>Creating a Post</h3>
<ul>
  <li>Navigate to a Forum channel and click "New Post"</li>
  <li>Choose a thread prefix (Discussion, Question, Guide, Bug Report, etc.)</li>
  <li>Write your post using the rich text editor (BBCode + Markdown)</li>
  <li>Optionally add a poll, rating system, or file attachments</li>
  <li>Submit — your post appears in the forum feed</li>
</ul>

<h3>Nested Threading</h3>
<p>Comments support unlimited nesting depth:</p>
<ul>
  <li>Reply to any comment to create a sub-thread</li>
  <li>Visual indentation shows thread hierarchy</li>
  <li>Collapse/expand threads to manage complexity</li>
  <li>Sort by: Newest, Oldest, Top (most upvoted), Controversial</li>
</ul>

<h3>Post Types</h3>
<table>
  <thead><tr><th>Type</th><th>Features</th></tr></thead>
  <tbody>
    <tr><td><strong>Discussion</strong></td><td>Standard text post with replies</td></tr>
    <tr><td><strong>Question</strong></td><td>Can mark a reply as "accepted answer"</td></tr>
    <tr><td><strong>Poll</strong></td><td>Multiple choice with results display</td></tr>
    <tr><td><strong>Guide</strong></td><td>Long-form with table of contents</td></tr>
  </tbody>
</table>
`,
  },
  'voting-karma-leaderboards': {
    title: 'Voting, Karma & Leaderboards',
    category: 'Community Forums',
    categoryIcon: '📋',
    categoryColor: '#a78bfa',
    readTime: '5 min read',
    content: `
<p>CGraph's voting system tracks community contribution quality through karma points.</p>

<h3>Voting System</h3>
<ul>
  <li><strong>Upvote</strong> — +1 to post score, +15 XP to author</li>
  <li><strong>Downvote</strong> — -1 to post score (no XP penalty)</li>
  <li>One vote per user per post/comment</li>
  <li>Votes are anonymous by default (configurable per server)</li>
</ul>

<h3>Karma</h3>
<p>Karma represents your community reputation:</p>
<ul>
  <li>Earned from upvotes on your posts and comments</li>
  <li>Separate karma scores per server</li>
  <li>High karma unlocks special forum permissions</li>
  <li>Displayed on your profile and in forum posts</li>
</ul>

<h3>Leaderboards</h3>
<p>Forum leaderboards rank members by:</p>
<ul>
  <li><strong>Total karma</strong> — All-time contribution score</li>
  <li><strong>Weekly karma</strong> — This week's top contributors</li>
  <li><strong>Best answers</strong> — Most accepted answers (Question posts)</li>
  <li><strong>Most helpful</strong> — Highest upvote-to-post ratio</li>
</ul>
`,
  },
  'rich-text-editor-bbcode-parser': {
    title: 'Rich Text Editor & BBCode Parser',
    category: 'Community Forums',
    categoryIcon: '📋',
    categoryColor: '#a78bfa',
    readTime: '7 min read',
    content: `
<p>CGraph's forum editor supports both visual editing and BBCode markup for rich text formatting.</p>

<h3>Supported Formatting</h3>
<table>
  <thead><tr><th>Format</th><th>BBCode</th><th>Output</th></tr></thead>
  <tbody>
    <tr><td>Bold</td><td>[b]text[/b]</td><td><strong>text</strong></td></tr>
    <tr><td>Italic</td><td>[i]text[/i]</td><td><em>text</em></td></tr>
    <tr><td>Code</td><td>[code]text[/code]</td><td>Syntax-highlighted code block</td></tr>
    <tr><td>Quote</td><td>[quote]text[/quote]</td><td>Indented blockquote</td></tr>
    <tr><td>List</td><td>[list][*]item[/list]</td><td>Bulleted list</td></tr>
    <tr><td>Image</td><td>[img]url[/img]</td><td>Embedded image</td></tr>
    <tr><td>Link</td><td>[url=...]text[/url]</td><td>Clickable hyperlink</td></tr>
    <tr><td>Spoiler</td><td>[spoiler]text[/spoiler]</td><td>Hidden until clicked</td></tr>
  </tbody>
</table>

<h3>Visual Editor</h3>
<p>The WYSIWYG editor provides toolbar buttons for all formatting options. It also supports:</p>
<ul>
  <li>Drag-and-drop image upload</li>
  <li>Paste from clipboard (images and formatted text)</li>
  <li>Auto-link detection (URLs become clickable)</li>
  <li>Emoji picker with server custom emoji</li>
  <li>@mentions for tagging users</li>
</ul>
`,
  },
  'thread-prefixes-polls-ratings': {
    title: 'Thread Prefixes, Polls & Ratings',
    category: 'Community Forums',
    categoryIcon: '📋',
    categoryColor: '#a78bfa',
    readTime: '4 min read',
    content: `
<p>Advanced forum features for organizing and enriching discussions.</p>

<h3>Thread Prefixes</h3>
<p>Prefixes categorize threads visually and for filtering:</p>
<ul>
  <li><strong>Discussion</strong> — General conversation</li>
  <li><strong>Question</strong> — Seeking answers (supports accepted answer)</li>
  <li><strong>Guide</strong> — Tutorials and how-tos</li>
  <li><strong>Bug Report</strong> — Issue reporting</li>
  <li><strong>Feature Request</strong> — Suggesting improvements</li>
  <li><strong>Custom</strong> — Server admins can create custom prefixes</li>
</ul>

<h3>Polls</h3>
<ul>
  <li>Add multiple choice questions to any post</li>
  <li>Single or multiple selection modes</li>
  <li>Optional timer for poll closing</li>
  <li>Results visible immediately or after voting</li>
  <li>Anonymous or public voting modes</li>
</ul>

<h3>Star Ratings</h3>
<p>Rate posts on a 1-5 star scale. Average ratings are displayed on the post card. Useful for review-style forums (e.g., plugin reviews, guides quality).</p>
`,
  },
  'moderator-tools-pin-lock-split-merge': {
    title: 'Moderator Tools: Pin, Lock, Split, Merge',
    category: 'Community Forums',
    categoryIcon: '📋',
    categoryColor: '#a78bfa',
    readTime: '8 min read',
    content: `
<p>Comprehensive moderation tools for maintaining healthy forum communities.</p>

<h3>Thread Management</h3>
<table>
  <thead><tr><th>Action</th><th>Description</th><th>Permission Level</th></tr></thead>
  <tbody>
    <tr><td><strong>Pin</strong></td><td>Pin thread to top of forum</td><td>Moderator+</td></tr>
    <tr><td><strong>Lock</strong></td><td>Prevent new replies</td><td>Moderator+</td></tr>
    <tr><td><strong>Hide</strong></td><td>Soft-delete from public view</td><td>Moderator+</td></tr>
    <tr><td><strong>Split</strong></td><td>Move replies to new thread</td><td>Admin+</td></tr>
    <tr><td><strong>Merge</strong></td><td>Combine duplicate threads</td><td>Admin+</td></tr>
    <tr><td><strong>Move</strong></td><td>Transfer to different forum channel</td><td>Admin+</td></tr>
  </tbody>
</table>

<h3>Content Moderation</h3>
<ul>
  <li><strong>Delete posts/comments</strong> — With reason logged to audit trail</li>
  <li><strong>Edit posts</strong> — Moderator edits are marked as such</li>
  <li><strong>Warn users</strong> — Issue formal warnings with tracking</li>
  <li><strong>Temporary ban</strong> — Ban from forum for specified duration</li>
  <li><strong>Permanent ban</strong> — Remove user from server entirely</li>
</ul>

<h3>Audit Log</h3>
<p>All moderation actions are logged with timestamp, moderator identity, action taken, reason provided, and affected content. Audit logs are viewable by server owners and administrators.</p>
`,
  },
  'rss-atom-feeds-thread-subscriptions': {
    title: 'RSS/Atom Feeds & Thread Subscriptions',
    category: 'Community Forums',
    categoryIcon: '📋',
    categoryColor: '#a78bfa',
    readTime: '3 min read',
    content: `
<p>Stay updated on forum activity through feeds and email subscriptions.</p>

<h3>RSS/Atom Feeds</h3>
<ul>
  <li>Each forum channel has an RSS feed URL</li>
  <li>Subscribe in any RSS reader to get new posts</li>
  <li>Feeds include post title, author, date, excerpt, and link</li>
  <li>Atom format also available for modern feed readers</li>
  <li>Feeds respect channel visibility permissions</li>
</ul>

<h3>Thread Subscriptions</h3>
<ul>
  <li><strong>Auto-subscribe</strong> — You're automatically subscribed to threads you create or reply to</li>
  <li><strong>Manual subscribe</strong> — Click "Subscribe" on any thread to follow it</li>
  <li><strong>Email notifications</strong> — Get email digests for subscribed threads (configurable frequency)</li>
  <li><strong>In-app notifications</strong> — Badge count for new replies in subscribed threads</li>
  <li><strong>Unsubscribe</strong> — One-click unsubscribe from any thread</li>
</ul>
`,
  },
};

// Get all article slugs in order
const allSlugs = Object.keys(docArticles);

export default function DocArticle() {
  const { slug } = useParams<{ slug: string }>();

  const article = slug ? docArticles[slug] : null;

  if (!article) {
    return (
      <MarketingLayout
        title="Article Not Found"
        subtitle="The documentation article you're looking for doesn't exist."
        eyebrow="404"
      >
        <section className="marketing-section marketing-section--alt">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <Link to="/docs" className="marketing-btn marketing-btn--primary">
              ← Back to Documentation
            </Link>
          </div>
        </section>
      </MarketingLayout>
    );
  }

  // Find adjacent articles for navigation
  const currentIndex = slug ? allSlugs.indexOf(slug) : -1;
  const prevSlug = currentIndex > 0 ? allSlugs[currentIndex - 1] : null;
  const nextSlug = currentIndex < allSlugs.length - 1 ? allSlugs[currentIndex + 1] : null;
  const prevArticle = prevSlug ? docArticles[prevSlug] : null;
  const nextArticle = nextSlug ? docArticles[nextSlug] : null;

  return (
    <MarketingLayout
      title={article.title}
      subtitle={`${article.category} · ${article.readTime}`}
      eyebrow="Documentation"
    >
      <section className="marketing-section marketing-section--alt">
        <div className="mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-gray)' }}
          >
            <Link to="/docs" className="transition-colors hover:text-emerald-400">
              Documentation
            </Link>
            <span>›</span>
            <span style={{ color: article.categoryColor }}>{article.category}</span>
            <span>›</span>
            <span className="text-white">{article.title}</span>
          </motion.div>

          {/* Article Meta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 flex items-center gap-3"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                background: `${article.categoryColor}15`,
                border: `1px solid ${article.categoryColor}25`,
              }}
            >
              <NeonIcon
                symbol={article.categoryIcon}
                size={22}
                color={article.categoryColor}
                title={article.category}
              />
            </span>
            <div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  background: `${article.categoryColor}15`,
                  color: article.categoryColor,
                }}
              >
                {article.category}
              </span>
              <span className="ml-3 text-sm" style={{ color: 'var(--color-gray)' }}>
                {article.readTime}
              </span>
            </div>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="legal-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } }),
            }}
          />

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2"
          >
            {prevArticle && prevSlug ? (
              <Link
                to={`/docs/${prevSlug}`}
                className="marketing-card group p-4 transition-colors hover:border-emerald-500/30"
              >
                <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                  ← Previous
                </span>
                <h4 className="mt-1 text-sm font-semibold text-white group-hover:text-emerald-300">
                  {prevArticle.title}
                </h4>
              </Link>
            ) : (
              <div />
            )}
            {nextArticle && nextSlug ? (
              <Link
                to={`/docs/${nextSlug}`}
                className="marketing-card group p-4 text-right transition-colors hover:border-emerald-500/30"
              >
                <span className="text-xs" style={{ color: 'var(--color-gray)' }}>
                  Next →
                </span>
                <h4 className="mt-1 text-sm font-semibold text-white group-hover:text-emerald-300">
                  {nextArticle.title}
                </h4>
              </Link>
            ) : (
              <div />
            )}
          </motion.div>

          {/* Back to Docs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 text-sm transition-colors hover:text-emerald-400"
              style={{ color: 'var(--color-gray)' }}
            >
              ← Back to all documentation
            </Link>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}

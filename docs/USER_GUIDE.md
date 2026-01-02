# CGraph User Guide

> Your complete handbook for getting started with CGraph - the privacy-first messaging platform

---

## Table of Contents

1. [What is CGraph?](#what-is-cgraph)
2. [Getting Started](#getting-started)
3. [Creating Your Account](#creating-your-account)
4. [Direct Messaging](#direct-messaging)
5. [Groups & Channels](#groups--channels)
6. [Forums](#forums)
7. [Friends System](#friends-system)
8. [Privacy & Security](#privacy--security)
9. [Mobile App](#mobile-app)
10. [Troubleshooting](#troubleshooting)

---

## What is CGraph?

CGraph is a modern communication platform that combines real-time messaging, community servers, and discussion forums into one seamless experience. Whether you want to chat privately with friends, build communities around shared interests, or participate in topic-based discussions, CGraph has you covered.

### Key Features

| Feature | Description |
|---------|-------------|
| **Direct Messages** | Private 1:1 and group conversations with real-time delivery |
| **Group Servers** | Communities with channels, roles, and permissions |
| **Forums** | Discussion boards with posts, comments, and voting |
| **Dual Authentication** | Sign up with email OR anonymous crypto wallet |
| **End-to-End Encryption** | Your messages stay private - only you and your recipients can read them |
| **Cross-Platform** | Seamless experience across web and mobile |
| **Voice Messages** | Record and send voice messages with waveform visualization |
| **Push Notifications** | Stay updated on all your devices |

---

## Getting Started

### System Requirements

**Web Browser:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile:**
- iOS 14+ (iPhone 8 or newer)
- Android 10+ (with 4GB RAM minimum)

### Accessing CGraph

**Web App:** Navigate to `https://cgraph.dev` in your browser

**Mobile App:**
- iOS: Download from the App Store (search "CGraph")
- Android: Download from Google Play (search "CGraph")

---

## Creating Your Account

CGraph offers two ways to create an account, each with its own benefits:

### Option 1: Email Registration (Traditional)

This is the familiar email/password approach. Perfect if you want:
- Easy password recovery via email
- A recognizable username for friends to find you
- Email notifications for important updates

**Steps:**
1. Click "Create Account" on the login page
2. Enter your email address
3. Choose a unique username (3-20 characters, letters/numbers/underscores only)
4. Create a strong password (minimum 8 characters, include uppercase, lowercase, and numbers)
5. Check your inbox for a verification email
6. Click the verification link within 24 hours
7. You're in!

### Option 2: Anonymous Wallet (Privacy-First)

For maximum privacy, create an account without any personal information. You'll receive:
- A unique wallet address: `0x4A7F3C9E2D1B8E4F6C5A2B9D`
- A crypto alias: `quantum-cipher-ABC123`

**Steps:**
1. Click "Anonymous Wallet" on the login page
2. Your wallet address and alias are automatically generated
3. Click "Generate New" if you want different credentials
4. Set up a 6-digit PIN (this protects your account)
5. Choose your recovery method:
   - **Backup Codes**: 8 one-time codes you can use if you forget your PIN
   - **Recovery File**: An encrypted `.cgraph` file you can use to restore access
6. Download your recovery data - **this is critical, you cannot recover without it**
7. Check the confirmation box to confirm you've saved your recovery data
8. Click "Finalize Vault Creation"

> ⚠️ **Important:** With wallet authentication, there's no "forgot password" option. If you lose your PIN AND recovery data, your account is permanently inaccessible. Store your backup codes or recovery file in a safe place.

### Switching Between Methods

You can link both authentication methods to one account:
- Start with email → Add wallet for enhanced privacy
- Start with wallet → Add email for easier recovery

Go to **Settings → Security → Linked Accounts** to manage your authentication methods.

### Username and User ID

Every CGraph account has two identifiers:

- **User ID:** A permanent number like `#0042` assigned when you create your account
- **Username:** An optional display name you can choose (e.g., `alice_dev`)

**Key points:**
- Username is optional during registration—you can set it later
- Your User ID never changes and is always visible
- Usernames can be changed, but only once every 14 days
- Friends can add you by username OR by sharing your profile

To change your username: **Settings → Account → Change Username**

---

## Direct Messaging

### Starting a Conversation

1. Click the **Messages** icon in the sidebar (speech bubble)
2. Click the **New Message** button (+ icon)
3. Search for a user by:
   - Username (e.g., `johndoe`)
   - Wallet address (e.g., `0x4A7F3C9E2D1B8E4F6C5A2B9D`)
   - Crypto alias (e.g., `quantum-cipher-ABC123`)
4. Select the user and click "Start Conversation"

### Sending Messages

Just type in the message box and press **Enter** (or click the send button).

**Rich Features:**
- **Emoji:** Click the 😊 icon or type `:emoji_name:`
- **Attachments:** Click the 📎 icon to attach files (max 25MB)
- **Voice Messages:** Hold the 🎤 icon to record (max 5 minutes)
- **Reactions:** Hover over a message and click the emoji icon
- **Reply:** Click the ↩️ icon on any message to quote it

### Message Status Indicators

| Icon | Meaning |
|------|---------|
| ✓ (gray) | Message sent |
| ✓✓ (gray) | Message delivered |
| ✓✓ (blue) | Message read |
| 🕐 (clock) | Message pending (offline) |
| ❌ (red) | Message failed to send |

### Group Chats

Create group conversations with up to 50 people:

1. Click **New Message**
2. Select multiple users (hold Ctrl/Cmd to select more than one)
3. Click "Create Group"
4. Give your group a name and optional icon
5. Start chatting!

**Group Settings:**
- Add/remove members
- Change group name and icon
- Mute notifications
- Leave group

---

## Groups & Channels

Groups are communities centered around shared interests with organized channels.

### Joining a Group

1. Click the **Groups** icon in the sidebar
2. Browse the group directory or use the search bar
3. Click on a group to preview it
4. Click "Join Group"

Some groups are:
- **Public:** Anyone can join instantly
- **Request-Only:** You must request access and wait for approval
- **Private:** Invite-only, you need a direct invite link

### Creating a Group

1. Click the **+** button next to "Your Groups"
2. Choose a group name (3-50 characters)
3. Add a description (helps people find your group)
4. Upload a group icon (optional, recommended size: 512x512)
5. Set visibility: Public, Request-Only, or Private
6. Click "Create Group"

### Understanding Channels

Channels are topic-specific spaces within a group. There are three types:

| Type | Icon | Purpose |
|------|------|---------|
| Text | # | Written conversations |
| Voice | 🔊 | Real-time audio/video |
| Announcement | 📢 | One-way broadcasts from admins |

**Creating Channels (Admin only):**
1. Right-click on your group name
2. Select "Create Channel"
3. Choose type, name, and permissions
4. Click "Create"

### Roles & Permissions

Groups have a permission system to control who can do what:

- **Owner:** Full control, can delete the group
- **Admin:** Manage channels, roles, and members
- **Moderator:** Delete messages, kick/mute members
- **Member:** Basic access to read and send messages
- **Custom Roles:** Create your own with specific permissions

To manage roles: **Group Settings → Roles**

---

## Forums

Forums are for long-form discussions with posts, comments, and voting.

### Browsing Forums

1. Click the **Forums** icon in the sidebar
2. Browse categories or use search
3. Sort by: Hot, New, Top (Today/Week/Month/All Time), Rising
4. Click on a post to read it and view comments

### Creating a Post

1. Navigate to the forum where you want to post
2. Click "Create Post"
3. Choose post type:
   - **Text:** Written content with rich formatting
   - **Link:** Share a URL with title and optional commentary
   - **Media:** Photo or video post
   - **Poll:** Multiple choice question
4. Add a title (required, max 300 characters)
5. Add content, tags, and flair (if available)
6. Click "Post"

### Voting System

Use upvotes and downvotes to surface quality content:
- **Upvote (▲):** This is valuable, I want others to see it
- **Downvote (▼):** This doesn't contribute to the discussion

Your karma score reflects your overall contribution to forums.

### Comments

- Click "Reply" to respond to a post or comment
- Comments are threaded (replies appear nested under their parent)
- You can collapse comment threads by clicking the [-] icon
- Sort comments by: Best, Top, New, Controversial, Old

### Forum Rules

Each forum has its own rules set by moderators. Read them before posting:
- Sidebar on desktop
- "About" tab on mobile

Breaking rules may result in post removal or bans.

---

## Friends System

Build your social network on CGraph.

### Sending Friend Requests

You can add friends by username or from their profile:

**By Username:**
1. Go to **Friends → Add Friend**
2. Type their username (e.g., `alice_dev`)
3. Click "Send Request"

**From Profile:**
1. Visit someone's profile (click their username anywhere)
2. Click "Add Friend"
3. Wait for them to accept

### Starting a Conversation with Friends

1. Go to **Friends** and find your friend
2. Click the "Message" button (or their profile → "Send Message")
3. You'll be taken directly to your conversation

### Managing Friend Requests

Go to **Friends → Requests** to see:
- **Incoming:** Requests from others (Accept or Decline)
- **Outgoing:** Your pending requests (Cancel if needed)

### Friend List Features

- **Online Status:** See who's online (green dot), idle (yellow), busy (red), or offline (gray)
- **Quick Actions:** Start DM, voice call, or video call with one click
- **Nicknames:** Set personal nicknames only you can see
- **Categories:** Organize friends into custom groups

### Privacy Controls

- **Who can send friend requests:** Everyone / Friends of Friends / Nobody
- **Who can DM you:** Everyone / Friends Only / Nobody
- **Online status visibility:** Everyone / Friends / Nobody

Go to **Settings → Privacy** to configure.

---

## Privacy & Security

### Two-Factor Authentication (2FA)

Add an extra layer of security:

1. Go to **Settings → Security → Two-Factor Authentication**
2. Download an authenticator app (Google Authenticator, Authy, etc.)
3. Scan the QR code with your app
4. Enter the 6-digit code to verify
5. Save your backup codes somewhere safe

### Session Management

See all devices where you're logged in:

**Settings → Security → Active Sessions**

- View device type, location, and last activity
- Click "Log Out" next to any session to remotely disconnect it
- Use "Log Out All Other Sessions" if you suspect unauthorized access

### Data Privacy

**What we collect:**
- Account information (email or wallet address)
- Messages (encrypted, we cannot read them)
- Usage analytics (anonymized)

**What we never sell:**
- Your personal information
- Your message content
- Your social graph

**Your rights:**
- Download your data: **Settings → Privacy → Download My Data**
- Delete your account: **Settings → Account → Delete Account**

---

## Mobile App

The CGraph mobile app provides the full experience on your phone.

### Installation

**iOS:**
1. Open the App Store
2. Search for "CGraph"
3. Tap "Get" and authenticate with Face ID/Touch ID
4. Open the app and log in

**Android:**
1. Open Google Play Store
2. Search for "CGraph"
3. Tap "Install"
4. Open the app and log in

### Mobile-Specific Features

- **Push Notifications:** Get alerts even when the app is closed
- **Swipe Gestures:** Swipe left to reply, right to react
- **Voice Messages:** Hold the mic button to record
- **Quick Actions:** Long-press app icon for shortcuts
- **Picture-in-Picture:** Keep video calls visible while using other apps
- **Offline Mode:** Queue messages when you have no connection

### Syncing Across Devices

Your account syncs automatically:
- Messages appear on all devices instantly
- Read status syncs (read on phone = read on web)
- Settings sync (change on one, applied everywhere)

---

## Troubleshooting

### Common Issues

**"Can't receive messages"**
1. Check your internet connection
2. Try refreshing the page (F5 on web, pull-to-refresh on mobile)
3. Log out and log back in
4. Clear browser cache (web) or reinstall app (mobile)

**"Messages not sending"**
1. Check for the ❌ icon (indicates failure)
2. Click "Retry" on the failed message
3. Check if you're blocked by the recipient
4. Ensure you haven't exceeded rate limits (slow down!)

**"Can't join a group"**
1. The group may be full (check member limit)
2. You may be banned from the group
3. The group may be private (need an invite)
4. The group may no longer exist

**"Forgot my password"**
- Email users: Click "Forgot Password" on login, check your email
- Wallet users: Use your backup codes or recovery file

**"App is slow"**
1. Close unused browser tabs (web)
2. Free up device storage (mobile)
3. Check for app updates
4. Try a different network connection

### Getting Help

- **Help Center:** [https://cgraph.dev/help](https://cgraph.dev/help)
- **Email Support:** support@cgraph.dev
- **Community Forum:** [https://forum.cgraph.dev](https://forum.cgraph.dev)
- **Twitter:** [@cgraph](https://twitter.com/cgraph)

### Reporting Bugs

Found a bug? Help us fix it:

1. Go to **Settings → Help → Report a Bug**
2. Describe what happened
3. Include steps to reproduce
4. Attach screenshots if possible
5. Submit

We review every report and prioritize fixes based on severity.

---

## Keyboard Shortcuts (Web)

| Action | Shortcut |
|--------|----------|
| New message | Ctrl/Cmd + N |
| Search | Ctrl/Cmd + K |
| Jump to conversation | Ctrl/Cmd + G |
| Toggle sidebar | Ctrl/Cmd + \ |
| Mark all as read | Shift + Escape |
| Edit last message | ↑ (up arrow in empty input) |
| Quick emoji | : (colon, then type name) |
| Send message | Enter |
| New line in message | Shift + Enter |
| Close dialog | Escape |

---

*Last updated: December 2025*

*CGraph v1.0.0*

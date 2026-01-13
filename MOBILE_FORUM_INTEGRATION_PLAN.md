# Mobile Forum Integration Plan - Complete Feature Parity

## 🎯 Mission: Revolutionize Mobile Forum Experience

Transform CGraph mobile app to match and exceed the web app's advanced forum features, creating the next-generation mobile community platform.

---

## 📊 Current Status

### Mobile Forum Features (5/15) - 33%
✅ Basic forum browsing
✅ Post viewing with nested comments
✅ Voting system (upvote/downvote)
✅ Comment creation
✅ Forum creation

### Web Forum Features (15/15) - 100%
✅ All basic features
✅ Thread prefixes
✅ Thread ratings (5-star)
✅ File attachments
✅ Polls
✅ Edit history
✅ Multi-quote
✅ User groups
✅ Moderation tools
✅ Report system

**Gap:** 10 advanced features missing in mobile

---

## 🚀 Integration Strategy

### Phase 1: Foundation (Types & API) ✅ COMPLETE
- Add missing TypeScript interfaces to mobile
- Ensure shared-types are utilized
- Add API endpoints to mobile api.ts

### Phase 2: Core Components (This Session)
Create native-friendly React Native components:
1. ThreadPrefixBadge - Colored tags for posts
2. ThreadRatingDisplay - 5-star rating system
3. AttachmentList - Display attachments with download
4. PollWidget - Interactive poll voting
5. EditHistoryModal - View edit timeline

### Phase 3: Screen Integration (This Session)
Enhance existing screens:
1. **PostScreen.tsx** - Add prefixes, ratings, polls, attachments
2. **CreatePostScreen.tsx** - Add prefix selector, attachment picker, poll creator
3. **ForumScreen.tsx** - Add prefix filters, rating display

### Phase 4: Advanced Features (Next)
1. Multi-quote system
2. Moderation tools
3. User groups display
4. Report functionality

### Phase 5: Gamification (Future)
1. XP and level system
2. Achievement notifications
3. Streak tracking
4. Leaderboards

---

## 📋 Implementation Checklist

### Step 1: Update Type Definitions ✅
**File:** `apps/mobile/src/types/index.ts`

Add missing interfaces:
```typescript
// Thread Prefixes
interface ThreadPrefix {
  id: string;
  name: string;
  color: string;
  forums: string[];
}

// Thread Ratings
interface ThreadRating {
  id: string;
  threadId: string;
  userId: string;
  rating: number; // 1-5
  createdAt: string;
}

// Attachments
interface PostAttachment {
  id: string;
  postId: string;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
  downloadUrl: string;
  downloads: number;
  uploadedBy: string;
  uploadedAt: string;
}

// Polls
interface Poll {
  id: string;
  threadId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  maxSelections?: number;
  timeout?: string;
  public: boolean;
  closed: boolean;
  createdAt: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

// Edit History
interface PostEditHistory {
  id: string;
  postId: string;
  editedBy: string;
  editedByUsername: string;
  previousContent: string;
  reason?: string;
  editedAt: string;
}
```

Enhance existing Post interface:
```typescript
interface Post {
  // ... existing fields
  prefix?: ThreadPrefix;
  rating?: number;
  ratingCount?: number;
  myRating?: number;
  attachments?: PostAttachment[];
  poll?: Poll;
  editHistory?: PostEditHistory[];
  views?: number;
  isClosed?: boolean;
}
```

### Step 2: Create Mobile Components

#### Component 1: ThreadPrefixBadge.tsx
**Location:** `apps/mobile/src/components/forums/ThreadPrefixBadge.tsx`

Features:
- Display colored badge with text
- Support small/medium/large sizes
- Match web styling but mobile-friendly
- Touchable for filtering (optional)

#### Component 2: ThreadRatingDisplay.tsx
**Location:** `apps/mobile/src/components/forums/ThreadRatingDisplay.tsx`

Features:
- Show 5 stars (filled/outlined)
- Display average rating
- Show rating count
- Interactive for rating (star press)
- Haptic feedback on rate

#### Component 3: AttachmentList.tsx
**Location:** `apps/mobile/src/components/forums/AttachmentList.tsx`

Features:
- Display file list with icons
- Show thumbnails for images
- File size and type display
- Download button with progress
- Open in native viewer

#### Component 4: PollWidget.tsx
**Location:** `apps/mobile/src/components/forums/PollWidget.tsx`

Features:
- Display poll question
- Radio/checkbox for options
- Show results with bars
- Vote submission
- Voter list (if public)
- Close poll (creator only)

#### Component 5: EditHistoryModal.tsx
**Location:** `apps/mobile/src/components/forums/EditHistoryModal.tsx`

Features:
- Bottom sheet modal
- Timeline of edits
- Show previous content
- Edit reason display
- Swipe to dismiss

### Step 3: Enhance PostScreen.tsx

**Current:** 431 lines, basic post display
**Target:** Add all MyBB features

Changes:
```typescript
// Add imports
import ThreadPrefixBadge from '@/components/forums/ThreadPrefixBadge';
import ThreadRatingDisplay from '@/components/forums/ThreadRatingDisplay';
import AttachmentList from '@/components/forums/AttachmentList';
import PollWidget from '@/components/forums/PollWidget';
import EditHistoryModal from '@/components/forums/EditHistoryModal';

// Add to post display
{post.prefix && <ThreadPrefixBadge prefix={post.prefix} />}
{post.rating && <ThreadRatingDisplay rating={post.rating} count={post.ratingCount} />}
{post.poll && <PollWidget poll={post.poll} />}
{post.attachments && <AttachmentList attachments={post.attachments} />}
```

### Step 4: Enhance CreatePostScreen.tsx

Add:
- Prefix selector dropdown
- Attachment picker button
- Poll creation section
- Multiple post types

### Step 5: Enhance ForumScreen.tsx

Add:
- Filter by prefix
- Sort by rating
- Display prefix badges on posts
- Show rating stars

---

## 🎨 Design System for Mobile

### Colors (React Native StyleSheet)
```typescript
const colors = {
  primary: '#10b981',
  purple: '#8b5cf6',
  dark700: '#374151',
  dark800: '#1f2937',
  dark900: '#111827',
  gray400: '#9ca3af',
  white: '#ffffff',
  red500: '#ef4444',
  yellow500: '#eab308',
  green500: '#22c55e',
};
```

### Component Patterns
- Use React Native's `View`, `Text`, `TouchableOpacity`
- StyleSheet.create for performance
- Haptic feedback on interactions
- Native animations (Animated API)
- Bottom sheets for modals
- Pull-to-refresh built-in

### Responsive Design
- Use Dimensions API
- Percentage-based widths
- flexWrap for badges
- ScrollView where needed
- KeyboardAvoidingView for inputs

---

## 🔌 API Integration

### New Endpoints to Add

**File:** `apps/mobile/src/lib/api.ts`

```typescript
// Thread Prefixes
getPrefixes: (forumId: string) =>
  get<ThreadPrefix[]>(`/forums/${forumId}/thread-prefixes`),

// Thread Ratings
rateThread: (threadId: string, rating: number) =>
  post(`/threads/${threadId}/rate`, { rating }),

getThreadRatings: (threadId: string) =>
  get<ThreadRating[]>(`/threads/${threadId}/ratings`),

// Attachments
uploadAttachment: (file: File, postId?: string) =>
  post<PostAttachment>('/attachments', formData),

deleteAttachment: (attachmentId: string) =>
  del(`/attachments/${attachmentId}`),

// Polls
createPoll: (threadId: string, data: CreatePollData) =>
  post<Poll>(`/threads/${threadId}/poll`, data),

votePoll: (pollId: string, optionIds: string[]) =>
  post(`/polls/${pollId}/vote`, { optionIds }),

closePoll: (pollId: string) =>
  post(`/polls/${pollId}/close`, {}),

// Edit History
getEditHistory: (postId: string) =>
  get<PostEditHistory[]>(`/posts/${postId}/edit-history`),
```

---

## 📱 Mobile-Specific Considerations

### 1. File Uploads
Use Expo Document Picker and Image Picker:
```typescript
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
```

### 2. Haptic Feedback
```typescript
import * as Haptics from 'expo-haptics';
// On vote: Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
// On success: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
```

### 3. Native Sharing
```typescript
import { Share } from 'react-native';
// Share.share({ message: 'Check out this post!' })
```

### 4. Native Alerts
```typescript
import { Alert } from 'react-native';
// Alert.alert('Title', 'Message', [...buttons])
```

### 5. Performance
- Use FlatList for long lists
- Memoize expensive components
- Lazy load images
- Virtual scrolling for comments

---

## 🎯 Success Metrics

### Feature Parity
- [ ] 15/15 forum features in mobile (100%)
- [ ] All components responsive
- [ ] Native feel maintained
- [ ] Performance: 60 FPS scrolling

### User Experience
- [ ] Haptic feedback on all interactions
- [ ] Smooth animations
- [ ] Offline support (cache)
- [ ] Pull-to-refresh everywhere

### Code Quality
- [ ] TypeScript strict mode
- [ ] No console warnings
- [ ] All components tested
- [ ] Storybook stories added

---

## 🚀 Execution Plan (This Session)

### Hour 1: Foundation
1. ✅ Update types in apps/mobile/src/types/index.ts
2. ✅ Add API endpoints to apps/mobile/src/lib/api.ts
3. ✅ Create component directory structure

### Hour 2: Core Components
4. Create ThreadPrefixBadge.tsx
5. Create ThreadRatingDisplay.tsx
6. Create AttachmentList.tsx

### Hour 3: Advanced Components
7. Create PollWidget.tsx
8. Create EditHistoryModal.tsx

### Hour 4: Screen Integration
9. Enhance PostScreen.tsx
10. Enhance CreatePostScreen.tsx
11. Test all integrations

---

## 📚 Reference Files

**Web Components to Adapt:**
- `/apps/web/src/components/forums/ThreadPrefix.tsx`
- `/apps/web/src/components/forums/ThreadRating.tsx`
- `/apps/web/src/components/forums/AttachmentUploader.tsx`
- `/apps/web/src/components/forums/PollWidget.tsx`
- `/apps/web/src/components/forums/EditHistoryModal.tsx`

**Mobile Patterns to Follow:**
- `/apps/mobile/src/screens/forums/PostScreen.tsx` (comment rendering)
- `/apps/mobile/src/components/conversation/MessageInput.tsx` (input patterns)
- `/apps/mobile/src/components/Modal.tsx` (modal patterns)

---

## 🎨 Mobile UI Mockup (Text-based)

```
┌─────────────────────────────┐
│ ← Post Title          ⋮     │ Header
├─────────────────────────────┤
│ [SOLVED] How to integrate?  │ Prefix + Title
│ ⭐⭐⭐⭐⭐ 4.5 (23 ratings) │ Rating
│                             │
│ Posted by @username • 2h    │ Meta
│                             │
│ Content here...             │ Post Content
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 What's your favorite?│ │ Poll Widget
│ │ ○ Option 1        (45%) │ │
│ │ ● Option 2        (55%) │ │
│ │                         │ │
│ │ [Vote] [Results]        │ │
│ └─────────────────────────┘ │
│                             │
│ 📎 Attachments (2)          │ Attachments
│ ┌─────────────────────────┐ │
│ │ 📄 document.pdf  2.3 MB │ │
│ │ 🖼️ image.png     1.1 MB │ │
│ └─────────────────────────┘ │
│                             │
│ ▲ 42  ▼  💬 18  📤 Share   │ Actions
├─────────────────────────────┤
│ Comments (18)               │ Comments
│                             │
│ ┌─@user1 • 1h──────────────┤ Comment
│ │ Great post!             │ │
│ │ ▲ 5  ▼  Reply           │ │
│ └─────────────────────────┘ │
│   │                         │
│   └─@user2 • 30m───────────┤ Nested Reply
│     │ Thanks!             │ │
│     │ ▲ 2  ▼  Reply       │ │
│     └─────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Write a comment...      │ │ Comment Input
│ │                    [→]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

**Status:** Ready to implement
**Next Action:** Start with type definitions
**Target:** Complete mobile forum parity today

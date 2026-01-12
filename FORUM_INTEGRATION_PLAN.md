# Forum Integration Plan - Complete MyBB Features

## 🎯 Vision
Create a **next-generation community platform** that combines classic forum power with modern UX, making CGraph the best place for communities to thrive.

## 📋 Current State Analysis

### ✅ Already Implemented
1. **Core Forum Structure**
   - Forum creation and management
   - Post creation (text, image, link, poll)
   - Comments system
   - Voting/karma system
   - Forum admin dashboard

2. **MyBB Features - Phase 1 & 2 Priority 1**
   - Thread prefixes (UI complete)
   - Thread ratings (UI complete)
   - Attachment uploader (UI complete)
   - Poll widget (UI complete)
   - Type system in forumStore.ts

3. **Admin Features**
   - ForumAdmin.tsx with 9 tabs
   - Settings, appearance, moderators
   - Categories, members, post settings
   - Rules, analytics, mod queue

### 🔧 Needs Integration

#### A. MyBB Components → ForumPost.tsx
- [ ] Display thread prefixes on post title
- [ ] Show thread ratings below post
- [ ] Display attachments in post content
- [ ] Show poll widget if post has poll
- [ ] Show edit history button
- [ ] Add multi-quote functionality

#### B. Forum Admin → Navigation
- [ ] Settings cog only visible to forum owners/admins
- [ ] Quick mod actions in post dropdown
- [ ] Moderation queue accessible from forum header

#### C. Missing Priority 2 Components
- [ ] Edit history modal
- [ ] Multi-quote buffer indicator
- [ ] Subscription management
- [ ] Warning system (moderation)
- [ ] Ban system (moderation)
- [ ] Report system (moderation)

#### D. Backend Integration Points
- [ ] All forumStore actions need API calls
- [ ] Database schema for new features
- [ ] File upload handling for attachments
- [ ] Real-time updates via Phoenix channels

## 🚀 Integration Steps

### Step 1: Integrate MyBB Components into ForumPost.tsx
**Goal:** Show all MyBB features on individual post view

**Changes:**
1. Import new components (ThreadPrefix, ThreadRating, PollWidget, AttachmentUploader)
2. Add prefix display on post title
3. Add interactive thread rating below post content
4. Display poll widget if post has poll
5. Show attachments list with download links
6. Add "Edit History" button for edited posts
7. Add multi-quote button on comments

### Step 2: Enhanced Comment System
**Goal:** Add MyBB features to comments

**Changes:**
1. Show attachments on comments
2. Add edit history for comments
3. Multi-quote functionality
4. User reputation display

### Step 3: Moderation Integration
**Goal:** Connect moderation features to admin dashboard

**Changes:**
1. Add quick mod actions to post dropdown
2. Link mod queue to ForumAdmin
3. Add report button with modal
4. Warning/ban actions for moderators

### Step 4: Navigation & Discoverability
**Goal:** Make features easily accessible

**Changes:**
1. Add subscriptions menu to user profile
2. Show notification for new posts in subscribed threads
3. Add filters for thread prefixes
4. Quick access to mod queue (badge with pending count)

### Step 5: Backend Integration
**Goal:** Make everything functional end-to-end

**Changes:**
1. Implement API endpoints in Phoenix
2. Create database migrations
3. Connect forumStore actions to API
4. Add WebSocket for real-time updates

## 🎨 Design Consistency Checklist

All integrations must maintain:
- ✅ Glassmorphic design (GlassCard variants)
- ✅ Framer Motion animations
- ✅ Haptic feedback
- ✅ Dark theme (dark-700/800/900)
- ✅ Primary-to-purple gradients
- ✅ TypeScript strict mode
- ✅ Responsive design
- ✅ Accessibility (ARIA labels, keyboard nav)

## 📊 Priority Order

### High Priority (This Session)
1. ✅ Integrate MyBB components into ForumPost.tsx
2. ✅ Add edit history modal component
3. ✅ Add multi-quote functionality
4. ✅ Connect admin features to navigation

### Medium Priority (Next Session)
5. ⏳ Create subscription management page
6. ⏳ Build moderation components (warn/ban/report)
7. ⏳ Add real-time notifications

### Low Priority (Future)
8. ⏳ Backend API implementation
9. ⏳ Database migrations
10. ⏳ Full end-to-end testing

## 🔗 File Structure

```
apps/web/src/
├── components/forums/
│   ├── ThreadPrefix.tsx ✅
│   ├── ThreadRating.tsx ✅
│   ├── AttachmentUploader.tsx ✅
│   ├── PollWidget.tsx ✅
│   ├── EditHistoryModal.tsx [CREATE]
│   ├── MultiQuoteIndicator.tsx [CREATE]
│   ├── SubscriptionButton.tsx [CREATE]
│   └── moderation/
│       ├── ReportModal.tsx [CREATE]
│       ├── WarnUserModal.tsx [CREATE]
│       └── BanUserModal.tsx [CREATE]
├── pages/forums/
│   ├── Forums.tsx ✅
│   ├── ForumPost.tsx [ENHANCE]
│   ├── CreatePost.tsx ✅
│   ├── ForumAdmin.tsx ✅
│   └── Subscriptions.tsx [CREATE]
└── stores/
    └── forumStore.ts ✅
```

## 🎯 Success Metrics

### User Experience
- Users can create threads with prefixes, polls, attachments
- Users can rate threads and see ratings
- Users can subscribe to threads/forums
- Moderators can warn/ban/approve posts
- All features work smoothly with animations

### Technical Quality
- 0 TypeScript errors
- All components follow design system
- Proper error handling
- Loading states for all async actions
- Accessible to keyboard/screen readers

### Community Features
- Active moderation tools
- Rich content creation (polls, attachments)
- Engagement features (ratings, subscriptions)
- Professional forum management

---

**Next Action:** Start with Step 1 - Integrate MyBB components into ForumPost.tsx

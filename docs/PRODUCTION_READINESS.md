# CGraph Production Readiness Checklist

> **Goal**: Support 100+ concurrent users with fully functional UI, deployed to Google Play Store and Apple App Store.

---

## Executive Summary

| Category | Status | Effort | Priority |
|----------|--------|--------|----------|
| **Backend Infrastructure** | 🟡 Partial | 1-2 days | Critical |
| **Web UI Completion** | 🟡 Partial | 3-5 days | High |
| **Mobile UI Completion** | 🟡 Partial | 3-5 days | High |
| **App Store Preparation** | 🔴 Not Started | 2-3 days | High |
| **Security Hardening** | 🟡 Partial | 1-2 days | Critical |
| **Testing & QA** | 🟡 Partial | 2-3 days | High |

**Estimated Total Time**: 2-3 weeks

---

## 1. Backend Infrastructure (Support 100 Users)

### Current State
- ✅ Phoenix/Elixir backend with 215 passing tests
- ✅ PostgreSQL database configured
- ✅ WebSocket channels for real-time messaging
- ✅ Rate limiting implemented
- 🟡 Missing production configuration

### Required Changes

#### 1.1 Production Configuration
```elixir
# config/prod.exs - Ensure these are set:
- [ ] SECRET_KEY_BASE environment variable
- [ ] DATABASE_URL for production PostgreSQL
- [ ] GUARDIAN_SECRET for JWT signing
- [ ] PHX_HOST for your production domain
- [ ] SSL/HTTPS configuration
```

#### 1.2 Database Scaling (100 users is minimal)
```
Minimum requirements for 100 concurrent users:
- PostgreSQL: 2 vCPU, 4GB RAM (any managed provider)
- Application: 2 vCPU, 2GB RAM
- Connection pool: 20-50 connections

Recommended providers:
- [ ] Fly.io PostgreSQL ($10-20/month)
- [ ] Railway ($5-20/month)
- [ ] Render ($7-25/month)
- [ ] AWS RDS t3.small ($15-30/month)
```

#### 1.3 Deployment Checklist
- [ ] Set up production environment on Fly.io/Railway
- [ ] Configure database with connection pooling
- [ ] Set up SSL certificate (automatic on most platforms)
- [ ] Configure domain/subdomain for API
- [ ] Set up monitoring (AppSignal, Prometheus)
- [ ] Configure error tracking (Sentry)
- [ ] Set up log aggregation
- [ ] Create database backup strategy

#### 1.4 Environment Variables Required
```bash
# Production environment variables
SECRET_KEY_BASE=<64+ char random string>
DATABASE_URL=postgresql://user:pass@host:5432/cgraph_prod
GUARDIAN_SECRET=<64+ char random string>
PHX_HOST=api.cgraph.app
PORT=4000
POOL_SIZE=20
MIX_ENV=prod

# Email (for password reset, notifications)
RESEND_API_KEY=<your-resend-api-key>

# Push Notifications
EXPO_ACCESS_TOKEN=<your-expo-token>

# File Storage
R2_ACCESS_KEY_ID=<cloudflare-r2-key>
R2_SECRET_ACCESS_KEY=<cloudflare-r2-secret>
R2_BUCKET=cgraph-uploads
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

---

## 2. Web UI Completion

### Current State
- ✅ React 18 + Vite 5 builds successfully
- ✅ TailwindCSS configured
- ✅ Zustand state management
- ✅ React Query for server state
- 🟡 Pages exist but need polish

### Required UI Work

#### 2.1 Critical Pages (Must Have)
| Page | Status | Work Needed |
|------|--------|-------------|
| Login | 🟡 Exists | Form validation, error handling |
| Register | 🟡 Exists | Password strength indicator, ToS checkbox |
| Messages List | 🟡 Exists | Empty states, loading skeletons |
| Chat View | 🟡 Exists | Message input, file upload, reactions |
| Settings | 🟡 Exists | Account deletion, data export |

#### 2.2 Important Features
- [ ] Loading states and skeletons for all pages
- [ ] Error boundaries for graceful failure
- [ ] Toast notifications for actions
- [ ] Responsive design verification (mobile-first)
- [ ] Dark/light theme toggle working
- [ ] Keyboard shortcuts for power users
- [ ] Accessibility (a11y) basics

#### 2.3 WebSocket Integration
- [ ] Verify real-time message delivery
- [ ] Typing indicators working
- [ ] Presence indicators (online/offline)
- [ ] Reconnection handling

---

## 3. Mobile UI Completion

### Current State
- ✅ React Native 0.73 + Expo 50
- ✅ TypeScript compiles
- ✅ Navigation structure in place
- ✅ App.json configured with permissions
- 🟡 Screens need implementation polish

### Required Mobile Work

#### 3.1 Critical Screens
| Screen | Status | Work Needed |
|--------|--------|-------------|
| Login | 🟡 Exists | Biometric auth support |
| Messages | 🟡 Exists | Pull-to-refresh, infinite scroll |
| Chat | 🟡 Exists | Keyboard handling, image picker |
| Settings | 🟡 Exists | Push notification toggles |

#### 3.2 Mobile-Specific Features
- [ ] Push notification handling (foreground/background)
- [ ] Deep linking configuration
- [ ] Offline support (queue messages)
- [ ] Image caching
- [ ] Gesture navigation
- [ ] Haptic feedback

#### 3.3 Platform-Specific Work
**iOS:**
- [ ] Test on iOS simulator and real device
- [ ] Verify all permissions work
- [ ] Test keyboard handling
- [ ] Verify safe area insets

**Android:**
- [ ] Test on Android emulator and real device
- [ ] Verify back button handling
- [ ] Test notification channels
- [ ] Verify permissions flow

---

## 4. App Store Preparation

### 4.1 Developer Accounts
- [ ] **Google Play Console**: $25 one-time fee
  - URL: https://play.google.com/console
  - Create developer profile
  - Accept developer agreement
  
- [ ] **Apple Developer Program**: $99/year
  - URL: https://developer.apple.com/programs/
  - Requires D-U-N-S number for organization
  - Personal account faster to set up

### 4.2 Required Assets

#### App Icons
| Platform | Size | File |
|----------|------|------|
| iOS | 1024×1024 | AppIcon.png (no alpha) |
| Android | 512×512 | icon.png |
| Adaptive Icon | 432×432 | adaptive-icon.png |
| Notification | 96×96 | notification-icon.png |

#### Screenshots (Both Platforms)
```
Required screenshots per device type:
- 5-10 screenshots minimum
- Show key features
- Include captions/text overlays

iOS Sizes:
- iPhone 6.7" (1290×2796)
- iPhone 6.5" (1242×2688)  
- iPhone 5.5" (1242×2208)
- iPad Pro 12.9" (2048×2732) - if supporting tablet

Android Sizes:
- Phone (1080×1920 minimum)
- 7" Tablet (optional)
- 10" Tablet (optional)
```

#### App Store Metadata
- [ ] App name (30 chars)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Keywords (iOS: 100 chars total)
- [ ] Category selection
- [ ] Content rating questionnaire
- [ ] Privacy policy URL (REQUIRED)
- [ ] Support URL
- [ ] Marketing URL (optional)

### 4.3 Privacy Policy (Required)
Create a privacy policy that covers:
- [ ] What data you collect
- [ ] How you use the data
- [ ] Third-party services used
- [ ] User rights (GDPR, CCPA)
- [ ] Contact information
- [ ] Last updated date

**Host at**: `https://cgraph.app/privacy` or similar

### 4.4 EAS Build Setup (Expo)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Create production builds
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

#### eas.json Configuration
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 4.5 Google Play Submission
1. [ ] Create app in Google Play Console
2. [ ] Complete store listing
3. [ ] Upload screenshots
4. [ ] Complete content rating questionnaire
5. [ ] Set up pricing (free/paid)
6. [ ] Configure countries for distribution
7. [ ] Upload AAB file from EAS build
8. [ ] Submit for review (typically 1-3 days)

### 4.6 Apple App Store Submission
1. [ ] Create app in App Store Connect
2. [ ] Complete app information
3. [ ] Upload screenshots for all device sizes
4. [ ] Complete age rating questionnaire
5. [ ] Set up pricing
6. [ ] Configure app privacy (data collection)
7. [ ] Upload IPA via EAS or Transporter
8. [ ] Submit for review (typically 1-7 days)

---

## 5. Security Hardening

### 5.1 Backend Security
- [ ] Ensure all endpoints require authentication
- [ ] Verify rate limiting is active in production
- [ ] Enable CORS only for your domains
- [ ] Set secure cookie flags
- [ ] Implement request validation
- [ ] Add SQL injection protection (Ecto handles this)
- [ ] Enable HTTPS only

### 5.2 Data Protection
- [ ] Encrypt sensitive data at rest
- [ ] Use secure password hashing (Argon2 ✅)
- [ ] Implement token rotation
- [ ] Add session timeout
- [ ] Log security events

### 5.3 Mobile Security
- [ ] Use secure storage for tokens
- [ ] Certificate pinning (optional but recommended)
- [ ] Disable debug logging in production
- [ ] Obfuscate release builds

---

## 6. Testing & QA

### 6.1 Backend Testing
- [x] Unit tests passing (215 tests, 0 failures)
- [ ] Load testing with 100 concurrent connections
- [ ] WebSocket stress testing
- [ ] API endpoint coverage

### 6.2 Frontend Testing
- [ ] Component tests with Vitest/Jest
- [ ] E2E tests with Playwright/Cypress
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing

### 6.3 Mobile Testing
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test push notifications
- [ ] Test deep links
- [ ] Test offline behavior
- [ ] Test app backgrounding/foregrounding

### 6.4 Pre-Launch Checklist
- [ ] Test complete user journey (signup → messaging)
- [ ] Verify password reset flow
- [ ] Test file uploads
- [ ] Verify real-time updates
- [ ] Check error handling
- [ ] Test on slow network

---

## 7. Cost Estimation (100 Users)

### Monthly Infrastructure Costs
| Service | Provider | Cost/Month |
|---------|----------|------------|
| Application Server | Fly.io | $5-15 |
| PostgreSQL Database | Fly.io/Railway | $10-20 |
| File Storage | Cloudflare R2 | $0-5 |
| Email Service | Resend | $0 (free tier) |
| Push Notifications | Expo | $0 (free tier) |
| Domain + SSL | Cloudflare | $10-15/year |
| **Total** | | **$15-40/month** |

### One-Time Costs
| Item | Cost |
|------|------|
| Google Play Developer | $25 |
| Apple Developer Program | $99/year |
| **Total** | **$124** |

---

## 8. Launch Timeline

### Week 1: Infrastructure & Security
- Day 1-2: Set up production environment
- Day 3-4: Security hardening
- Day 5: Load testing

### Week 2: UI Polish & Testing
- Day 1-3: Web UI completion
- Day 4-5: Mobile UI completion
- Day 6-7: QA and bug fixes

### Week 3: App Store Submission
- Day 1: Create developer accounts
- Day 2: Prepare assets and metadata
- Day 3: Submit to Google Play
- Day 4: Submit to Apple App Store
- Day 5-7: Address review feedback

---

## Quick Start Commands

```bash
# 1. Create production build (backend)
cd apps/backend
MIX_ENV=prod mix release

# 2. Create mobile builds
cd apps/mobile
eas build --platform all --profile production

# 3. Submit to stores
eas submit --platform ios
eas submit --platform android

# 4. Run load test
k6 run infrastructure/scripts/load-test.js
```

---

## Priority Action Items

### This Week (Critical)
1. Set up production environment on Fly.io
2. Configure SSL and domain
3. Create privacy policy page
4. Set up developer accounts

### Next Week (High)
5. Polish UI for critical user flows
6. Complete mobile screen implementation
7. Create app store assets
8. Submit for review

### Before Launch
9. Set up monitoring and alerting
10. Create support/feedback channel
11. Prepare launch announcement
12. Set up analytics

---

*Last Updated: December 29, 2024*

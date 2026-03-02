# Mobile In-App Purchase (IAP) Testing Guide

## Overview

CGraph's mobile app supports in-app purchases for premium subscriptions via:

- **Apple App Store** (StoreKit 2) on iOS
- **Google Play Billing** (v6) on Android

These require physical devices or emulators with sandbox/test accounts to verify.

---

## iOS Testing (Apple StoreKit 2)

### Prerequisites

- macOS with Xcode 15+
- Physical iPhone/iPad **or** iOS Simulator
- Apple Developer account (enrolled in Apple Developer Program)

### Setup Steps

1. **Configure StoreKit Testing in Xcode**
   - Open `apps/mobile/ios/CGraph.xcworkspace`
   - Go to **Product → Scheme → Edit Scheme**
   - Under **Run → Options → StoreKit Configuration**, select `Configuration.storekit`
   - The StoreKit configuration file is at `apps/mobile/ios/CGraph/Configuration.storekit`

2. **Create Sandbox Test Account**
   - Go to
     [App Store Connect → Users & Access → Sandbox → Testers](https://appstoreconnect.apple.com/access/testers)
   - Click **+** to create a sandbox tester
   - Use a unique email (not an existing Apple ID)
   - Remember the password — you'll need it on-device

3. **Sign In on Device**
   - On iPhone: **Settings → App Store → Sandbox Account**
   - Sign in with the sandbox tester credentials
   - For Simulator: StoreKit local testing doesn't require an account

4. **Test Purchase Flow**

   ```
   # Build and run the mobile app
   cd apps/mobile
   npx expo run:ios --device
   ```

   - Navigate to **Settings → Subscription**
   - Tap **"Upgrade to Premium"**
   - Complete purchase using sandbox account
   - Verify subscription status updates in the app
   - Verify webhook delivery to backend: `POST /api/webhooks/apple`

5. **Test Subscription Lifecycle**
   - **Renewal**: Sandbox subscriptions auto-renew at accelerated rates (monthly = 5 min)
   - **Cancellation**: Settings → Apple ID → Subscriptions → Cancel
   - **Restore**: Settings → Subscription → "Restore Purchases"
   - **Grace Period**: Wait for renewal to fail (remove payment method from sandbox)

### Expected Behaviors

- ✅ Purchase dialog appears with correct price
- ✅ After purchase: user.subscription_tier updates to "premium"
- ✅ IAP receipt is validated server-side
- ✅ Webhook `SUBSCRIBED` event delivered to backend
- ✅ Cancel/restore flows update subscription state correctly

---

## Android Testing (Google Play Billing v6)

### Prerequisites

- Android Studio with Android emulator (API 33+) **or** physical Android device
- Google Play Developer account
- App must be published to internal test track (at minimum)

### Setup Steps

1. **Create License Test Accounts**
   - Go to
     [Google Play Console → Settings → License testing](https://play.google.com/console/developers)
   - Add Gmail accounts as license testers
   - These accounts can make test purchases without being charged

2. **Create Test Products in Play Console**
   - Go to your app → **Monetization → Subscriptions**
   - Create products matching the app's SKUs:
     - `premium_monthly` — $9.99/month
     - `enterprise_monthly` — $29.99/month
   - Activate the products

3. **Build and Install Test APK**

   ```
   cd apps/mobile
   npx expo run:android --device
   ```

4. **Test Purchase Flow**
   - Sign into the device with a license tester Google account
   - Navigate to **Settings → Subscription**
   - Tap **"Upgrade to Premium"**
   - Complete purchase (will show "Test card, always approves")
   - Verify subscription status updates

5. **Test Subscription Lifecycle**
   - **Renewal**: Test subscriptions renew at accelerated rates
   - **Cancellation**: Google Play → Subscriptions → Cancel
   - **Refund**: Play Console → Order Management → Refund
   - **Hold**: Simulated via test card "always declines"

### Expected Behaviors

- ✅ Purchase dialog shows correct price with "Test card" option
- ✅ After purchase: user.subscription_tier updates to "premium"
- ✅ Google Play receipt validated via RTDN or server-side check
- ✅ Backend processes Google Play notification
- ✅ Cancel/restore flows update subscription state

---

## Automated Verification Results (Phase 17)

The following was verified programmatically against the codebase:

| Component                      | Status         | Notes                                       |
| ------------------------------ | -------------- | ------------------------------------------- |
| StoreKit 2 integration         | ✅ Implemented | `apps/mobile/src/services/iap/`             |
| Google Play Billing v6         | ✅ Implemented | `apps/mobile/src/services/iap/`             |
| Server-side receipt validation | ✅ Implemented | `lib/cgraph/subscriptions/iap_validator.ex` |
| Subscription state machine     | ✅ Implemented | Handles all lifecycle events                |
| Webhook handlers               | ✅ Implemented | Apple & Google notification endpoints       |
| Offline purchase queue         | ✅ Implemented | Queues purchases when offline               |
| Cross-platform sync            | ✅ Implemented | Syncs IAP state with backend                |

### What Requires Physical Device Testing

1. **Apple StoreKit purchase dialog** — Renders natively, cannot be tested in unit tests
2. **Google Play billing dialog** — Requires Play Services on device
3. **Receipt signature verification** — Sandbox receipts have different signing keys
4. **Push notification delivery** — Server-to-device renewal notifications
5. **Offline → online purchase sync** — Airplane mode → purchase → reconnect

---

## Troubleshooting

### iOS

- **"Cannot connect to iTunes Store"**: Check internet, re-sign-in to sandbox account
- **Purchase hangs**: Reset StoreKit configuration in Xcode scheme
- **Receipt validation fails**: Ensure backend uses sandbox URL for validation

### Android

- **"Item not available"**: Ensure app version matches Play Console version
- **License test not working**: Wait 15 min after adding tester, clear Play Store cache
- **RTDN not received**: Check Firebase Cloud Messaging setup and topic subscription

# Mobile App Build Guide

> Build and deploy the CGraph mobile app using Expo EAS.

## Prerequisites

| Tool        | Version  | Install                              |
| ----------- | -------- | ------------------------------------ |
| Node.js     | >= 18    | https://nodejs.org                   |
| pnpm        | >= 9     | `npm install -g pnpm`                |
| Expo CLI    | latest   | `npm install -g expo-cli` (optional) |
| EAS CLI     | >= 7.0.0 | `npm install -g eas-cli`             |
| Xcode       | >= 15    | Mac App Store (iOS builds only)      |
| Android SDK | >= 34    | Android Studio (Android builds only) |

## Required Environment Variables

| Variable                 | Description                       | Required For   |
| ------------------------ | --------------------------------- | -------------- |
| `EAS_PROJECT_ID`         | Expo project UUID from `eas init` | All EAS builds |
| `API_URL`                | Backend API URL                   | Preview/Prod   |
| `WS_URL`                 | WebSocket URL                     | Preview/Prod   |
| `API_HOST`               | LAN IP for dev physical device    | Dev (optional) |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for crash reporting    | Preview/Prod   |
| `APP_VARIANT`            | `development` or `preview`        | Non-production |

## Initial Setup

### 1. Install dependencies

```bash
# From repo root
pnpm install
```

### 2. Initialize EAS project

```bash
cd apps/mobile
eas init
```

This generates a real Expo project UUID and writes it to your config. Export it:

```bash
export EAS_PROJECT_ID="your-uuid-from-eas-init"
```

### 3. Configure Apple credentials (iOS)

EAS can manage credentials automatically, or you can provide your own:

```bash
# Let EAS manage (recommended for first-time setup)
eas credentials --platform ios

# Or set manually in eas.json submit.production.ios:
# - appleId: your Apple ID email
# - ascAppId: App Store Connect app ID
# - appleTeamId: your Apple Developer Team ID
```

### 4. Configure Google credentials (Android)

Create a Google Play service account for automated uploads:

1. Go to Google Play Console → Setup → API access
2. Create a service account with "Release manager" permissions
3. Download the JSON key file
4. Save it as `apps/mobile/google-service-account.json`
5. **Do NOT commit this file** (it's in `.gitignore`)

## Build Commands

### Development builds (simulator/emulator)

```bash
# Both platforms
pnpm build:dev

# iOS simulator only
pnpm build:dev:ios

# Android emulator only
pnpm build:dev:android
```

### Preview builds (internal testing)

```bash
# Both platforms
pnpm build:preview

# iOS (ad-hoc distribution)
pnpm build:preview:ios

# Android (APK)
pnpm build:preview:android
```

### Production builds (store submission)

```bash
# Both platforms
pnpm build:production
```

## Local Development

```bash
# Start Metro bundler
pnpm start

# Start with specific platform
pnpm ios      # iOS simulator
pnpm android  # Android emulator

# Generate native projects (for local native builds)
pnpm prebuild
```

## OTA Updates

Push JavaScript updates without rebuilding native binaries:

```bash
# Push update to current channel
pnpm update

# Push update with message
eas update --message "fix: resolve crash on login screen"

# Push to specific branch
eas update --branch preview --message "hotfix: token refresh"
```

## EAS Build Profiles

| Profile       | Distribution | iOS             | Android    | Use Case          |
| ------------- | ------------ | --------------- | ---------- | ----------------- |
| `development` | internal     | Simulator build | Debug APK  | Local development |
| `preview`     | internal     | Ad-hoc IPA      | APK        | Internal testing  |
| `production`  | store        | App Store       | AAB bundle | Store submission  |

## Configuration Files

| File              | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `app.json`        | Static base Expo config                      |
| `app.config.js`   | Dynamic config (env-specific URLs, variants) |
| `eas.json`        | EAS build profiles and submit configuration  |
| `metro.config.js` | Metro bundler configuration                  |

## Troubleshooting

### "EAS_PROJECT_ID is not set"

Run `eas init` in the `apps/mobile` directory and export the UUID:

```bash
eas init
export EAS_PROJECT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Build fails with "No matching profile"

Ensure you're using a valid profile name from `eas.json`:

```bash
eas build --profile development --platform ios
```

### iOS build fails with signing errors

Re-configure credentials:

```bash
eas credentials --platform ios
```

### Android build fails with SDK version mismatch

Ensure `compileSdkVersion` matches what EAS expects. Run:

```bash
npx expo prebuild --clean
```

### Metro bundler won't start

Clear caches and restart:

```bash
npx expo start --clear
```

### Monorepo dependency issues

The project uses pnpm workspaces. If native modules fail to resolve:

```bash
# From repo root
pnpm install
cd apps/mobile
npx expo prebuild --clean
```

### Physical device can't reach dev server

Set your machine's LAN IP:

```bash
export API_HOST="192.168.1.xxx"
pnpm start
```

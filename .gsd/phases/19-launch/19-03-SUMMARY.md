---
phase: 19
plan: 03
status: complete
---

# 19-03 Summary: App Store & Play Store Submission

## Pre-Existing Implementation (verified)

1. **eas.json** — Submit profiles for iOS (appleId, ascAppId, appleTeamId) and Android
   (serviceAccountKeyPath, track: internal)
2. **Store assets** — `apps/mobile/assets/store/`: ios-description.txt,
   android-short-description.txt, keywords.txt, review-notes.txt, screenshots/
3. **release-mobile.yml** — 89-line GitHub Actions workflow with eas build + eas submit for both
   platforms
4. **deploy.yml** — build-mobile job with eas build

## New Work

1. **Version bump (T1)** — app.config.js: version 0.9.31 → 1.0.0, buildNumber 4 → 5, versionCode 4 →
   5 (commit `df94ba3a`)

## Blocked Items (require user action)

| Item                  | Why                                                     |
| --------------------- | ------------------------------------------------------- |
| EAS_PROJECT_ID        | Requires `eas init` with authenticated Expo account     |
| Apple Developer creds | Requires $99/year Apple Developer Program enrollment    |
| Google Play creds     | Requires $25 Google Play Console + service account JSON |
| Real screenshots      | Requires app running on real devices/simulators         |
| Store submission      | Requires T3 credentials configured first                |

## Files Modified

- apps/mobile/app.config.js (version bump)

## Deviations

- EAS_PROJECT_ID remains placeholder (`CONFIGURE_VIA_EAS_INIT`) — requires manual `eas init`
- Apple/Google credentials remain placeholders — user must enroll in developer programs
- Screenshots directory exists but empty — requires real device captures

## Verification

All automatable work complete. Manual credential setup documented in eas.json comments.

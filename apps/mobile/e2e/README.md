# CGraph Mobile E2E Testing with Maestro

# https://maestro.mobile.dev/

This directory contains Maestro E2E test flows for the CGraph mobile app.

## Setup

1. Install Maestro CLI:

   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. Start the app in development mode:

   ```bash
   cd apps/mobile
   npx expo start
   ```

3. Run tests:

   ```bash
   # Run all flows
   maestro test apps/mobile/e2e/

   # Run specific flow
   maestro test apps/mobile/e2e/auth/login.yaml

   # Run with cloud dashboard
   maestro cloud apps/mobile/e2e/
   ```

## Directory Structure

```
e2e/
├── README.md           # This file
├── config.yaml         # Global configuration
├── auth/               # Authentication flows
│   ├── login.yaml
│   ├── register.yaml
│   └── logout.yaml
├── navigation/         # Core navigation tests
│   └── main-tabs.yaml
├── messaging/          # Messaging feature tests
│   ├── conversations.yaml
│   └── send-message.yaml
└── groups/             # Group feature tests
    └── groups.yaml
```

## Environment Variables

Set these for CI:

- `MAESTRO_APP_ID`: Bundle ID (e.g., `org.cgraph.app.dev`)
- `MAESTRO_API_URL`: Backend API URL for test environment
- `TEST_USER_EMAIL`: Test user email
- `TEST_USER_PASSWORD`: Test user password

## CI Integration

Add to your CI workflow:

```yaml
- name: Run Maestro E2E tests
  run: |
    curl -Ls "https://get.maestro.mobile.dev" | bash
    export PATH="$PATH":"$HOME/.maestro/bin"
    maestro test apps/mobile/e2e/ --format junit --output maestro-report.xml
```

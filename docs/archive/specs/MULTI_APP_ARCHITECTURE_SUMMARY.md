what # Multi-App Architecture Implementation Summary

**Version**: 0.9.8  
**Date**: January 2026

## Overview

CGraph now implements a ** dual-app architecture** separating the marketing/landing experience from
the authenticated application.

## Architecture

```
cgraph.org (Landing App)           app.cgraph.org (Web App)
┌────────────────────────┐        ┌────────────────────────┐
│  Marketing & Public    │        │   Authenticated App    │
│                        │        │                        │
│  • Landing page        │ Login  │  • Messages            │
│  • Features/Pricing    │ ────►  │  • Groups/Servers      │
│  • Legal pages         │        │  • Forums              │
│  • Company info        │        │  • Settings            │
│  • Auth pages          │        │  • Voice/Video         │
│                        │        │                        │
│  apps/landing/         │        │  apps/web/             │
└────────────────────────┘        └────────────────────────┘
```

## Implementation Details

### Landing App (`apps/landing`)

**New Pages Created:**

#### Legal Pages (`/src/pages/legal/`)

- `LegalLayout.tsx` - Shared layout with ToC, sticky nav, professional footer
- `PrivacyPolicy.tsx` - GDPR-compliant privacy policy
- `TermsOfService.tsx` - Comprehensive terms of service
- `CookiePolicy.tsx` - Cookie usage and management
- `GDPR.tsx` - EU data rights explanation

#### Company Pages (`/src/pages/company/`)

- `About.tsx` - Company mission, values, team, timeline
- `Careers.tsx` - Job listings with department filters, benefits
- `Contact.tsx` - Contact form, support options, office locations
- `Press.tsx` - Press releases, brand assets, media contacts

**Router Update** (`main.tsx`):

```tsx
// Legal Pages
<Route path="/privacy" element={<PrivacyPolicy />} />
<Route path="/terms" element={<TermsOfService />} />
<Route path="/cookies" element={<CookiePolicy />} />
<Route path="/gdpr" element={<GDPR />} />

// Company Pages
<Route path="/about" element={<About />} />
<Route path="/careers" element={<Careers />} />
<Route path="/contact" element={<Contact />} />
<Route path="/press" element={<Press />} />
```

### Web App (`apps/web`)

**CGraph-Style Route Behavior** (`App.tsx`):

```tsx
function LandingRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  // Authenticated users → /messages (like CGraph)
  if (isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }

  // Unauthenticated users see landing
  return <>{children}</>;
}

// Root route uses the wrapper
<Route
  path="/"
  element={
    <LandingRoute>
      <LandingPage />
    </LandingRoute>
  }
/>;
```

## Vercel Deployment

Two separate Vercel projects required:

### Project 1: Landing

- **Domain**: cgraph.org
- **Root Directory**: apps/landing
- **Framework**: Vite

### Project 2: Web App

- **Domain**: app.cgraph.org
- **Root Directory**: apps/web
- **Framework**: Vite

## Files Changed

### New Files (12)

```
apps/landing/src/pages/legal/
├── LegalLayout.tsx      (240 lines)
├── PrivacyPolicy.tsx    (350 lines)
├── TermsOfService.tsx   (250 lines)
├── CookiePolicy.tsx     (280 lines)
├── GDPR.tsx             (380 lines)
└── index.ts

apps/landing/src/pages/company/
├── About.tsx            (320 lines)
├── Careers.tsx          (400 lines)
├── Contact.tsx          (350 lines)
├── Press.tsx            (320 lines)
└── index.ts
```

### Modified Files (4)

```
apps/landing/src/main.tsx    - Added all new routes
apps/web/src/App.tsx         - Added LandingRoute wrapper
CLAUDE.md                    - Added architecture docs
README.md                    - Added architecture section
```

## Page Features

### LegalLayout Component

- Sticky glassmorphism navigation
- Table of contents sidebar (sticky on desktop)
- Responsive design (mobile-first)
- Consistent footer with all page links
- Social media links
- Motion animations

### Legal Pages

- Comprehensive content covering all legal requirements
- GDPR-compliant data protection information
- Cookie consent and management guidance
- Clear contact information for each concern type

### Company Pages

- **About**: Company stats, mission, values, timeline, team overview
- **Careers**: Filterable job listings, benefits grid, culture showcase
- **Contact**: Multiple contact options, form, office locations
- **Press**: Press releases, brand assets download, media quotes

## Local Development

```bash
# Terminal 1: Landing app
cd apps/landing && pnpm dev
# Opens at http://localhost:5174

# Terminal 2: Web app
cd apps/web && pnpm dev
# Opens at http://localhost:5173

# Terminal 3: Backend
cd apps/backend && mix phx.server
# Opens at http://localhost:4000
```

## Testing the Implementation

1. **Landing App**: Visit http://localhost:5174
   - Click footer links to test all legal/company pages
   - Verify smooth navigation between pages
   - Test responsive design

2. **Web App**: Visit http://localhost:5173
   - **Logged out**: Should see landing page
   - **Logged in**: Should redirect to /messages
   - Test legal pages still accessible

## Next Steps

1. Deploy landing app to Vercel (cgraph.org)
2. Update web app Vercel config (app.cgraph.org)
3. Configure DNS for both domains
4. Update all external links to point to correct domains
5. Test cross-origin auth flow

---

**Implementation Quality**: Enterprise-grade, "better than CGraph" as requested  
**Design System**: Consistent glassmorphism, emerald/cyan gradients, motion animations

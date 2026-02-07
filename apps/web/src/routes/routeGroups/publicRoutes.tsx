/**
 * Public route definitions (legal, company, landing)
 *
 * @module routes/routeGroups/publicRoutes
 */

import { Route } from 'react-router-dom';
import { LandingRoute } from '../guards';
import {
  LandingPage,
  PrivacyPolicy,
  TermsOfService,
  CookiePolicy,
  GDPR,
  About,
  Contact,
  Careers,
  Press,
  Status,
  Blog,
  Documentation,
} from '../lazyPages';

/** Landing page route */
export function LandingRoutes() {
  return (
    <Route
      path="/"
      element={
        <LandingRoute>
          <LandingPage />
        </LandingRoute>
      }
    />
  );
}

/** Legal pages (privacy, terms, cookies, GDPR) */
export function LegalRoutes() {
  return (
    <>
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/gdpr" element={<GDPR />} />
    </>
  );
}

/** Company pages (about, contact, careers, etc.) */
export function CompanyRoutes() {
  return (
    <>
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/press" element={<Press />} />
      <Route path="/status" element={<Status />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/docs" element={<Documentation />} />
    </>
  );
}

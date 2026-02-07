/**
 * Dev/Test route definitions
 *
 * @module routes/routeGroups/devRoutes
 */

import { Route } from 'react-router-dom';
import { MatrixTest, EnhancedDemo, ThemeApplicationTest, LandingDemoWorkshop } from '../lazyPages';

/** Dev/test routes — only accessible in non-production */
export function DevRoutes() {
  return (
    <>
      <Route path="/test/matrix" element={<MatrixTest />} />
      <Route path="/test/enhanced" element={<EnhancedDemo />} />
      <Route path="/test/theme" element={<ThemeApplicationTest />} />
      <Route path="/demo/workshop" element={<LandingDemoWorkshop />} />
    </>
  );
}

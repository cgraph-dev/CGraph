/**
 * Forum Customization Page
 *
 * Route: /forums/:forumId/customize
 * Renders the full customization center for forum admins/owners.
 *
 * @module modules/forums/pages
 */

import { useParams } from 'react-router-dom';
import { CustomizationCenter } from '../components/customization-center';

export default function ForumCustomizationPage() {
  const { forumId } = useParams<{ forumId: string }>();

  if (!forumId) {
    return (
      <div className="flex items-center justify-center h-96 text-white/50">
        Forum not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <CustomizationCenter forumId={forumId} isOwner />
    </div>
  );
}

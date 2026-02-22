/**
 * AccessRestricted component
 * @module pages/forums/moderation-queue
 */

import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export function AccessRestricted() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <ShieldCheckIcon className="mb-4 h-16 w-16 text-gray-600" />
      <h2 className="mb-2 text-xl font-bold text-white">Access Restricted</h2>
      <p className="text-center text-gray-400">
        You need moderator permissions to access the moderation queue.
      </p>
      <Link
        to="/forums"
        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        Back to Forums
      </Link>
    </div>
  );
}

/**
 * Online Page Legend
 */

import { EyeIcon, ComputerDesktopIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

export function OnlineLegend() {
  return (
    <div className="bg-card border-border mt-6 rounded-lg border p-4">
      <h3 className="text-foreground mb-3 text-sm font-semibold">Legend</h3>
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Online Member</span>
        </div>
        <div className="flex items-center gap-2">
          <EyeIcon className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground">Guest</span>
        </div>
        <div className="flex items-center gap-2">
          <ComputerDesktopIcon className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground">Desktop</span>
        </div>
        <div className="flex items-center gap-2">
          <DevicePhoneMobileIcon className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground">Mobile</span>
        </div>
      </div>
    </div>
  );
}

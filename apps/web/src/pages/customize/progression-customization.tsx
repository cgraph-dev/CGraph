/**
 * ProgressionCustomization — Progression category panel
 *
 * Links to title selection and badge selection pages,
 * and shows current equipped items summary.
 */

import { Link } from 'react-router-dom';
import { Award, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { InlineTitle } from '@/shared/components/ui/inline-title';
import { InlineBadges } from '@/shared/components/ui/inline-badges';

const PROGRESSION_LINKS = [
  {
    to: '/settings/titles',
    icon: Sparkles,
    label: 'Titles',
    description: 'Browse and equip titles that appear next to your username',
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    to: '/settings/badges',
    icon: Award,
    label: 'Badges',
    description: 'Equip up to 5 badges to showcase on your profile',
    gradient: 'from-purple-500 to-indigo-500',
  },
] as const;

/** Renders the progression category in the Customize hub with equipped items summary. */
export default function ProgressionCustomization() {
  const equippedTitle = useCustomizationStore((s) => s.equippedTitle);
  const equippedBadges = useCustomizationStore((s) => s.equippedBadges) ?? [];

  return (
    <div className="space-y-6">
      {/* Current Equipment Summary */}
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
          <Trophy className="h-4 w-4" />
          Currently Equipped
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Title</span>
            {equippedTitle ? (
              <InlineTitle titleId={equippedTitle} size="sm" />
            ) : (
              <span className="text-sm text-white/30">None equipped</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Badges</span>
            {equippedBadges.length > 0 ? (
              <InlineBadges badgeIds={equippedBadges} maxDisplay={5} size="sm" />
            ) : (
              <span className="text-sm text-white/30">None equipped</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-3">
        {PROGRESSION_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="group flex items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4 transition-all hover:border-white/[0.15] hover:bg-white/[0.04]"
            >
              <div className={`rounded-lg bg-gradient-to-r ${link.gradient} p-2.5`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{link.label}</h4>
                <p className="text-sm text-white/50">{link.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white/60" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

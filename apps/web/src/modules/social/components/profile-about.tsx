/**
 * ProfileAbout — info section with bio, location, joined date, links.
 * @module modules/social/components/profile-about
 */
import { cn } from '@/lib/utils';

interface ConnectedAccount {
  platform: string;
  username: string;
  url?: string;
  icon: string;
}

interface ProfileAboutProps {
  bio?: string;
  location?: string;
  website?: string;
  joinedDate?: string;
  lastActive?: string;
  connectedAccounts?: ConnectedAccount[];
  customFields?: { label: string; value: string }[];
  className?: string;
}

/**
 * ProfileAbout — bio, info rows, connected accounts, custom fields.
 */
export function ProfileAbout({
  bio,
  location,
  website,
  joinedDate,
  lastActive,
  connectedAccounts = [],
  customFields = [],
  className,
}: ProfileAboutProps) {
  return (
    <div className={cn('space-y-5 px-6 py-4', className)}>
      {/* Bio */}
      {bio && (
        <div>
          <SectionLabel>About Me</SectionLabel>
          <p className="text-sm leading-relaxed text-white/70">{bio}</p>
        </div>
      )}

      {/* Info rows */}
      <div className="space-y-2.5">
        <SectionLabel>Information</SectionLabel>
        {location && <InfoRow icon="📍" label="Location" value={location} />}
        {website && (
          <InfoRow
            icon="🔗"
            label="Website"
            value={
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00AFF4] hover:underline"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            }
          />
        )}
        {joinedDate && <InfoRow icon="📅" label="Joined" value={joinedDate} />}
        {lastActive && <InfoRow icon="🕐" label="Last active" value={lastActive} />}
      </div>

      {/* Connected accounts */}
      {connectedAccounts.length > 0 && (
        <div>
          <SectionLabel>Connected Accounts</SectionLabel>
          <div className="space-y-1.5">
            {connectedAccounts.map((account) => (
              <a
                key={account.platform}
                href={account.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
              >
                <span className="text-base">{account.icon}</span>
                <div>
                  <p className="text-xs font-medium text-white/80">{account.platform}</p>
                  <p className="text-[11px] text-white/40">{account.username}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Custom fields */}
      {customFields.length > 0 && (
        <div>
          <SectionLabel>Custom Fields</SectionLabel>
          <div className="space-y-2">
            {customFields.map((field) => (
              <div key={field.label}>
                <p className="text-[11px] font-medium text-white/30">{field.label}</p>
                <p className="text-sm text-white/70">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/30">
      {children}
    </h3>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-center text-xs">{icon}</span>
      <span className="text-white/40">{label}:</span>
      <span className="text-white/70">{typeof value === 'string' ? value : value}</span>
    </div>
  );
}

export default ProfileAbout;

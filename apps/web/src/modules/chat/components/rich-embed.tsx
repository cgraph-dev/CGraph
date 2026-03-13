/**
 * RichEmbed — OG link‑preview cards inside messages.
 * @module chat/components/rich-embed
 */
import { cn } from '@/lib/utils';

interface EmbedMedia {
  type: 'image' | 'video' | 'thumbnail';
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface RichEmbedProps {
  /** Accent color bar on left edge (hex) */
  color?: string;
  provider?: string;
  author?: { name: string; url?: string; iconUrl?: string };
  title?: string;
  titleUrl?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  media?: EmbedMedia;
  thumbnail?: { url: string; alt?: string };
  footer?: { text: string; iconUrl?: string };
  timestamp?: string;
  className?: string;
}

/**
 * Discord-style rich embed card (OG preview / bot embed).
 */
export function RichEmbed({
  color = '#5865F2',
  provider,
  author,
  title,
  titleUrl,
  description,
  fields,
  media,
  thumbnail,
  footer,
  timestamp,
  className,
}: RichEmbedProps) {
  return (
    <div
      className={cn(
        'mt-1 flex max-w-[432px] rounded-md',
        'border border-white/[0.04] bg-[rgb(22,22,30)]',
        'overflow-hidden',
        className
      )}
    >
      {/* Accent bar */}
      <div className="w-1 flex-shrink-0 rounded-l" style={{ backgroundColor: color }} />

      <div className="flex min-w-0 flex-1 gap-3 p-3">
        {/* Text column */}
        <div className="min-w-0 flex-1">
          {/* Provider */}
          {provider && (
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-white/30">
              {provider}
            </p>
          )}

          {/* Author */}
          {author && (
            <div className="mb-1 flex items-center gap-1.5">
              {author.iconUrl && (
                <img src={author.iconUrl} alt="" className="h-4 w-4 rounded-full" />
              )}
              {author.url ? (
                <a
                  href={author.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-white/80 hover:underline"
                >
                  {author.name}
                </a>
              ) : (
                <span className="text-xs font-semibold text-white/80">{author.name}</span>
              )}
            </div>
          )}

          {/* Title */}
          {title && (
            <div className="mb-1">
              {titleUrl ? (
                <a
                  href={titleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#00AFF4] hover:underline"
                >
                  {title}
                </a>
              ) : (
                <p className="text-sm font-semibold text-white/90">{title}</p>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="mb-2 line-clamp-3 text-[13px] leading-snug text-white/60">
              {description}
            </p>
          )}

          {/* Fields */}
          {fields && fields.length > 0 && (
            <div className="mb-2 grid grid-cols-3 gap-2">
              {fields.map((f, i) => (
                <div key={i} className={cn(!f.inline && 'col-span-3')}>
                  <p className="text-[11px] font-semibold uppercase text-white/40">{f.name}</p>
                  <p className="text-[13px] text-white/70">{f.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Large image / video */}
          {media && media.type !== 'thumbnail' && (
            <div className="mt-2 overflow-hidden rounded">
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={media.alt ?? ''}
                  className="max-h-[300px] w-full rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={media.url}
                  className="max-h-[300px] w-full rounded object-cover"
                  controls
                />
              )}
            </div>
          )}

          {/* Footer */}
          {(footer || timestamp) && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/30">
              {footer?.iconUrl && (
                <img src={footer.iconUrl} alt="" className="h-4 w-4 rounded-full" />
              )}
              {footer?.text && <span>{footer.text}</span>}
              {footer?.text && timestamp && <span>•</span>}
              {timestamp && <span>{timestamp}</span>}
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {thumbnail && (
          <img
            src={thumbnail.url}
            alt={thumbnail.alt ?? ''}
            className="h-16 w-16 flex-shrink-0 rounded object-cover"
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}

export default RichEmbed;

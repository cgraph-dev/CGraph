import React from 'react';

export interface NeonIconProps {
  symbol: string;
  size?: number;
  className?: string;
  color?: string;
  title?: string;
}

type IconName =
  | 'rocket'
  | 'chat'
  | 'lock'
  | 'building'
  | 'list'
  | 'gamepad'
  | 'video'
  | 'shield'
  | 'mobile'
  | 'architecture'
  | 'mail'
  | 'bulb'
  | 'news'
  | 'scale'
  | 'download'
  | 'upload'
  | 'trash'
  | 'globe'
  | 'bolt'
  | 'sync'
  | 'moon'
  | 'robot'
  | 'apple'
  | 'window'
  | 'linux'
  | 'plug'
  | 'key'
  | 'phone'
  | 'folder'
  | 'status'
  | 'clock'
  | 'link'
  | 'chart'
  | 'bell'
  | 'map'
  | 'ruler'
  | 'users'
  | 'home'
  | 'user'
  | 'search'
  | 'check'
  | 'diamond'
  | 'ban'
  | 'target'
  | 'gear'
  | 'spark'
  | 'cloud'
  | 'database'
  | 'atom'
  | 'heart'
  | 'document'
  | 'note'
  | 'fallback';

const SYMBOL_TO_ICON: Record<string, IconName> = {
  '🚀': 'rocket',
  '💬': 'chat',
  '🔐': 'lock',
  '🏛️': 'building',
  '📋': 'list',
  '🎮': 'gamepad',
  '📹': 'video',
  '🛡️': 'shield',
  '📱': 'mobile',
  '🏗️': 'architecture',
  '📧': 'mail',
  '💡': 'bulb',
  '📰': 'news',
  '⚖️': 'scale',
  '📥': 'download',
  '📤': 'upload',
  '🗑️': 'trash',
  '🌐': 'globe',
  '⚡': 'bolt',
  '🔄': 'sync',
  '🌙': 'moon',
  '🤖': 'robot',
  '🍎': 'apple',
  '🪟': 'window',
  '🐧': 'linux',
  '🔌': 'plug',
  '🔑': 'key',
  '📞': 'phone',
  '📁': 'folder',
  '🟢': 'status',
  '⏱️': 'clock',
  '✉️': 'mail',
  '🔗': 'link',
  '📈': 'chart',
  '🔔': 'bell',
  '📊': 'chart',
  '🌍': 'map',
  '📐': 'ruler',
  '👥': 'users',
  '🏠': 'home',
  '👤': 'user',
  '🔍': 'search',
  '✓': 'check',
  '✅': 'check',
  '◆': 'diamond',
  '⊘': 'ban',
  '◉': 'target',
  '🎯': 'target',
  '⚙️': 'gear',
  '✨': 'spark',
  '☁️': 'cloud',
  '🐘': 'database',
  '⚛️': 'atom',
  '💜': 'heart',
  '📄': 'document',
  '📝': 'note',
};

function resolveIcon(symbol: string): IconName {
  return SYMBOL_TO_ICON[symbol] ?? 'fallback';
}

function IconGlyph({ icon }: { icon: IconName }): React.JSX.Element {
  switch (icon) {
    case 'rocket':
      return (
        <path className="neon-icon__stroke" d="M9 17l-2 2m8-6l2-2m-8 2L4 8l7-3 6 6-3 7-5-5z" />
      );
    case 'chat':
      return (
        <path
          className="neon-icon__stroke"
          d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H10l-4 4V16H6.5A2.5 2.5 0 014 13.5v-7z"
        />
      );
    case 'lock':
      return (
        <>
          <rect className="neon-icon__stroke" x="5" y="10" width="14" height="10" rx="2.2" />
          <path className="neon-icon__stroke" d="M8 10V8a4 4 0 118 0v2" />
        </>
      );
    case 'building':
      return (
        <>
          <path className="neon-icon__stroke" d="M4 20h16M6 20V10h12v10M12 10V4M8 8h8" />
          <path className="neon-icon__fill" d="M6 10h12v10H6z" />
        </>
      );
    case 'list':
      return (
        <path className="neon-icon__stroke" d="M8 7h11M8 12h11M8 17h11M4 7h.01M4 12h.01M4 17h.01" />
      );
    case 'gamepad':
      return (
        <path
          className="neon-icon__stroke"
          d="M7.5 9h9a3.5 3.5 0 013.4 4.3l-.7 2.8a2.5 2.5 0 01-3.9 1.4L13 16h-2l-2.3 1.5a2.5 2.5 0 01-3.9-1.4l-.7-2.8A3.5 3.5 0 017.5 9zM9 12v2m-1-1h2m6-1h.01m2 2h.01"
        />
      );
    case 'video':
      return (
        <path
          className="neon-icon__stroke"
          d="M4 8.5A2.5 2.5 0 016.5 6h8A2.5 2.5 0 0117 8.5v7a2.5 2.5 0 01-2.5 2.5h-8A2.5 2.5 0 014 15.5v-7zM17 10l3-2v8l-3-2"
        />
      );
    case 'shield':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 3l7 3v6c0 4-2.5 6.8-7 9-4.5-2.2-7-5-7-9V6l7-3z"
        />
      );
    case 'mobile':
      return (
        <path
          className="neon-icon__stroke"
          d="M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2zm3 15h.01"
        />
      );
    case 'architecture':
      return (
        <path className="neon-icon__stroke" d="M5 8l7-4 7 4-7 4-7-4zm0 8l7 4 7-4M5 8v8m14-8v8" />
      );
    case 'mail':
      return (
        <path
          className="neon-icon__stroke"
          d="M4 7.5A1.5 1.5 0 015.5 6h13A1.5 1.5 0 0120 7.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 16.5v-9zM4 8l8 6 8-6"
        />
      );
    case 'bulb':
      return (
        <path
          className="neon-icon__stroke"
          d="M9 15h6m-5 3h4m-6-7a4 4 0 118 0c0 1.3-.6 2.1-1.4 3-.6.6-.9 1-.9 2h-3.4c0-1-.3-1.4-.9-2-.8-.9-1.4-1.7-1.4-3z"
        />
      );
    case 'news':
      return (
        <path className="neon-icon__stroke" d="M5 6h14v12H7a2 2 0 01-2-2V6zm4 4h6m-6 3h6M7 9h.01" />
      );
    case 'scale':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 4v16M8 7h8M7 20h10M6 10l-2 4h4l-2-4zm12 0l-2 4h4l-2-4"
        />
      );
    case 'download':
      return <path className="neon-icon__stroke" d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14" />;
    case 'upload':
      return <path className="neon-icon__stroke" d="M12 20V9m0 0l-4 4m4-4l4 4M5 4h14" />;
    case 'trash':
      return (
        <path className="neon-icon__stroke" d="M6 7h12M9 7V5h6v2m-8 0l1 12h8l1-12M10 10v6m4-6v6" />
      );
    case 'globe':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0c2.5 2.3 4 5.6 4 9s-1.5 6.7-4 9m0-18c-2.5 2.3-4 5.6-4 9s1.5 6.7 4 9m-8-9h16"
        />
      );
    case 'bolt':
      return <path className="neon-icon__stroke" d="M13 3L6 13h5l-1 8 8-12h-5l0-6z" />;
    case 'sync':
      return (
        <path
          className="neon-icon__stroke"
          d="M20 7v5h-5M4 17v-5h5M7 8a7 7 0 0111 2M17 16a7 7 0 01-11-2"
        />
      );
    case 'moon':
      return <path className="neon-icon__stroke" d="M14 4a7 7 0 108 8 8 8 0 11-8-8z" />;
    case 'robot':
      return (
        <path
          className="neon-icon__stroke"
          d="M9 4h6M12 4V2M7 9h10a2 2 0 012 2v5a3 3 0 01-3 3H8a3 3 0 01-3-3v-5a2 2 0 012-2zm2 4h.01m6 0h.01"
        />
      );
    case 'apple':
      return (
        <path
          className="neon-icon__stroke"
          d="M16.5 12.5c0 3.5-2 6.5-4.5 6.5S7.5 16 7.5 12.5c0-2.7 1.7-4.5 4-4.5s5 1.8 5 4.5zM12 5c1-.8 1.4-1.6 1.5-3-1.1.1-2.1.7-2.8 1.6"
        />
      );
    case 'window':
      return <path className="neon-icon__stroke" d="M4 4h16v16H4zM12 4v16M4 12h16" />;
    case 'linux':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 4c2 0 3 1.5 3 4v3.5a3 3 0 01-6 0V8c0-2.5 1-4 3-4zm-4 11l1.5 4M16 15l-1.5 4M9.5 10h.01m5 0h.01"
        />
      );
    case 'plug':
      return (
        <path
          className="neon-icon__stroke"
          d="M9 3v5m6-5v5m-8 0h10v2a5 5 0 01-5 5H12a5 5 0 01-5-5V8zm5 7v6"
        />
      );
    case 'key':
      return (
        <path
          className="neon-icon__stroke"
          d="M14 12a4 4 0 11-8 0 4 4 0 018 0zm0 0h6m-2 0v3m-2-3v2"
        />
      );
    case 'phone':
      return (
        <path
          className="neon-icon__stroke"
          d="M6 4h4l2 5-2.5 2.5a14 14 0 006 6L18 15l5 2v4a2 2 0 01-2 2C11 23 1 13 1 3a2 2 0 012-2h3z"
        />
      );
    case 'folder':
      return (
        <path
          className="neon-icon__stroke"
          d="M3 7.5A1.5 1.5 0 014.5 6H10l2 2h7.5A1.5 1.5 0 0121 9.5v8A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5v-10z"
        />
      );
    case 'status':
      return <circle className="neon-icon__fill" cx="12" cy="12" r="5.5" />;
    case 'clock':
      return <path className="neon-icon__stroke" d="M12 5a7 7 0 100 14 7 7 0 000-14zm0 2v5l3 2" />;
    case 'link':
      return (
        <path
          className="neon-icon__stroke"
          d="M10 14l4-4m-6 7H6a3 3 0 010-6h3m4 0h3a3 3 0 010 6h-2"
        />
      );
    case 'chart':
      return <path className="neon-icon__stroke" d="M4 19h16M7 16v-4m5 4V8m5 8v-6" />;
    case 'bell':
      return (
        <path
          className="neon-icon__stroke"
          d="M18 16H6l1.5-2v-3a4.5 4.5 0 119 0v3L18 16zm-4.5 2a1.5 1.5 0 01-3 0"
        />
      );
    case 'map':
      return (
        <path
          className="neon-icon__stroke"
          d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zm6-2v14m6-12v14"
        />
      );
    case 'ruler':
      return <path className="neon-icon__stroke" d="M4 16l8-8 8 8-8 8-8-8zm6-2l4 4m-1-7l4 4" />;
    case 'users':
      return (
        <path
          className="neon-icon__stroke"
          d="M9 12a3 3 0 100-6 3 3 0 000 6zm6 2a2.5 2.5 0 10-2.2-3.7M3 20a6 6 0 0112 0m3 0a4 4 0 00-3.5-3.9"
        />
      );
    case 'home':
      return <path className="neon-icon__stroke" d="M4 11l8-7 8 7M6 10v9h12v-9" />;
    case 'user':
      return (
        <path className="neon-icon__stroke" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0" />
      );
    case 'search':
      return <path className="neon-icon__stroke" d="M11 18a7 7 0 100-14 7 7 0 000 14zm9 3l-4-4" />;
    case 'check':
      return <path className="neon-icon__stroke" d="M5 12l4 4 10-10" />;
    case 'diamond':
      return <path className="neon-icon__stroke" d="M12 4l6 8-6 8-6-8 6-8z" />;
    case 'ban':
      return <path className="neon-icon__stroke" d="M12 5a7 7 0 100 14 7 7 0 000-14zm-5 5l10 8" />;
    case 'target':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 3a5 5 0 100 10 5 5 0 000-10zm0 5h.01"
        />
      );
    case 'gear':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm8 3.5l-2 .7a6.5 6.5 0 01-.6 1.4l1.1 1.8-1.7 1.7-1.8-1.1a6.5 6.5 0 01-1.4.6L12 20l-2.6-.9a6.5 6.5 0 01-1.4-.6l-1.8 1.1-1.7-1.7 1.1-1.8a6.5 6.5 0 01-.6-1.4L2 12l.9-2.6a6.5 6.5 0 01.6-1.4L2.4 6.2l1.7-1.7 1.8 1.1a6.5 6.5 0 011.4-.6L12 2l2.6.9a6.5 6.5 0 011.4.6l1.8-1.1 1.7 1.7-1.1 1.8a6.5 6.5 0 01.6 1.4L20 12z"
        />
      );
    case 'spark':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3zm7 12l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15zM5 14l.7 1.6L7.3 16l-1.6.7L5 18.3l-.7-1.6L2.7 16l1.6-.7L5 14z"
        />
      );
    case 'cloud':
      return (
        <path
          className="neon-icon__stroke"
          d="M8 18h8a4 4 0 100-8 5 5 0 10-9.7 1.3A3.5 3.5 0 008 18z"
        />
      );
    case 'database':
      return (
        <path
          className="neon-icon__stroke"
          d="M5 7c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zm0 5c0 1.7 3.1 3 7 3s7-1.3 7-3m-14 5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"
        />
      );
    case 'atom':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 12m-1.5 0a1.5 1.5 0 103 0 1.5 1.5 0 10-3 0zM4 12c0-2.5 3.6-4.5 8-4.5s8 2 8 4.5-3.6 4.5-8 4.5-8-2-8-4.5zm4.2-6.5c2.2-1.2 5.6.4 7.6 3.5s2 6.7-.2 7.9-5.6-.4-7.6-3.5-2-6.7.2-7.9zm7.6 0c2.2 1.2 2.3 4.8.2 7.9s-5.4 4.7-7.6 3.5-2.3-4.8-.2-7.9 5.4-4.7 7.6-3.5z"
        />
      );
    case 'heart':
      return (
        <path
          className="neon-icon__stroke"
          d="M12 20s-7-4.3-7-9.2A4.3 4.3 0 019.3 6c1.3 0 2.2.6 2.7 1.5.5-.9 1.4-1.5 2.7-1.5A4.3 4.3 0 0119 10.8C19 15.7 12 20 12 20z"
        />
      );
    case 'document':
      return <path className="neon-icon__stroke" d="M7 3h7l4 4v14H7V3zm7 0v4h4M9 12h6M9 16h6" />;
    case 'note':
      return <path className="neon-icon__stroke" d="M7 3h10v18H7V3zm3 5h4M10 12h4M10 16h3" />;
    case 'fallback':
    default:
      return (
        <path
          className="neon-icon__stroke"
          d="M12 3l2.5 5.5L20 10l-5.5 2.5L12 18l-2.5-5.5L4 10l5.5-1.5L12 3z"
        />
      );
  }
}

export function NeonIcon({
  symbol,
  size = 24,
  className,
  color,
  title,
}: NeonIconProps): React.JSX.Element {
  const icon = resolveIcon(symbol);

  return (
    <span
      className={['neon-icon', className].filter(Boolean).join(' ')}
      style={{ width: `${size}px`, height: `${size}px`, color }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <svg viewBox="0 0 24 24" fill="none">
        <IconGlyph icon={icon} />
      </svg>
    </span>
  );
}

export default NeonIcon;

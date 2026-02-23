import React from 'react';

export type ForumIconVariant =
  | 'announcement'
  | 'news'
  | 'event'
  | 'community'
  | 'welcome'
  | 'chat'
  | 'rocket'
  | 'support'
  | 'question'
  | 'bug'
  | 'idea'
  | 'target'
  | 'folder'
  | 'palette'
  | 'stats'
  | 'lock'
  | 'bolt'
  | 'clipboard'
  | 'tag'
  | 'shield'
  | 'pin'
  | 'move'
  | 'split'
  | 'link'
  | 'warning'
  | 'eye';

interface ForumNeonIconProps {
  variant: ForumIconVariant;
  className?: string;
  delay?: number;
  color?: string;
}

export function ForumNeonIcon({ variant, className = '', delay = 0, color }: ForumNeonIconProps) {
  const style = {
    '--feature-icon-delay': `${delay}s`,
    color: color || 'inherit',
  } as React.CSSProperties;

  const shared = {
    className: 'feature-card__icon-svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.7,
  };

  const renderPath = () => {
    switch (variant) {
      case 'announcement':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.34 15.84c-.68.34-1.42.51-2.18.51-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5c.76 0 1.5.17 2.18.51l8.16-4.08v16.16l-8.16-4.08zM18.5 7.5v9m-11.5-6h.01"
          />
        );
      case 'news':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 7.5h6m-6 4.5h6m-6 4.5h6M5.25 7.5h.008v.008H5.25V7.5zm0 4.5h.008v.008H5.25V12.5zm0 4.5h.008v.008H5.25V17.5zM6.75 22.5a.75.75 0 01-.75-.75V2.25a.75.75 0 011.5 0v19.5a.75.75 0 01-.75.75z"
          />
        );
      case 'event':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
          />
        );
      case 'community':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        );
      case 'welcome':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075.03c.456.18 1.458.621 1.458 1.72v.225c0 .33.27.6.6.6a.6.6 0 00.6-.6V7.05a1.5 1.5 0 013 0v.6c0 .33.27.6.6.6a.6.6 0 00.6-.6v-.3a1.5 1.5 0 013 0v7.05a9 9 0 01-18 0V11.25a1.5 1.5 0 113 0v4.6c0 .33.27.6.6.6a.6.6 0 00.6-.6V4.575z"
          />
        );
      case 'chat':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0.247 0.247 0 00.185.39c1.077 0 2.164-.32 3.102-.91a1.442 1.442 0 011.53-.131A8.932 8.932 0 0012 20.25z"
          />
        );
      case 'rocket':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.59 1.15a14.99 14.99 0 00-6.16 12.12c0 1.956.37 3.824 1.05 5.53m15.1-17.65c-1.35 1.49-2.7 3.03-4.14 4.54m-2.46 2.46l-4.14 4.14m-1.57-1.57a3.03 3.03 0 01-4.28 0m4.28 0l-1.56-1.56"
          />
        );
      case 'support':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 11-5.304-5.304 3.75 3.75 0 015.304 5.304zm6-10.35a2.652 2.652 0 113.75 3.75 2.652 2.652 0 01-3.75-3.75z"
          />
        );
      case 'question':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        );
      case 'bug':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m-2-2h4m-7-4.5h.01m10.99 0h.01M4.5 9h.01M19.5 9h.01M5.625 12h.01m12.75 0h.01M3 15h2.25m13.5 0H21m-14.25 3h.01m10.49 0h.01M12 21.75V19.5M12 4.5V2.25M6.75 4.5L5.25 3m12 1.5L18.75 3M6.75 19.5L5.25 21m12-1.5L18.75 21"
          />
        );
      case 'idea':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-3m0 0a8.12 8.12 0 005-8.33 8.59 8.59 0 01-5-1.67 8.59 8.59 0 01-5 1.67A8.12 8.12 0 0012 15z"
          />
        );
      case 'target':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0m9-3.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0 -7m0 2.5a1 1 0 1 0 0 2a1 1 0 1 0 0 -2"
          />
        );
      case 'folder':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a2.25 2.25 0 011.59.659l2.122 2.121a2.25 2.25 0 001.591.659H18a2.25 2.25 0 012.25 2.25v1.776"
          />
        );
      case 'palette':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
          />
        );
      case 'stats':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          />
        );
      case 'lock':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        );
      case 'bolt':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        );
      case 'clipboard':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.492 1.084 1.24 1.084 2.112v12a2.25 2.25 0 01-2.25 2.25H9a2.25 2.25 0 01-2.25-2.25v-12c0-.872.438-1.62 1.084-2.112"
          />
        );
      case 'tag':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.659A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z"
          />
        );
      case 'shield':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.96 11.96 0 013.598 6 11.99 11.99 0 003 9.744c0 1.947.466 3.784 1.294 5.41a12.04 12.04 0 009.61 7.593c.31.042.625.063.944.063a12.054 12.054 0 009.61-7.593 11.99 11.99 0 001.294-5.41c0-1.306-.208-2.564-.598-3.743A11.959 11.959 0 0112 2.714z"
          />
        );
      case 'pin':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11.25l1.5 1.5.75-.75V8.75a3 3 0 00-3-3h-1.5m-3.5 15L12 18.75m0 0l3.75-3.75M12 18.75l-3.75-3.75M9 13.5V9.75a3 3 0 013-3h2.25m3 4.5l-3 3.75-3.75 3"
          />
        );
      case 'move':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        );
      case 'split':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7.5h18M3 16.5h18M12 7.5v9m-4.5-5.25L3 12m0 0l4.5 9.75M16.5 6.75L21 12m0 0l-4.5 5.25"
          />
        );
      case 'link':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 016.364 6.364l-1.757 1.757a4.5 4.5 0 01-6.364 0m1.757-9.879a4.5 4.5 0 00-6.364 0L5.07 8.687a4.5 4.5 0 000 6.364m3.182-3.182l7.5-7.5"
          />
        );
      case 'warning':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 12.376zM12 15.75h.007v.008H12v-.008z"
          />
        );
      case 'eye':
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
          />
        );
      default:
        return null;
    }
  };

  return (
    <span className={`${className} inline-flex items-center justify-center`}>
      <span className="feature-card__icon-neon" style={style} aria-hidden="true">
        <svg {...shared}>{renderPath()}</svg>
      </span>
    </span>
  );
}

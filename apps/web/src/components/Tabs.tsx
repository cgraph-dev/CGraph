

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabsProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const getTabClasses = (isActive: boolean) => {
    const base = `${sizeClasses[size]} font-medium transition-all flex items-center gap-2`;

    switch (variant) {
      case 'pills':
        return `${base} rounded-full transform active:scale-95 ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-dark-700'
        }`;
      case 'underline':
        return `${base} border-b-2 transform active:scale-95 ${
          isActive
            ? 'border-primary-500 text-white'
            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
        }`;
      default:
        return `${base} rounded-lg transform active:scale-95 ${
          isActive
            ? 'bg-dark-700 text-white'
            : 'text-gray-400 hover:text-white hover:bg-dark-800'
        }`;
    }
  };

  return (
    <div
      className={`flex ${variant === 'underline' ? 'border-b border-dark-700' : 'gap-1 bg-dark-800/50 p-1 rounded-lg'} ${
        fullWidth ? 'w-full' : 'inline-flex'
      } ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`${getTabClasses(activeTab === tab.id)} ${fullWidth ? 'flex-1' : ''}`}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
              {tab.badge > 99 ? '99+' : tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Tab Panels wrapper
interface TabPanelProps {
  children: React.ReactNode;
  activeTab: string;
  tabId: string;
}

export function TabPanel({ children, activeTab, tabId }: TabPanelProps) {
  if (activeTab !== tabId) return null;
  return <div className="animate-fadeIn">{children}</div>;
}

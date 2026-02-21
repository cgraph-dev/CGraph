/**
 * TopNav Component
 *
 * Top navigation bar with search, notifications, and user menu.
 * Delegates notification panel and user dropdown to extracted sub-components.
 *
 * @module components/layout/TopNav
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { NotificationDropdown } from './nav/NotificationDropdown';
import { UserDropdown } from './nav/UserDropdown';

export interface TopNavProps {
  variant?: 'default' | 'transparent' | 'solid';
  showSearch?: boolean;
  showBreadcrumbs?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  className?: string;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function TopNav({
  variant = 'default',
  showSearch = true,
  showBreadcrumbs = true,
  showNotifications = true,
  showUserMenu = true,
  onMenuToggle,
  isMobileMenuOpen = false,
  className = '',
}: TopNavProps): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = true;
  const toggleDarkMode = () => {};

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    return pathSegments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      path:
        index < pathSegments.length - 1
          ? '/' + pathSegments.slice(0, index + 1).join('/')
          : undefined,
    }));
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getBackgroundClass = () => {
    switch (variant) {
      case 'transparent':
        return 'bg-transparent';
      case 'solid':
        return 'bg-dark-900';
      default:
        return 'bg-dark-900/80 backdrop-blur-xl';
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-30 border-b border-white/5 ${getBackgroundClass()} ${className} `}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-4">
        {/* Left: menu toggle + breadcrumbs */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="rounded-lg p-2 hover:bg-white/10 lg:hidden">
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-white" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-white" />
            )}
          </button>

          {showBreadcrumbs && breadcrumbs.length > 0 && (
            <nav className="hidden items-center gap-1 text-sm md:flex">
              <Link to="/" className="text-white/40 transition-colors hover:text-white">
                Home
              </Link>
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.label}>
                  <ChevronRightIcon className="h-4 w-4 text-white/20" />
                  {crumb.path ? (
                    <Link
                      to={crumb.path}
                      className="text-white/40 transition-colors hover:text-white"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-white">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Center: search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="hidden max-w-md flex-1 sm:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <motion.input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                animate={{
                  backgroundColor: isSearchFocused
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                }}
                className="w-full rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <XMarkIcon className="h-4 w-4 text-white/40 hover:text-white" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className="rounded-lg p-2 hover:bg-white/10"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5 text-white/60" />
            ) : (
              <MoonIcon className="h-5 w-5 text-white/60" />
            )}
          </motion.button>

          {showNotifications && <NotificationDropdown />}
          {showUserMenu && <UserDropdown />}
        </div>
      </div>
    </motion.header>
  );
};

export default TopNav;

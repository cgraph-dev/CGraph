/**
 * @heroicons/react/24/solid — lightweight mock for vitest.
 *
 * Vite resolve.alias redirects all heroicons imports here at the resolver
 * level, preventing Vite from compiling the real 300+ icon barrel.
 *
 * @since v0.9.54
 */
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const icon = (name: string) => {
  const Icon = (props: IconProps) =>
    React.createElement('svg', { 'data-testid': `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

// ── Every icon name imported across the codebase ──────────────────────
export const ArrowDownIcon = icon('ArrowDownIcon');
export const ArrowDownTrayIcon = icon('ArrowDownTrayIcon');
export const ArrowUpIcon = icon('ArrowUpIcon');
export const BellIcon = icon('BellIcon');
export const BookmarkIcon = icon('BookmarkIcon');
export const ChatBubbleLeftIcon = icon('ChatBubbleLeftIcon');
export const ChatBubbleLeftRightIcon = icon('ChatBubbleLeftRightIcon');
export const CheckBadgeIcon = icon('CheckBadgeIcon');
export const CheckCircleIcon = icon('CheckCircleIcon');
export const CheckIcon = icon('CheckIcon');
export const ChevronDownIcon = icon('ChevronDownIcon');
export const CurrencyDollarIcon = icon('CurrencyDollarIcon');
export const FireIcon = icon('FireIcon');
export const FolderIcon = icon('FolderIcon');
export const FolderOpenIcon = icon('FolderOpenIcon');
export const GiftIcon = icon('GiftIcon');
export const HeartIcon = icon('HeartIcon');
export const LockClosedIcon = icon('LockClosedIcon');
export const MagnifyingGlassIcon = icon('MagnifyingGlassIcon');
export const PauseIcon = icon('PauseIcon');
export const PlayIcon = icon('PlayIcon');
export const PlusIcon = icon('PlusIcon');
export const ShieldCheckIcon = icon('ShieldCheckIcon');
export const SparklesIcon = icon('SparklesIcon');
export const StarIcon = icon('StarIcon');
export const TrophyIcon = icon('TrophyIcon');
export const UserIcon = icon('UserIcon');
export const VideoCameraSlashIcon = icon('VideoCameraSlashIcon');

// ── Additional icons found via multi-line import scan ────────────────
export const ArrowLeftIcon = icon('ArrowLeftIcon');
export const ArrowPathIcon = icon('ArrowPathIcon');
export const ArrowsPointingInIcon = icon('ArrowsPointingInIcon');
export const ArrowsPointingOutIcon = icon('ArrowsPointingOutIcon');
export const BellAlertIcon = icon('BellAlertIcon');
export const BellSlashIcon = icon('BellSlashIcon');
export const CalendarDaysIcon = icon('CalendarDaysIcon');
export const ChartBarIcon = icon('ChartBarIcon');
export const ChevronRightIcon = icon('ChevronRightIcon');
export const ChevronUpIcon = icon('ChevronUpIcon');
export const ClockIcon = icon('ClockIcon');
export const CodeBracketIcon = icon('CodeBracketIcon');
export const Cog6ToothIcon = icon('Cog6ToothIcon');
export const ComputerDesktopIcon = icon('ComputerDesktopIcon');
export const ExclamationTriangleIcon = icon('ExclamationTriangleIcon');
export const EyeIcon = icon('EyeIcon');
export const HomeIcon = icon('HomeIcon');
export const MapPinIcon = icon('MapPinIcon');
export const MicrophoneIcon = icon('MicrophoneIcon');
export const MinusIcon = icon('MinusIcon');
export const NewspaperIcon = icon('NewspaperIcon');
export const NoSymbolIcon = icon('NoSymbolIcon');
export const PaintBrushIcon = icon('PaintBrushIcon');
export const PaperAirplaneIcon = icon('PaperAirplaneIcon');
export const PhoneXMarkIcon = icon('PhoneXMarkIcon');
export const ShareIcon = icon('ShareIcon');
export const ShieldExclamationIcon = icon('ShieldExclamationIcon');
export const StopIcon = icon('StopIcon');
export const TrashIcon = icon('TrashIcon');
export const UserCircleIcon = icon('UserCircleIcon');
export const UserGroupIcon = icon('UserGroupIcon');
export const UserMinusIcon = icon('UserMinusIcon');
export const UserPlusIcon = icon('UserPlusIcon');
export const UsersIcon = icon('UsersIcon');
export const VideoCameraIcon = icon('VideoCameraIcon');
export const XMarkIcon = icon('XMarkIcon');

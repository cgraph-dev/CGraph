/**
 * @heroicons/react/24/outline — lightweight mock for vitest.
 *
 * Vite resolve.alias redirects all heroicons imports here at the resolver
 * level, preventing Vite from compiling the real 300+ icon barrel.
 * Each export is a simple SVG stub with a data-testid for assertions.
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
export const AdjustmentsHorizontalIcon = icon('AdjustmentsHorizontalIcon');
export const ArrowDownIcon = icon('ArrowDownIcon');
export const ArrowDownTrayIcon = icon('ArrowDownTrayIcon');
export const ArrowLeftIcon = icon('ArrowLeftIcon');
export const ArrowPathIcon = icon('ArrowPathIcon');
export const ArrowRightIcon = icon('ArrowRightIcon');
export const ArrowRightOnRectangleIcon = icon('ArrowRightOnRectangleIcon');
export const ArrowsPointingOutIcon = icon('ArrowsPointingOutIcon');
export const ArrowsUpDownIcon = icon('ArrowsUpDownIcon');
export const ArrowTopRightOnSquareIcon = icon('ArrowTopRightOnSquareIcon');
export const ArrowTrendingDownIcon = icon('ArrowTrendingDownIcon');
export const ArrowTrendingUpIcon = icon('ArrowTrendingUpIcon');
export const ArrowUpIcon = icon('ArrowUpIcon');
export const ArrowUpTrayIcon = icon('ArrowUpTrayIcon');
export const ArrowUturnUpIcon = icon('ArrowUturnUpIcon');
export const Bars3BottomLeftIcon = icon('Bars3BottomLeftIcon');
export const BeakerIcon = icon('BeakerIcon');
export const BellAlertIcon = icon('BellAlertIcon');
export const BellIcon = icon('BellIcon');
export const BoltIcon = icon('BoltIcon');
export const BookmarkIcon = icon('BookmarkIcon');
export const BuildingLibraryIcon = icon('BuildingLibraryIcon');
export const CalendarDaysIcon = icon('CalendarDaysIcon');
export const CalendarIcon = icon('CalendarIcon');
export const ChartBarIcon = icon('ChartBarIcon');
export const ChatBubbleLeftIcon = icon('ChatBubbleLeftIcon');
export const ChatBubbleLeftRightIcon = icon('ChatBubbleLeftRightIcon');
export const CheckBadgeIcon = icon('CheckBadgeIcon');
export const CheckCircleIcon = icon('CheckCircleIcon');
export const CheckIcon = icon('CheckIcon');
export const ChevronDownIcon = icon('ChevronDownIcon');
export const ChevronLeftIcon = icon('ChevronLeftIcon');
export const ChevronRightIcon = icon('ChevronRightIcon');
export const ChevronUpIcon = icon('ChevronUpIcon');
export const ClipboardDocumentIcon = icon('ClipboardDocumentIcon');
export const ClipboardDocumentListIcon = icon('ClipboardDocumentListIcon');
export const ClockIcon = icon('ClockIcon');
export const Cog6ToothIcon = icon('Cog6ToothIcon');
export const CogIcon = icon('CogIcon');
export const ComputerDesktopIcon = icon('ComputerDesktopIcon');
export const CreditCardIcon = icon('CreditCardIcon');
export const CurrencyDollarIcon = icon('CurrencyDollarIcon');
export const DevicePhoneMobileIcon = icon('DevicePhoneMobileIcon');
export const DeviceTabletIcon = icon('DeviceTabletIcon');
export const DocumentArrowDownIcon = icon('DocumentArrowDownIcon');
export const DocumentIcon = icon('DocumentIcon');
export const DocumentTextIcon = icon('DocumentTextIcon');
export const EllipsisHorizontalIcon = icon('EllipsisHorizontalIcon');
export const EllipsisVerticalIcon = icon('EllipsisVerticalIcon');
export const ExclamationCircleIcon = icon('ExclamationCircleIcon');
export const ExclamationTriangleIcon = icon('ExclamationTriangleIcon');
export const EyeIcon = icon('EyeIcon');
export const EyeSlashIcon = icon('EyeSlashIcon');
export const FaceSmileIcon = icon('FaceSmileIcon');
export const FireIcon = icon('FireIcon');
export const FlagIcon = icon('FlagIcon');
export const FolderIcon = icon('FolderIcon');
export const FolderPlusIcon = icon('FolderPlusIcon');
export const FunnelIcon = icon('FunnelIcon');
export const GifIcon = icon('GifIcon');
export const GiftIcon = icon('GiftIcon');
export const GlobeAltIcon = icon('GlobeAltIcon');
export const HashtagIcon = icon('HashtagIcon');
export const HeartIcon = icon('HeartIcon');
export const InformationCircleIcon = icon('InformationCircleIcon');
export const LinkIcon = icon('LinkIcon');
export const ListBulletIcon = icon('ListBulletIcon');
export const LockClosedIcon = icon('LockClosedIcon');
export const MagnifyingGlassIcon = icon('MagnifyingGlassIcon');
export const MapPinIcon = icon('MapPinIcon');
export const MegaphoneIcon = icon('MegaphoneIcon');
export const MicrophoneIcon = icon('MicrophoneIcon');
export const MinusIcon = icon('MinusIcon');
export const MusicalNoteIcon = icon('MusicalNoteIcon');
export const NoSymbolIcon = icon('NoSymbolIcon');
export const PaintBrushIcon = icon('PaintBrushIcon');
export const PaperAirplaneIcon = icon('PaperAirplaneIcon');
export const PaperClipIcon = icon('PaperClipIcon');
export const PencilIcon = icon('PencilIcon');
export const PencilSquareIcon = icon('PencilSquareIcon');
export const PhoneIcon = icon('PhoneIcon');
export const PhoneXMarkIcon = icon('PhoneXMarkIcon');
export const PhotoIcon = icon('PhotoIcon');
export const PlayCircleIcon = icon('PlayCircleIcon');
export const PlusCircleIcon = icon('PlusCircleIcon');
export const PlusIcon = icon('PlusIcon');
export const QrCodeIcon = icon('QrCodeIcon');
export const QuestionMarkCircleIcon = icon('QuestionMarkCircleIcon');
export const RocketLaunchIcon = icon('RocketLaunchIcon');
export const RssIcon = icon('RssIcon');
export const ShieldCheckIcon = icon('ShieldCheckIcon');
export const ShieldExclamationIcon = icon('ShieldExclamationIcon');
export const ShoppingBagIcon = icon('ShoppingBagIcon');
export const SparklesIcon = icon('SparklesIcon');
export const SpeakerWaveIcon = icon('SpeakerWaveIcon');
export const StarIcon = icon('StarIcon');
export const SwatchIcon = icon('SwatchIcon');
export const TagIcon = icon('TagIcon');
export const TrashIcon = icon('TrashIcon');
export const TrophyIcon = icon('TrophyIcon');
export const UserCircleIcon = icon('UserCircleIcon');
export const UserGroupIcon = icon('UserGroupIcon');
export const UserIcon = icon('UserIcon');
export const UserPlusIcon = icon('UserPlusIcon');
export const UsersIcon = icon('UsersIcon');
export const VideoCameraIcon = icon('VideoCameraIcon');
export const XCircleIcon = icon('XCircleIcon');
export const XMarkIcon = icon('XMarkIcon');

// ── Additional icons found via multi-line import scan ────────────────
export const AcademicCapIcon = icon('AcademicCapIcon');
export const ArchiveBoxIcon = icon('ArchiveBoxIcon');
export const ArrowRightStartOnRectangleIcon = icon('ArrowRightStartOnRectangleIcon');
export const ArrowsPointingInIcon = icon('ArrowsPointingInIcon');
export const ArrowUturnLeftIcon = icon('ArrowUturnLeftIcon');
export const ArrowUturnRightIcon = icon('ArrowUturnRightIcon');
export const AtSymbolIcon = icon('AtSymbolIcon');
export const Bars3BottomRightIcon = icon('Bars3BottomRightIcon');
export const Bars3Icon = icon('Bars3Icon');
export const BellSlashIcon = icon('BellSlashIcon');
export const BoldIcon = icon('BoldIcon');
export const BriefcaseIcon = icon('BriefcaseIcon');
export const ChatBubbleBottomCenterTextIcon = icon('ChatBubbleBottomCenterTextIcon');
export const CircleStackIcon = icon('CircleStackIcon');
export const CloudArrowUpIcon = icon('CloudArrowUpIcon');
export const CodeBracketIcon = icon('CodeBracketIcon');
export const CpuChipIcon = icon('CpuChipIcon');
export const FilmIcon = icon('FilmIcon');
export const FolderOpenIcon = icon('FolderOpenIcon');
export const HandThumbUpIcon = icon('HandThumbUpIcon');
export const HomeIcon = icon('HomeIcon');
export const InboxIcon = icon('InboxIcon');
export const ItalicIcon = icon('ItalicIcon');
export const KeyIcon = icon('KeyIcon');
export const LockOpenIcon = icon('LockOpenIcon');
export const MagnifyingGlassPlusIcon = icon('MagnifyingGlassPlusIcon');
export const MoonIcon = icon('MoonIcon');
export const NewspaperIcon = icon('NewspaperIcon');
export const NumberedListIcon = icon('NumberedListIcon');
export const PinIcon = icon('PinIcon');
export const PlayIcon = icon('PlayIcon');
export const PuzzlePieceIcon = icon('PuzzlePieceIcon');
export const QueueListIcon = icon('QueueListIcon');
export const ServerIcon = icon('ServerIcon');
export const ShareIcon = icon('ShareIcon');
export const SignalIcon = icon('SignalIcon');
export const SpeakerXMarkIcon = icon('SpeakerXMarkIcon');
export const Squares2X2Icon = icon('Squares2X2Icon');
export const StarOutlineIcon = icon('StarOutlineIcon');
export const StrikethroughIcon = icon('StrikethroughIcon');
export const SunIcon = icon('SunIcon');
export const UnderlineIcon = icon('UnderlineIcon');
export const UserMinusIcon = icon('UserMinusIcon');

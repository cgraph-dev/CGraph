import {
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type { ChannelTypeOption } from './types';

export const channelTypeIcons = {
  text: HashtagIcon,
  voice: SpeakerWaveIcon,
  video: VideoCameraIcon,
  announcement: MegaphoneIcon,
  forum: ChatBubbleLeftRightIcon,
} as const;

export const channelTypeColors = {
  text: 'text-gray-400',
  voice: 'text-green-400',
  video: 'text-purple-400',
  announcement: 'text-yellow-400',
  forum: 'text-blue-400',
} as const;

export const channelTypes: ChannelTypeOption[] = [
  { value: 'text', label: 'Text', icon: HashtagIcon },
  { value: 'voice', label: 'Voice', icon: SpeakerWaveIcon },
  { value: 'video', label: 'Video', icon: VideoCameraIcon },
  { value: 'announcement', label: 'Announcement', icon: MegaphoneIcon },
  { value: 'forum', label: 'Forum', icon: ChatBubbleLeftRightIcon },
];

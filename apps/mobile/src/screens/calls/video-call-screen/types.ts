import { RouteProp } from '@react-navigation/native';
import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CallStackParamList = {
  VideoCall: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    isIncoming?: boolean;
    isGroupCall?: boolean;
    participants?: Array<{ id: string; name: string; avatar?: string }>;
  };
};

export type VideoCallRouteProp = RouteProp<CallStackParamList, 'VideoCall'>;

export type CallState = 'connecting' | 'ringing' | 'connected' | 'ended';
export type LayoutMode = 'spotlight' | 'grid';

export const PIP_WIDTH = 120;
export const PIP_HEIGHT = 160;
export const PIP_MARGIN = 16;

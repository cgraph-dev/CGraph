import type { Member } from '@/stores/groupStore';

export interface MemberListProps {
  groupId: string;
  className?: string;
}

export type StatusType = 'online' | 'idle' | 'dnd' | 'offline';

export interface MemberItemProps {
  member: Member;
  roleColor?: string;
  onClick: (event: React.MouseEvent) => void;
}

export interface MemberContextMenuProps {
  member: Member;
  position: { x: number; y: number };
  isOwner: boolean;
  onClose: () => void;
}

export interface RoleSectionProps {
  role: import('@/stores/groupStore').Role;
  members: Member[];
  onMemberClick: (member: Member, event: React.MouseEvent) => void;
}

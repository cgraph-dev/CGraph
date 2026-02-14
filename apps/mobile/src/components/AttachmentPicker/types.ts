/**
 * AttachmentPicker Types
 */

export interface Asset {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
  filename?: string;
  width?: number;
  height?: number;
}

export interface SelectedAsset {
  uri: string;
  type: 'image' | 'video' | 'file';
  name?: string;
  mimeType?: string;
  duration?: number;
  contactData?: {
    name: string;
    phone: string;
    email: string;
  };
}

export type TabType = 'gallery' | 'gift' | 'file' | 'location' | 'checklist' | 'contact';

export interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectAssets: (assets: SelectedAsset[]) => void;
  maxSelection?: number;
}

export interface TabItem {
  id: TabType;
  icon: string;
  label: string;
}

export const TAB_ITEMS: TabItem[] = [
  { id: 'gallery', icon: 'images', label: 'Gallery' },
  { id: 'gift', icon: 'gift', label: 'Gift' },
  { id: 'file', icon: 'document', label: 'File' },
  { id: 'location', icon: 'location', label: 'Location' },
  { id: 'checklist', icon: 'checkbox', label: 'Checklist' },
  { id: 'contact', icon: 'person', label: 'Contact' },
];

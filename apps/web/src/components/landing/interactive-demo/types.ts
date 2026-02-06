export interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  reactions?: { emoji: string; count: number }[];
}

export interface DemoTab {
  id: string;
  label: string;
  icon: string;
}

export interface InteractiveDemoProps {
  className?: string;
}

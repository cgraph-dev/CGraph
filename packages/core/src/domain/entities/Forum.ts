/**
 * Forum Entity
 * 
 * Core domain entity representing forum structures in the CGraph platform.
 */

export interface ForumCategoryEntity {
  id: string;
  name: string;
  description?: string;
  position: number;
  isCollapsed: boolean;
  createdAt: Date;
}

export interface ForumBoardEntity {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  icon?: string;
  position: number;
  threadCount: number;
  postCount: number;
  lastPostAt?: Date;
  lastPostBy?: string;
  lastThreadId?: string;
  moderators: string[];
  settings: BoardSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardSettings {
  allowPolls: boolean;
  allowAttachments: boolean;
  maxAttachmentSize: number;
  requirePrefix: boolean;
  availablePrefixes: ThreadPrefix[];
  minPostLength: number;
  maxPostLength: number;
  autoLockAfterDays?: number;
}

export interface ThreadPrefix {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface ThreadEntity {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  prefixId?: string;
  isPinned: boolean;
  isLocked: boolean;
  isAnnouncement: boolean;
  isSticky: boolean;
  viewCount: number;
  replyCount: number;
  lastPostAt: Date;
  lastPostBy: string;
  firstPostId: string;
  rating: number;
  ratingCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PostEntity {
  id: string;
  threadId: string;
  authorId: string;
  content: string;
  contentHtml: string;
  isFirstPost: boolean;
  rating: number;
  ratingCount: number;
  upvotes: number;
  downvotes: number;
  attachments: PostAttachment[];
  editHistory: PostEdit[];
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface PostEdit {
  editedAt: Date;
  editedBy: string;
  reason?: string;
  previousContent: string;
}

export interface PollEntity {
  id: string;
  threadId: string;
  question: string;
  options: PollOption[];
  isMultipleChoice: boolean;
  isPublicVotes: boolean;
  maxVotes: number;
  endsAt?: Date;
  totalVotes: number;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  voters: string[];
}

/**
 * Parse BBCode content to HTML
 */
export function parseBBCode(content: string): string {
  let html = content;
  
  // Basic formatting
  html = html.replace(/\[b\](.*?)\[\/b\]/gis, '<strong>$1</strong>');
  html = html.replace(/\[i\](.*?)\[\/i\]/gis, '<em>$1</em>');
  html = html.replace(/\[u\](.*?)\[\/u\]/gis, '<u>$1</u>');
  html = html.replace(/\[s\](.*?)\[\/s\]/gis, '<s>$1</s>');
  
  // Links
  html = html.replace(
    /\[url=(.*?)\](.*?)\[\/url\]/gi, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'
  );
  html = html.replace(
    /\[url\](.*?)\[\/url\]/gi, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Images
  html = html.replace(
    /\[img\](.*?)\[\/img\]/gi, 
    '<img src="$1" alt="" loading="lazy" class="bbcode-image" />'
  );
  html = html.replace(
    /\[img=(.*?)x(.*?)\](.*?)\[\/img\]/gi, 
    '<img src="$3" width="$1" height="$2" alt="" loading="lazy" class="bbcode-image" />'
  );
  
  // Quotes
  html = html.replace(
    /\[quote=(.*?)\](.*?)\[\/quote\]/gis,
    '<blockquote class="bbcode-quote"><cite>$1</cite>$2</blockquote>'
  );
  html = html.replace(
    /\[quote\](.*?)\[\/quote\]/gis,
    '<blockquote class="bbcode-quote">$1</blockquote>'
  );
  
  // Code
  html = html.replace(
    /\[code\](.*?)\[\/code\]/gis,
    '<pre class="bbcode-code"><code>$1</code></pre>'
  );
  html = html.replace(
    /\[code=(.*?)\](.*?)\[\/code\]/gis,
    '<pre class="bbcode-code" data-language="$1"><code>$2</code></pre>'
  );
  
  // Colors and sizes
  html = html.replace(
    /\[color=(.*?)\](.*?)\[\/color\]/gi,
    '<span style="color:$1">$2</span>'
  );
  html = html.replace(
    /\[size=(.*?)\](.*?)\[\/size\]/gi,
    '<span style="font-size:$1">$2</span>'
  );
  
  // Lists
  html = html.replace(/\[list\](.*?)\[\/list\]/gis, '<ul class="bbcode-list">$1</ul>');
  html = html.replace(/\[list=1\](.*?)\[\/list\]/gis, '<ol class="bbcode-list">$1</ol>');
  html = html.replace(/\[\*\](.*?)(?=\[\*\]|\[\/list\])/gi, '<li>$1</li>');
  
  // Spoiler
  html = html.replace(
    /\[spoiler\](.*?)\[\/spoiler\]/gis,
    '<details class="bbcode-spoiler"><summary>Spoiler</summary>$1</details>'
  );
  html = html.replace(
    /\[spoiler=(.*?)\](.*?)\[\/spoiler\]/gis,
    '<details class="bbcode-spoiler"><summary>$1</summary>$2</details>'
  );
  
  // Center/Left/Right alignment
  html = html.replace(
    /\[center\](.*?)\[\/center\]/gis,
    '<div style="text-align:center">$1</div>'
  );
  html = html.replace(
    /\[left\](.*?)\[\/left\]/gis,
    '<div style="text-align:left">$1</div>'
  );
  html = html.replace(
    /\[right\](.*?)\[\/right\]/gis,
    '<div style="text-align:right">$1</div>'
  );
  
  // Line breaks
  html = html.replace(/\n/g, '<br />');
  
  return html;
}

/**
 * Strip BBCode tags from content (for previews)
 */
export function stripBBCode(content: string): string {
  return content
    .replace(/\[.*?\]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Calculate thread hotness score for ranking
 */
export function calculateHotness(thread: ThreadEntity): number {
  const age = (Date.now() - thread.createdAt.getTime()) / (1000 * 60 * 60); // hours
  const activity = (Date.now() - thread.lastPostAt.getTime()) / (1000 * 60 * 60);
  
  const score = (
    thread.replyCount * 2 +
    thread.viewCount * 0.1 +
    thread.rating * 5 +
    (thread.isPinned ? 1000 : 0) +
    (thread.isAnnouncement ? 2000 : 0)
  );
  
  // Decay based on age and recent activity
  const ageDecay = Math.pow(0.95, age / 24);
  const activityBoost = Math.pow(0.98, activity / 24);
  
  return score * ageDecay * (1 + activityBoost);
}

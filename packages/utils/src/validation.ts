/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Username validation regex (letters, numbers, underscores, 3-30 chars)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Strong password regex (min 8 chars, at least 1 letter and 1 number)
 */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * URL validation regex
 */
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

/**
 * Ethereum wallet address regex
 */
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('Use at least 8 characters');
  
  if (password.length >= 12) score++;
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Use both uppercase and lowercase letters');
  
  if (/\d/.test(password)) score++;
  else feedback.push('Include at least one number');
  
  if (/[@$!%*#?&]/.test(password)) score++;
  else feedback.push('Add a special character (@$!%*#?&)');
  
  const labels: Record<number, 'weak' | 'fair' | 'good' | 'strong'> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'good',
    4: 'strong',
    5: 'strong',
  };
  
  return {
    score: Math.min(score, 4),
    label: labels[score] || 'weak',
    feedback,
  };
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  return URL_REGEX.test(url);
}

/**
 * Validate Ethereum wallet address
 */
export function isValidEthAddress(address: string): boolean {
  return ETH_ADDRESS_REGEX.test(address);
}

/**
 * Validate forum/group slug
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,50}$/.test(slug);
}

/**
 * Sanitize input for display (basic XSS prevention)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate file type for upload
 */
export function isAllowedFileType(
  fileName: string,
  allowedExtensions: string[]
): boolean {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
}

/**
 * Common allowed file types
 */
export const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export const ALLOWED_VIDEO_TYPES = ['mp4', 'webm', 'mov'];
export const ALLOWED_AUDIO_TYPES = ['mp3', 'wav', 'ogg', 'm4a'];
export const ALLOWED_DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'];

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 25 * 1024 * 1024, // 25MB
  avatar: 2 * 1024 * 1024, // 2MB
} as const;

/**
 * Validate message content
 */
export function validateMessage(content: string): {
  isValid: boolean;
  error?: string;
} {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 4000) {
    return { isValid: false, error: 'Message cannot exceed 4000 characters' };
  }
  
  return { isValid: true };
}

/**
 * Validate post title
 */
export function validatePostTitle(title: string): {
  isValid: boolean;
  error?: string;
} {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Title is required' };
  }
  
  if (title.length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters' };
  }
  
  if (title.length > 300) {
    return { isValid: false, error: 'Title cannot exceed 300 characters' };
  }
  
  return { isValid: true };
}

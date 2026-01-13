/**
 * Validation Service
 * 
 * Centralized validation rules for the CGraph platform.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationService {
  /**
   * Validate email format
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    } else if (email.length > 254) {
      errors.push('Email is too long');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate username
   */
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    
    if (!username) {
      errors.push('Username is required');
    } else {
      if (username.length < 3) {
        errors.push('Username must be at least 3 characters');
      }
      if (username.length > 32) {
        errors.push('Username must be at most 32 characters');
      }
      if (!usernameRegex.test(username)) {
        errors.push('Username can only contain letters, numbers, underscores, and hyphens');
      }
      if (username.startsWith('_') || username.startsWith('-')) {
        errors.push('Username cannot start with underscore or hyphen');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (password.length > 128) {
        errors.push('Password must be at most 128 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain an uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain a lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain a number');
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain a special character');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate display name
   */
  static validateDisplayName(displayName: string): ValidationResult {
    const errors: string[] = [];
    
    if (displayName) {
      if (displayName.length < 1) {
        errors.push('Display name must be at least 1 character');
      }
      if (displayName.length > 64) {
        errors.push('Display name must be at most 64 characters');
      }
      if (/^\s|\s$/.test(displayName)) {
        errors.push('Display name cannot start or end with whitespace');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate group name
   */
  static validateGroupName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name) {
      errors.push('Group name is required');
    } else {
      if (name.length < 2) {
        errors.push('Group name must be at least 2 characters');
      }
      if (name.length > 100) {
        errors.push('Group name must be at most 100 characters');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate channel name
   */
  static validateChannelName(name: string): ValidationResult {
    const errors: string[] = [];
    const channelRegex = /^[a-z0-9-]+$/;
    
    if (!name) {
      errors.push('Channel name is required');
    } else {
      if (name.length < 1) {
        errors.push('Channel name must be at least 1 character');
      }
      if (name.length > 100) {
        errors.push('Channel name must be at most 100 characters');
      }
      if (!channelRegex.test(name)) {
        errors.push('Channel name can only contain lowercase letters, numbers, and hyphens');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate message content
   */
  static validateMessageContent(content: string): ValidationResult {
    const errors: string[] = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('Message cannot be empty');
    } else if (content.length > 4000) {
      errors.push('Message cannot exceed 4000 characters');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate forum thread title
   */
  static validateThreadTitle(title: string): ValidationResult {
    const errors: string[] = [];
    
    if (!title) {
      errors.push('Title is required');
    } else {
      if (title.length < 5) {
        errors.push('Title must be at least 5 characters');
      }
      if (title.length > 200) {
        errors.push('Title must be at most 200 characters');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate forum post content
   */
  static validatePostContent(content: string): ValidationResult {
    const errors: string[] = [];
    
    if (!content || content.trim().length === 0) {
      errors.push('Post content is required');
    } else {
      if (content.length < 10) {
        errors.push('Post must be at least 10 characters');
      }
      if (content.length > 50000) {
        errors.push('Post cannot exceed 50000 characters');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate URL
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('Invalid URL format');
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: { name: string; size: number; type: string },
    options: {
      maxSize?: number; // bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const { maxSize = 50 * 1024 * 1024, allowedTypes, allowedExtensions } = options;
    
    if (file.size > maxSize) {
      errors.push(`File exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
    }
    
    if (allowedExtensions) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        errors.push('File extension not allowed');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
}

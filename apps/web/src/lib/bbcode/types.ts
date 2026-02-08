/**
 * BBCode type definitions
 */

/** BBCode tag definition */
export interface BBCodeTag {
  pattern: RegExp;
  replace: (match: string, ...args: string[]) => string;
  priority?: number; // Lower = processed first
}

/**
 * BBCode Editor Types
 *
 * Type definitions for the BBCode editor component.
 */

/** Text selection state within a textarea */
export interface TextSelection {
  /** Start offset of the selection */
  start: number;
  /** End offset of the selection */
  end: number;
  /** The selected text content */
  text: string;
}

/**
 * Gesture Handler Module
 *
 * Handles drag-style gestures with configurable direction constraints,
 * threshold, bounds, and optional haptic feedback.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import gsap from 'gsap';

import type { GestureConfig } from '../animation-engine.types';

import { SpringPhysics } from './spring-physics';
import { HapticFeedback } from './haptic-feedback';

// =============================================================================
// GESTURE HANDLER
// =============================================================================

export class GestureHandler {
  private element: HTMLElement;
  private config: Required<GestureConfig>;
  private startX = 0;
  private startY = 0;
  private isDragging = false;

  constructor(element: HTMLElement, config: GestureConfig = {}) {
    this.element = element;
    this.config = {
      enableHaptic: config.enableHaptic ?? true,
      threshold: config.threshold ?? 10,
      direction: config.direction ?? 'all',
      bounds: config.bounds ?? { min: -Infinity, max: Infinity },
    };

    this.init();
  }

  private init(): void {
    this.element.addEventListener('mousedown', this.handleStart);
    this.element.addEventListener('touchstart', this.handleStart, { passive: false });
  }

  private handleStart = (e: MouseEvent | TouchEvent): void => {
    const point = e instanceof MouseEvent ? e : e.touches[0];
    if (!point) return;
    this.startX = point.clientX;
    this.startY = point.clientY;
    this.isDragging = true;

    if (this.config.enableHaptic) {
      HapticFeedback.light();
    }

    document.addEventListener('mousemove', this.handleMove);
    document.addEventListener('touchmove', this.handleMove, { passive: false });
    document.addEventListener('mouseup', this.handleEnd);
    document.addEventListener('touchend', this.handleEnd);
  };

  private handleMove = (e: MouseEvent | TouchEvent): void => {
    if (!this.isDragging) return;

    const point = e instanceof MouseEvent ? e : e.touches[0];
    if (!point) return;
    const deltaX = point.clientX - this.startX;
    const deltaY = point.clientY - this.startY;

    // Apply threshold
    if (Math.abs(deltaX) < this.config.threshold && Math.abs(deltaY) < this.config.threshold) {
      return;
    }

    // Apply bounds and direction constraints
    let x = 0;
    let y = 0;

    if (this.config.direction === 'horizontal' || this.config.direction === 'all') {
      x = Math.max(this.config.bounds.min, Math.min(this.config.bounds.max, deltaX));
    }

    if (this.config.direction === 'vertical' || this.config.direction === 'all') {
      y = Math.max(this.config.bounds.min, Math.min(this.config.bounds.max, deltaY));
    }

    gsap.set(this.element, { x, y });
  };

  private handleEnd = (): void => {
    this.isDragging = false;

    // Spring back to original position
    SpringPhysics.animate(this.element, { x: 0, y: 0 }, { tension: 200, friction: 20 });

    if (this.config.enableHaptic) {
      HapticFeedback.selection();
    }

    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('touchmove', this.handleMove);
    document.removeEventListener('mouseup', this.handleEnd);
    document.removeEventListener('touchend', this.handleEnd);
  };

  destroy(): void {
    this.element.removeEventListener('mousedown', this.handleStart);
    this.element.removeEventListener('touchstart', this.handleStart);
  }
}

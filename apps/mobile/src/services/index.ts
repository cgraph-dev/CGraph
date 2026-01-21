/**
 * Services Index
 * 
 * Central export point for all service modules.
 * Import services from this file for consistent module resolution.
 * 
 * @module services
 * @since v0.9.0
 */

// Core API
export { default as api, authApi, API_URL } from './api';

// Feature Services
export * as settingsService from './settingsService';
export * as premiumService from './premiumService';
export * as friendsService from './friendsService';
export * as searchService from './searchService';
export * as calendarService from './calendarService';
export * as notificationsService from './notificationsService';
export * as groupsService from './groupsService';
export * as gamificationService from './gamificationService';
export * as referralService from './referralService';
export * as tierService from './tierService';

// Push Notifications
export * from './pushNotifications';

/**
 * @cgraph/core
 * 
 * Core domain logic and services for the CGraph platform.
 * This package contains shared business logic that can be used
 * across web, mobile, and backend applications.
 * 
 * Architecture:
 * - domain/entities: Domain entities and value objects
 * - domain/services: Domain services and business rules
 * - services: Application services and use cases
 * - utils: Shared utility functions
 * 
 * @module @cgraph/core
 * @since v0.8.3
 */

// Domain entities
export * from './domain/entities';

// Domain services
export * from './domain/services';

// Application services
export * from './services';

// Utilities
export * from './utils';

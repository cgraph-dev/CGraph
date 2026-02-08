/**
 * SubscriptionManager — re-export shim
 *
 * The implementation has been split into the subscription-manager/ directory.
 * This file preserves the original import path for backwards compatibility.
 */
export { SubscriptionManager, default } from './subscription-manager';
export type {
  NotificationMode,
  SubscriptionType,
  Subscription,
  SubscriptionManagerProps,
} from './subscription-manager';

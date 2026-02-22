/**
 * Assertion utilities.
 *
 * @module @cgraph/core/assert
 */

/**
 * Throws if the condition is falsy. Narrows the type in subsequent code.
 *
 * @example
 * ```ts
 * invariant(user != null, 'User must exist');
 * // user is non-null here
 * ```
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant violation: ${message}`);
  }
}

/**
 * Exhaustiveness check for discriminated unions.
 *
 * @example
 * ```ts
 * switch (action.type) {
 *   case 'add': return handleAdd();
 *   case 'remove': return handleRemove();
 *   default: assertNever(action.type);
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

/**
 * Extracts a message from an unknown thrown value.
 *
 * TypeScript types `catch` bindings as `unknown`, since anything can be thrown.
 * This generalises the `error instanceof Error ? error.message : ...` narrowing
 * already used across the codebase so call sites can stay one-liners.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Unknown error',
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

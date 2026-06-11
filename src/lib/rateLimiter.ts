// ─── Global Client-Side Rate Limiter Utility ───────────────────

const lastExecutedMap = new Map<string, number>();

/**
 * Checks if a specific action is allowed to run based on a minimum cooldown period.
 * @param actionName Unique name of the action (e.g., 'eventStore/addEvent')
 * @param limitMs Cooldown limit in milliseconds (default: 1000ms)
 * @returns boolean True if the action is allowed, False if it is rate-limited
 */
export const checkRateLimit = (actionName: string, limitMs: number = 1000): boolean => {
  const now = Date.now();
  const lastExecuted = lastExecutedMap.get(actionName) || 0;
  if (now - lastExecuted < limitMs) {
    console.warn(`[Rate Limiter] Action '${actionName}' throttled. Cooldown remaining: ${limitMs - (now - lastExecuted)}ms`);
    return false;
  }
  lastExecutedMap.set(actionName, now);
  return true;
};

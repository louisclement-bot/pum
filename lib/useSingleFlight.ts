/**
 * useSingleFlight.ts
 * 
 * A React hook that prevents multiple concurrent executions of the same function,
 * particularly useful for preventing double-click issues in form submissions,
 * navigation actions, and API calls.
 */

import { useRef, useCallback } from "react"

/**
 * Creates a wrapper around a function that prevents concurrent executions.
 * 
 * This hook is designed to solve the common "double-click" problem in React applications
 * where a user might click a button multiple times before the first action completes,
 * potentially causing duplicate submissions, navigation issues, or race conditions.
 * 
 * The implementation uses a ref to track the busy state, ensuring that React re-renders
 * don't affect the guard's effectiveness.
 * 
 * @template T - The array type of arguments that the function accepts
 * @param fn - The function to protect against concurrent executions
 * @returns A tuple containing:
 *   1. The wrapped function that prevents concurrent executions
 *   2. A function that returns the current busy state
 * 
 * @example
 * // Basic usage with a button click handler
 * const [handleSubmit, isSubmitting] = useSingleFlight(async () => {
 *   await saveData();
 *   navigate('/success');
 * });
 * 
 * // In JSX
 * <Button 
 *   onClick={handleSubmit} 
 *   disabled={isSubmitting()}
 * >
 *   {isSubmitting() ? "Saving..." : "Save"}
 * </Button>
 * 
 * @example
 * // With parameters
 * const [handleUpdate, isUpdating] = useSingleFlight(async (id: string, data: FormData) => {
 *   await updateRecord(id, data);
 * });
 * 
 * // Call with parameters
 * handleUpdate("123", formData);
 */
export function useSingleFlight<T extends any[]>(
  fn: (...args: T) => Promise<void> | void,
): [(...args: T) => void, () => boolean] {
  // Use ref to ensure the busy state persists across renders
  const busy = useRef(false)

  // Create a stable callback that wraps the provided function
  const wrapped = useCallback(
    async (...args: T) => {
      // If already executing, prevent additional executions
      if (busy.current) return
      
      // Set busy state before execution
      busy.current = true
      
      try {
        // Execute the function and await its completion
        await fn(...args)
      } finally {
        // Always reset busy state when done, even if an error occurred
        busy.current = false
      }
    },
    [fn],
  )

  // Return both the wrapped function and a way to check the busy state
  return [wrapped, () => busy.current]
}

/**
 * Utility function for testing the useSingleFlight hook in Jest
 * 
 * @example
 * it("executes only once", async () => {
 *   let count = 0;
 *   const [wrapped] = useSingleFlight(() => { count++; });
 *   wrapped(); wrapped(); wrapped();
 *   expect(count).toBe(1);
 * });
 */
export function createGuard<T extends any[]>(
  fn: (...args: T) => Promise<void> | void
): (...args: T) => Promise<void> {
  let busy = false
  return async (...args: T) => {
    if (busy) return
    busy = true
    try {
      await fn(...args)
    } finally {
      busy = false
    }
  }
}

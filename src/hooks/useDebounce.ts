import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly changing value. The returned value only updates once
 * `delay` milliseconds have passed without a new change, which is used to avoid
 * firing an API request on every keystroke of the stop search.
 *
 * @param value - The value to debounce.
 * @param delay - Debounce delay in milliseconds (default 300).
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

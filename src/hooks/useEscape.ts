import { useEffect } from "react";

/**
 * useEscape
 * Calls the provided callback when the user presses the Escape key.
 *
 * @param callback - function to call on Escape
 * @param enabled - whether the listener is active
 */
export default function useEscape(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // support older browsers that might use `key`
      const key = e.key;
      if (key === "Escape" || key === "Esc") {
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callback, enabled]);
}

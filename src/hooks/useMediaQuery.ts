import { useSyncExternalStore } from "react";

/** Subscribe to a media query with SSR-safe initial state. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** True on small screens. */
export function useIsCompact(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}

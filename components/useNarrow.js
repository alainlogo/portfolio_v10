import { useSyncExternalStore } from "react";

const query = "(max-width: 640px)";
const subscribe = (onChange) => {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

// True on phone-sized screens; false during server rendering.
export default function useNarrow() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

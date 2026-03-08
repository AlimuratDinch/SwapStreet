import { useEffect, useCallback, useRef } from "react";

export function useScrollListener(
  containerRef: React.RefObject<HTMLElement | null>,
  callback: () => void,
  isEnabled: boolean,
) {
  const lastFetchRef = useRef(0);

  const handleScroll = useCallback(() => {
    if (!isEnabled) return;
    if (Date.now() - lastFetchRef.current < 500) return;

    const el = containerRef.current;
    if (!el) return;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      lastFetchRef.current = Date.now();
      callback();
    }
  }, [isEnabled, callback, containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, containerRef]);
}

import { useEffect, useRef, useState } from "react";

type SceneActivityOptions = {
  rootMargin?: string;
  scrollDebounceMs?: number;
};

export function useSceneActivity(options?: SceneActivityOptions) {
  const { rootMargin = "200px 0px", scrollDebounceMs = 160 } = options ?? {};

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    let timeoutId: number | undefined;
    const handleScroll = () => {
      setIsScrolling(true);
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setIsScrolling(false), scrollDebounceMs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [scrollDebounceMs]);

  useEffect(() => {
    const handleVisibility = () =>
      setIsVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handleVisibility);
    handleVisibility();
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return {
    containerRef,
    inView,
    isScrolling,
    isVisible,
    active: inView && isVisible && !isScrolling,
  };
}


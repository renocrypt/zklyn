import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export function FrameLimiter({ fps, active }: { fps: number; active: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (!active) return undefined;
    invalidate();
    if (fps <= 0) return undefined;
    const interval = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(interval);
  }, [active, fps, invalidate]);

  return null;
}

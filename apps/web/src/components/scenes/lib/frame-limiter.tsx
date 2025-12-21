import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export function FrameLimiter({ fps, active }: { fps: number; active: boolean }) {
  const { invalidate } = useThree();

  useEffect(() => {
    if (!active || fps <= 0) return undefined;
    invalidate();
    const interval = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(interval);
  }, [active, fps, invalidate]);

  return null;
}


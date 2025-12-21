"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function HeroLightRig({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const iridescent = useRef<THREE.PointLight>(null!);
  const rim = useRef<THREE.PointLight>(null!);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (reducedMotion || pauseMotion) return;
    const t = clock.getElapsedTime();

    const orbit = 18;
    iridescent.current.position.set(
      Math.cos(t * 0.45) * orbit,
      18 + Math.sin(t * 0.25) * 3,
      Math.sin(t * 0.45) * orbit
    );

    rim.current.position.set(
      Math.cos(t * 0.22 + 1.2) * 22,
      6 + Math.sin(t * 0.33) * 2,
      Math.sin(t * 0.22 + 1.2) * 22
    );

    const hue = (t * 0.06) % 1;
    iridescent.current.intensity = 0.95 + Math.sin(t * 0.8) * 0.15;
    color.setHSL(hue, 0.9, 0.62);
    iridescent.current.color.copy(color);

    color.setHSL((hue + 0.5) % 1, 0.85, 0.62);
    rim.current.color.copy(color);
  });

  return (
    <>
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#9ad5ff", "#1a0c23", 0.22]} />
      <directionalLight position={[20, 40, 20]} intensity={1.05} color="#fff2e8" />
      <directionalLight position={[-18, 16, -12]} intensity={0.3} color="#9ad5ff" />
      <pointLight ref={iridescent} distance={120} intensity={0.95} />
      <pointLight ref={rim} distance={140} intensity={0.55} />
    </>
  );
}


"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export function IridescentBackdrop({
  reducedMotion,
  pauseMotion,
}: {
  reducedMotion?: boolean;
  pauseMotion?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();
  const direction = useMemo(() => new THREE.Vector3(), []);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(200, 160, 1, 1), []);
  const material = useMemo(() => {
    const base = new THREE.Color("#03030b");
    const c1 = new THREE.Color("#60d8ff");
    const c2 = new THREE.Color("#c084fc");
    const c3 = new THREE.Color("#ff9edb");
    const c4 = new THREE.Color("#4ade80");
    const c5 = new THREE.Color("#fbbf24");

    return new THREE.ShaderMaterial({
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBase: { value: base },
        uC1: { value: c1 },
        uC2: { value: c2 },
        uC3: { value: c3 },
        uC4: { value: c4 },
        uC5: { value: c5 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uBase;
        uniform vec3 uC1;
        uniform vec3 uC2;
        uniform vec3 uC3;
        uniform vec3 uC4;
        uniform vec3 uC5;

        float softRing(vec2 p, vec2 center, float radius, float width) {
          float d = abs(length(p - center) - radius);
          return smoothstep(width, 0.0, d);
        }

        float softBlob(vec2 p, vec2 center, float radius) {
          float d = length(p - center);
          float k = max(radius, 0.001);
          return exp(- (d * d) / (k * k));
        }

        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          p.x *= 1.15;
          float t = uTime;

          // "Stochastic" drift via layered sinusoids (deterministic, no true randomness).
          vec2 c0 = vec2(sin(t * 0.17 + 0.2), cos(t * 0.13 + 1.1)) * 0.48 + vec2(0.12, -0.10);
          vec2 c1 = vec2(sin(t * 0.11 + 1.7), cos(t * 0.19 + 0.8)) * 0.58 + vec2(-0.22, 0.14);
          vec2 c2 = vec2(sin(t * 0.21 + 2.4), cos(t * 0.15 + 2.1)) * 0.52 + vec2(0.24, 0.22);
          vec2 c3 = vec2(sin(t * 0.14 + 0.4), cos(t * 0.22 + 1.3)) * 0.64 + vec2(-0.14, -0.26);
          vec2 c4 = vec2(sin(t * 0.09 + 3.0), cos(t * 0.12 + 2.8)) * 0.72 + vec2(0.02, -0.02);

          c0 += vec2(sin(t * 0.73 + 4.1), cos(t * 0.81 + 1.3)) * 0.05;
          c1 += vec2(sin(t * 0.69 + 2.7), cos(t * 0.77 + 0.9)) * 0.05;
          c2 += vec2(sin(t * 0.62 + 5.3), cos(t * 0.71 + 4.7)) * 0.05;
          c3 += vec2(sin(t * 0.58 + 3.9), cos(t * 0.66 + 2.2)) * 0.05;
          c4 += vec2(sin(t * 0.55 + 1.1), cos(t * 0.63 + 5.0)) * 0.05;

          vec3 glow = vec3(0.0);

          float b0 = softBlob(p, c0, 0.55);
          float r0 = softRing(p, c0, 0.26 + 0.05 * sin(t * 0.35 + 0.6), 0.10);
          glow += uC1 * (b0 * 0.10 + r0 * 0.08);

          float b1 = softBlob(p, c1, 0.60);
          float r1 = softRing(p, c1, 0.32 + 0.06 * sin(t * 0.29 + 1.7), 0.11);
          glow += uC2 * (b1 * 0.09 + r1 * 0.08);

          float b2 = softBlob(p, c2, 0.58);
          float r2 = softRing(p, c2, 0.28 + 0.05 * sin(t * 0.33 + 2.9), 0.10);
          glow += uC3 * (b2 * 0.09 + r2 * 0.07);

          float b3 = softBlob(p, c3, 0.62);
          float r3 = softRing(p, c3, 0.36 + 0.06 * sin(t * 0.27 + 0.2), 0.12);
          glow += uC4 * (b3 * 0.08 + r3 * 0.07);

          float b4 = softBlob(p, c4, 0.70);
          float r4 = softRing(p, c4, 0.44 + 0.07 * sin(t * 0.24 + 2.1), 0.14);
          glow += uC5 * (b4 * 0.07 + r4 * 0.06);

          // Dim overall intensity and keep a dark base.
          float vignette = smoothstep(0.6, 1.2, length(p));
          vec3 col = uBase + glow;
          col *= 1.0 - vignette * 0.62;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  useEffect(() => {
    materialRef.current = material;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    camera.getWorldDirection(direction);
    mesh.current.position.copy(camera.position).addScaledVector(direction, 90);
    mesh.current.quaternion.copy(camera.quaternion);

    if (reducedMotion || pauseMotion) return;
    const currentMaterial = materialRef.current;
    if (!currentMaterial) return;
    currentMaterial.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}


import * as THREE from "three";

export type CanvasPreset = {
  dpr: [number, number];
  gl: Readonly<{
    alpha: boolean;
    antialias: boolean;
    powerPreference: WebGLPowerPreference;
  }>;
  frameloop: "demand";
  fps: Readonly<{ normal: number; reduced: number }>;
};

export const HERO_CANVAS_PRESET: CanvasPreset = {
  dpr: [1, 1.2],
  gl: { alpha: true, antialias: false, powerPreference: "low-power" },
  frameloop: "demand",
  fps: { normal: 24, reduced: 12 },
};

export const CARD_CANVAS_PRESET: CanvasPreset = {
  dpr: [1, 1.2],
  gl: { alpha: true, antialias: false, powerPreference: "low-power" },
  frameloop: "demand",
  fps: { normal: 24, reduced: 12 },
};

export function applyAcesToneMapping(gl: THREE.WebGLRenderer, exposure: number) {
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposure;
}

export function applyReinhardToneMapping(gl: THREE.WebGLRenderer, exposure: number) {
  gl.toneMapping = THREE.ReinhardToneMapping;
  gl.toneMappingExposure = exposure;
}

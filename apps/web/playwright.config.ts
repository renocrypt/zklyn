import { defineConfig } from "@playwright/test";
import os from "node:os";

function ensureArm64MacBrowserResolution() {
  if (process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE) return;
  if (process.platform !== "darwin") return;
  if (process.arch !== "arm64") return;
  if (os.cpus().length > 0) return;

  const darwinMajor = Number(os.release().split(".")[0]);
  if (!Number.isFinite(darwinMajor)) return;

  let macVersion: string;

  if (darwinMajor < 18) {
    macVersion = "mac10.13";
  } else if (darwinMajor === 18) {
    macVersion = "mac10.14";
  } else if (darwinMajor === 19) {
    macVersion = "mac10.15";
  } else {
    const LAST_STABLE_MACOS_MAJOR_VERSION = 15;
    macVersion = `mac${Math.min(darwinMajor - 9, LAST_STABLE_MACOS_MAJOR_VERSION)}`;
  }

  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = `${macVersion}-arm64`;
}

ensureArm64MacBrowserResolution();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "npm run build && node scripts/serve-out.mjs --host 127.0.0.1 --port 3000 --dir out",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

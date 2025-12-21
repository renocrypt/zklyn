import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "util";

if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

jest.mock("next/image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    __esModule: true,
    default: (props: Record<string, unknown> & { alt?: string }) =>
      React.createElement("img", { ...props, alt: props.alt ?? "" }),
  };
});

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const DynamicComponent = () => null;
    return DynamicComponent;
  },
}));

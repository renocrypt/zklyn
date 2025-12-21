import { render, screen } from "@testing-library/react";
import { FloatingNav } from "@/components/floating-nav";

jest.mock("motion/react", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    motion: new Proxy(
      {},
      {
        get: () => (props: Record<string, unknown>) =>
          React.createElement("div", props),
      }
    ),
    useScroll: () => ({ scrollY: 0 }),
    useTransform: (_value: unknown, _input: unknown, output: unknown) =>
      Array.isArray(output) ? output[0] : output,
    useSpring: (value: unknown) => value,
    useMotionTemplate: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce(
        (acc, str, index) => acc + str + (values[index] ?? ""),
        ""
      ),
    useReducedMotion: () => true,
  };
});

test("renders floating nav with connect action", () => {
  render(
    <FloatingNav
      address={undefined}
      isConnected={false}
      connectors={[{ id: "injected", name: "Injected" }]}
      isConnecting={false}
      showConnectors={false}
      onToggleConnectors={jest.fn()}
      onConnect={jest.fn()}
      onDisconnect={jest.fn()}
      networkLabel="Not connected"
      networkBadgeClass=""
    />
  );

  expect(screen.getByText(/zklyn/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /connect/i })).toBeInTheDocument();
});

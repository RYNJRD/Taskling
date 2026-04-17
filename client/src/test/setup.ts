import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        React.forwardRef(({ children, ...props }: Record<string, unknown>, ref) =>
          React.createElement(tag, { ref, ...props }, children),
        ),
    },
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

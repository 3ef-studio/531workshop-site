import { afterEach, vi } from "vitest";

// Safety net: fail loudly if any test accidentally performs a real network call.
// Individual tests that need `fetch` install their own `vi.fn()` mock.
const realFetch = globalThis.fetch;
globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
  throw new Error(
    `Unexpected real fetch() in a unit test: ${String(args[0])}. Mock it with vi.fn().`,
  );
}) as typeof fetch;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  // Restore the guard in case a test replaced globalThis.fetch and didn't clean up.
  globalThis.fetch = ((...args: Parameters<typeof fetch>) => {
    throw new Error(
      `Unexpected real fetch() in a unit test: ${String(args[0])}. Mock it with vi.fn().`,
    );
  }) as typeof fetch;
});

// Keep a reference so a test could opt back into the real implementation if ever needed.
export { realFetch };

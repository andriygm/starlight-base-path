import { mock, describe, test, expect, afterEach } from "bun:test";

// Mock the Starlight import so we can test without the full Astro runtime.
// defineRouteMiddleware is just a typed identity function, so a passthrough works.
mock.module("@astrojs/starlight/route-data", () => ({
  defineRouteMiddleware: (fn: Function) => fn,
}));

function makeContext(baseUrl: string, heroActions?: { link: string }[]) {
  // Set BASE_URL so import.meta.env.BASE_URL resolves in Bun
  process.env.BASE_URL = baseUrl;

  return {
    locals: {
      starlightRoute: {
        entry: {
          data: {
            hero: heroActions ? { actions: heroActions } : undefined,
          },
        },
      },
    },
  };
}

afterEach(() => {
  delete process.env.BASE_URL;
});

describe("middleware – default base path", () => {
  test("hero action links are unchanged when base is /", async () => {
    const actions = [{ link: "/getting-started" }];
    const ctx = makeContext("/", actions);
    // Re-import to pick up the fresh env
    const { onRequest } = await import("../middleware.ts");
    await onRequest(ctx as any, async () => {});
    expect(actions[0].link).toBe("/getting-started");
  });
});

describe("middleware – custom base path", () => {
  test("root-relative hero action links get the base prepended", async () => {
    const actions = [{ link: "/getting-started" }];
    const ctx = makeContext("/docs/", actions);
    const { onRequest } = await import("../middleware.ts");
    await onRequest(ctx as any, async () => {});
    expect(actions[0].link).toBe("/docs/getting-started");
  });

  test("external hero action links are not modified", async () => {
    const actions = [{ link: "https://example.com" }];
    const ctx = makeContext("/docs/", actions);
    const { onRequest } = await import("../middleware.ts");
    await onRequest(ctx as any, async () => {});
    expect(actions[0].link).toBe("https://example.com");
  });

  test("pages without hero actions are handled gracefully", async () => {
    const ctx = makeContext("/docs/");
    const { onRequest } = await import("../middleware.ts");
    // Should not throw
    await onRequest(ctx as any, async () => {});
  });
});

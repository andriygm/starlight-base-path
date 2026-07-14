import { describe, test, expect } from "bun:test";
import { satteriBasePath } from "../satteri.ts";

/**
 * Drive the Sätteri mdast plugin the way the real processor does: dispatch a
 * `link` node to the visitor with a context whose `setProperty` records the
 * URL edit (Sätteri nodes are read-only and mutated through the context).
 */
function rewriteLinkUrl(url: string, base?: string): string {
  const plugin = satteriBasePath(base);
  const node = { url };
  let result = url;
  plugin.link(node, {
    setProperty: (target, key, value) => {
      if (target === node && key === "url") result = value;
    },
  });
  return result;
}

describe("satteri plugin – default base path", () => {
  test("root-relative links are unchanged", () => {
    expect(rewriteLinkUrl("/reference/cli")).toBe("/reference/cli");
  });

  test("external links are unchanged", () => {
    expect(rewriteLinkUrl("https://example.com")).toBe("https://example.com");
  });
});

describe("satteri plugin – custom base path", () => {
  test("root-relative links get the base prepended", () => {
    expect(rewriteLinkUrl("/reference/cli", "/docs/")).toBe("/docs/reference/cli");
  });

  test("base without trailing slash is normalised", () => {
    expect(rewriteLinkUrl("/reference/cli", "/docs")).toBe("/docs/reference/cli");
  });

  test("external links are not modified", () => {
    expect(rewriteLinkUrl("https://example.com", "/docs/")).toBe("https://example.com");
  });

  test("relative links are not modified", () => {
    expect(rewriteLinkUrl("../sibling", "/docs/")).toBe("../sibling");
  });
});

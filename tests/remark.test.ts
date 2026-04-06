import { describe, test, expect, afterEach } from "bun:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { Link } from "mdast";

function getLinkUrls(markdown: string): string[] {
  // Import must be deferred so each test picks up the current env
  const { remarkBasePath } = require("../remark.ts");
  const processor = unified().use(remarkParse).use(remarkBasePath);
  const tree = processor.runSync(processor.parse(markdown));
  const urls: string[] = [];
  visit(tree, "link", (node: Link) => urls.push(node.url));
  return urls;
}

afterEach(() => {
  delete process.env.ASTRO_BASE;
});

describe("remark plugin – default base path", () => {
  test("root-relative links are unchanged", () => {
    delete process.env.ASTRO_BASE;
    expect(getLinkUrls("[page](/reference/cli)")).toEqual(["/reference/cli"]);
  });

  test("external links are unchanged", () => {
    delete process.env.ASTRO_BASE;
    expect(getLinkUrls("[ext](https://example.com)")).toEqual([
      "https://example.com",
    ]);
  });
});

describe("remark plugin – custom base path", () => {
  test("root-relative links get the base prepended", () => {
    process.env.ASTRO_BASE = "/docs/";
    expect(getLinkUrls("[page](/reference/cli)")).toEqual([
      "/docs/reference/cli",
    ]);
  });

  test("base without trailing slash is normalised", () => {
    process.env.ASTRO_BASE = "/docs";
    expect(getLinkUrls("[page](/reference/cli)")).toEqual([
      "/docs/reference/cli",
    ]);
  });

  test("external links are not modified", () => {
    process.env.ASTRO_BASE = "/docs/";
    expect(getLinkUrls("[ext](https://example.com)")).toEqual([
      "https://example.com",
    ]);
  });

  test("relative links are not modified", () => {
    process.env.ASTRO_BASE = "/docs/";
    expect(getLinkUrls("[rel](../sibling)")).toEqual(["../sibling"]);
  });
});

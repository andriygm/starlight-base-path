import { describe, test, expect } from "bun:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { Link } from "mdast";
import { remarkBasePath } from "../remark.ts";

function getLinkUrls(markdown: string, base?: string): string[] {
  const processor = unified().use(remarkParse).use(remarkBasePath(base));
  const tree = processor.runSync(processor.parse(markdown));
  const urls: string[] = [];
  visit(tree, "link", (node: Link) => urls.push(node.url));
  return urls;
}

describe("remark plugin – default base path", () => {
  test("root-relative links are unchanged", () => {
    expect(getLinkUrls("[page](/reference/cli)")).toEqual(["/reference/cli"]);
  });

  test("external links are unchanged", () => {
    expect(getLinkUrls("[ext](https://example.com)")).toEqual([
      "https://example.com",
    ]);
  });
});

describe("remark plugin – custom base path", () => {
  test("root-relative links get the base prepended", () => {
    expect(getLinkUrls("[page](/reference/cli)", "/docs/")).toEqual([
      "/docs/reference/cli",
    ]);
  });

  test("base without trailing slash is normalised", () => {
    expect(getLinkUrls("[page](/reference/cli)", "/docs")).toEqual([
      "/docs/reference/cli",
    ]);
  });

  test("external links are not modified", () => {
    expect(getLinkUrls("[ext](https://example.com)", "/docs/")).toEqual([
      "https://example.com",
    ]);
  });

  test("relative links are not modified", () => {
    expect(getLinkUrls("[rel](../sibling)", "/docs/")).toEqual(["../sibling"]);
  });
});

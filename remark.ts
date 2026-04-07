import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that prepends the Astro base path to root-relative links.
 * This allows content authors to write links like `/reference/cli/remote`
 * without hardcoding the base path (e.g. `/docs/`).
 */
export function remarkBasePath(base: string = "/"): Plugin<[], Root> {
  const normalizedBase = normalizeBase(base);

  return () => (tree) => {
    visit(tree, "link", (node) => {
      if (node.url.startsWith("/")) {
        node.url = normalizedBase + node.url.slice(1);
      }
    });
  };
}

function normalizeBase(base: string): string {
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

import { normalizeBase } from "./base-path.ts";

/**
 * Minimal shape of the Sätteri mdast visitor context we rely on. The full type
 * lives in the (transitive) `satteri` package; we type it locally so the plugin
 * doesn't take a hard dependency on it just to compile.
 */
interface SatteriMdastContext {
  setProperty(node: { url: string }, key: "url", value: string): void;
}

/**
 * Sätteri mdast plugin that prepends the Astro base path to root-relative links,
 * mirroring `remarkBasePath` for Astro's default (Sätteri) Markdown processor.
 *
 * Sätteri exposes nodes as read-only and applies edits through the visitor
 * context, so the URL is rewritten via `ctx.setProperty` rather than mutated in
 * place the way remark plugins do.
 */
export function satteriBasePath(base: string = "/") {
  const normalizedBase = normalizeBase(base);

  return {
    name: "starlight-base-path",
    link(node: { url: string }, ctx: SatteriMdastContext) {
      if (node.url.startsWith("/")) {
        ctx.setProperty(node, "url", normalizedBase + node.url.slice(1));
      }
    },
  };
}

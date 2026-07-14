import type { StarlightPlugin } from "@astrojs/starlight/types";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { remarkBasePath } from "./remark.ts";
import { satteriBasePath } from "./satteri.ts";

// A native dynamic import that Astro's config-time Vite module runner won't
// rewrite. Built via `Function` so Vite can't statically see the `import()` and
// route it through its runner, which is already torn down by the time this
// plugin's async `astro:config:setup` hook runs (a plain `import()` there throws
// "Vite module runner has been closed").
const nativeImport: (url: string) => Promise<any> = new Function("url", "return import(url)") as any;

/**
 * Load the `@astrojs/markdown-remark` that the consumer's Astro actually uses,
 * anchored at the project root (`config.root`) and resolved via `astro`.
 *
 * Resolving relative to this plugin's own location is unreliable: when the
 * plugin is installed through a symlink (`file:`/workspace) or under strict,
 * isolated linking (pnpm, bun workspaces), it can't see the consumer's
 * dependency tree, so a bare `import("@astrojs/markdown-remark")` may silently
 * fail and drop us onto the deprecated remark-plugin path.
 */
async function loadMarkdownRemark(root: URL): Promise<any> {
  try {
    const requireFromRoot = createRequire(new URL("package.json", root));
    const astroEntry = requireFromRoot.resolve("astro");
    const requireFromAstro = createRequire(astroEntry);
    const entry = requireFromAstro.resolve("@astrojs/markdown-remark");
    return await nativeImport(pathToFileURL(entry).href);
  } catch {
    return null;
  }
}

export function starlightBasePath(): StarlightPlugin {
  return {
    name: "starlight-base-path",
    hooks: {
      "config:setup"({ addIntegration, addRouteMiddleware }) {
        addRouteMiddleware({
          entrypoint: "starlight-base-path/middleware",
          order: "post",
        });

        addIntegration({
          name: "starlight-base-path-remark",
          hooks: {
            "astro:config:setup": async ({ config, updateConfig, logger }) => {
              const remarkPlugin = remarkBasePath(config.base);

              // Astro >=7 renders Markdown through a pluggable `markdown.processor`
              // and only runs `markdown.remarkPlugins` when that processor is
              // `unified()`. `@astrojs/markdown-remark` only exports `unified` from
              // the version that shipped alongside that change, so fall back to the
              // legacy `remarkPlugins` config for older Astro/`@astrojs/markdown-remark`.
              const markdownRemark = await loadMarkdownRemark(config.root);

              if (!markdownRemark?.unified) {
                updateConfig({
                  markdown: {
                    remarkPlugins: [remarkPlugin],
                  },
                });
                return;
              }

              // Augment whichever processor is configured *in place* rather than
              // replacing it: other integrations (e.g. Starlight's asides) register
              // their transforms on the same processor object, and swapping in a
              // fresh one would silently drop them.
              const processor = (config.markdown as any).processor;

              if (processor && markdownRemark.isUnifiedProcessor(processor)) {
                processor.options.remarkPlugins.push(remarkPlugin);
                updateConfig({ markdown: { processor } as any });
                return;
              }

              // `satteri` is Astro 7's default processor; `name` is its public
              // contract (`isSatteriProcessor` is just this check). Its plugins
              // operate on mdast via a visitor context, so use the mdast variant.
              if (processor?.name === "satteri") {
                processor.options.mdastPlugins.push(satteriBasePath(config.base));
                updateConfig({ markdown: { processor } as any });
                return;
              }

              if (processor) {
                logger.warn(
                  `Unsupported \`markdown.processor\` ("${processor.name}"): the base path ` +
                    "won't be applied to root-relative Markdown links. Use the default " +
                    "`satteri()` processor or `unified()` from `@astrojs/markdown-remark`.",
                );
                return;
              }

              // No processor configured (e.g. plain Astro 7 without Starlight):
              // install a Unified one carrying our plugin.
              updateConfig({
                markdown: {
                  processor: markdownRemark.unified({ remarkPlugins: [remarkPlugin] }),
                } as any,
              });
            },
          },
        });
      },
    },
  };
}

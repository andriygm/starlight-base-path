import type { StarlightPlugin } from "@astrojs/starlight/types";
import { remarkBasePath } from "./remark.ts";

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
            "astro:config:setup": ({ config, updateConfig }) => {
              updateConfig({
                markdown: {
                  remarkPlugins: [remarkBasePath(config.base)],
                },
              });
            },
          },
        });
      },
    },
  };
}

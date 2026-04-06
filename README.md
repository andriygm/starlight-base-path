# starlight-base-path

A [Starlight](https://starlight.astro.build/) plugin that automatically prepends the configured Astro `base` path to root-relative links in your content.

## Overview

When deploying a Starlight site to a subpath (e.g. `/docs/`), all internal links need to include that prefix. Without this plugin, content authors must hardcode the base path into every link, which breaks portability across environments.

This plugin solves that by letting you write root-relative links like `/reference/cli/remote` in your content, and automatically prepending the base path at build time. It handles two layers:

- **Markdown/MDX body links** — a remark plugin rewrites `[text](/path)` links in content
- **Starlight frontmatter links** — route middleware rewrites values like `hero.actions[].link`

## Setup

### Install

```bash
bun add starlight-base-path
```

Or link it locally if it lives alongside your docs:

```bash
bun add ./starlight-base-path
```

### Configure

Add the plugin to your `astro.config.mjs`:

```js
import { starlightBasePath } from "starlight-base-path";

export default defineConfig({
  base: process.env.ASTRO_BASE || "/",

  integrations: [
    starlight({
      plugins: [starlightBasePath()],
    }),
  ],
});
```

### Write links without the base path

In your markdown/MDX content, use root-relative links without the base path prefix:

```md
See the [CLI reference](/reference/cli/remote) for more information.
```

In frontmatter (e.g. hero actions):

```yaml
hero:
  actions:
    - text: Get started
      link: /guides/getting-started
```

The plugin will prepend the base path automatically. With `ASTRO_BASE=/docs/`, the above links resolve to `/docs/reference/cli/remote` and `/docs/guides/getting-started` respectively. With no `ASTRO_BASE` (or `/`), they stay as-is.

## Compatibility

Requires `@astrojs/starlight` >= 0.38.0 and `astro` >= 6.0.0.

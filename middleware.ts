import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import type { StarlightRouteData } from "@astrojs/starlight/route-data";

export const onRequest = defineRouteMiddleware((context, next) => {
  const route = (context.locals as any).starlightRoute as StarlightRouteData;
  const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

  if (route.entry.data.hero?.actions) {
    for (const action of route.entry.data.hero.actions) {
      if (action.link.startsWith("/")) {
        action.link = `${base}${action.link}`;
      }
    }
  }

  return next();
});

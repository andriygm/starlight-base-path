/** Normalize a base path to a leading- and trailing-slash form (e.g. `/docs/`). */
export function normalizeBase(base: string): string {
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

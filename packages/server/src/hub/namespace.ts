/**
 * Tool namespacing: `${slug}__${toolName}`.
 * The double underscore is unambiguous because connector tool names never
 * contain `__` (asserted at aggregation time).
 */
const SEP = '__';

export function namespaced(slug: string, name: string): string {
  return `${slug}${SEP}${name}`;
}

export function decodeNamespaced(name: string): { slug: string; tool: string } | null {
  const idx = name.indexOf(SEP);
  if (idx <= 0) return null;
  return { slug: name.slice(0, idx), tool: name.slice(idx + SEP.length) };
}

/** Instance slug from display name: kebab-case, unique per hub. */
export function slugify(displayName: string, taken: Set<string>): string {
  let base =
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'connector';
  let slug = base;
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  taken.add(slug);
  return slug;
}

export function canonicalCatalogSegment(segment: string): string {
  return segment.replace(/^lls-/i, "");
}

export function getCanonicalCategoryPath(categoryId: string, categories: any[]): string {
  const parts: string[] = [];
  const visited = new Set<string>();
  let current = categories.find((category: any) => category.id === categoryId || canonicalCatalogSegment(String(category.id)) === canonicalCatalogSegment(categoryId));

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(canonicalCatalogSegment(String(current.id)));
    current = categories.find((category: any) => category.id === current.parentId);
  }

  return parts.join("/");
}

import type { Variant } from "@/types/product"

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

/**
 * Filters variants that match ALL selected attributes (ignores null selections).
 * Comparison is case-insensitive and trims spaces to avoid wrongly disabling options.
 */
export function getValidVariants(
  selectedAttributes: Record<string, string | null>,
  variants: Variant[]
): Variant[] {
  const entries = Object.entries(selectedAttributes).filter(
    (entry): entry is [string, string] => entry[1] != null && String(entry[1]).trim() !== ""
  )
  if (entries.length === 0) return variants

  return variants.filter((v) =>
    entries.every(([attrName, value]) => norm(v.attributes[attrName]) === norm(value))
  )
}

/**
 * Returns true if at least one valid variant has the given attribute value.
 */
export function isOptionAvailable(
  attrName: string,
  attrValue: string,
  selectedAttributes: Record<string, string | null>,
  variants: Variant[]
): boolean {
  const hypothetical = { ...selectedAttributes, [attrName]: attrValue }
  return getValidVariants(hypothetical, variants).length > 0
}

/**
 * Finds the variant that matches exactly all selected attributes. Returns first match or null.
 * When nothing is selected (selectedCount === 0), returns null so the UI shows "Selecciona todas las opciones".
 */
export function findExactVariant(
  selectedAttributes: Record<string, string | null>,
  variants: Variant[]
): Variant | null {
  const selectedCount = Object.values(selectedAttributes).filter(
    (v) => v != null && String(v).trim() !== ""
  ).length
  if (selectedCount === 0) return null

  const valid = getValidVariants(selectedAttributes, variants)
  if (valid.length === 0) return null
  const attributeCount = Object.keys(selectedAttributes).filter(
    (k) => selectedAttributes[k] != null && String(selectedAttributes[k]).trim() !== ""
  ).length
  const totalAttrNames = new Set(variants.flatMap((v) => Object.keys(v.attributes))).size
  if (totalAttrNames > 0 && attributeCount < totalAttrNames) return null

  const withFullMatch = valid.filter((v) => {
    const variantAttrCount = Object.keys(v.attributes).filter(
      (k) => (v.attributes[k] ?? "").trim() !== ""
    ).length
    return variantAttrCount === selectedCount
  })
  return withFullMatch[0] ?? null
}

import type { Variant } from "@/types/product"

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase()
}

/**
 * Filters variants that match ALL selected attributes (ignores null selections).
 * Comparison is case-insensitive and trims spaces to avoid wrongly disabling options.
 * Handles duplicate attribute names with same normalized value (e.g. "Tipo/clasificación" and "Tipo/Clasificación").
 */
export function getValidVariants(
  selectedAttributes: Record<string, string | null>,
  variants: Variant[]
): Variant[] {
  const entries = Object.entries(selectedAttributes).filter(
    (entry): entry is [string, string] => entry[1] != null && String(entry[1]).trim() !== ""
  )
  if (entries.length === 0) return variants

  return variants.filter((v) => {
    // Para cada atributo seleccionado, verificar que la variante tenga al menos un atributo con ese valor normalizado
    return entries.every(([selectedAttrName, selectedValue]) => {
      const normalizedSelectedValue = norm(selectedValue)
      // Buscar en todos los atributos de la variante si alguno tiene el mismo valor normalizado
      for (const [variantAttrName, variantValue] of Object.entries(v.attributes)) {
        if (norm(variantValue) === normalizedSelectedValue) {
          return true // Encontrado un atributo con el mismo valor
        }
      }
      return false // No se encontró ningún atributo con este valor
    })
  })
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
 * Variant "fully matches" selection when every unique attribute value present in the variant
 * is selected and matches. Ignores duplicate attribute names with the same normalized value
 * (e.g. "Tipo/clasificación" and "Tipo/Clasificación" both with "Interior").
 * Also handles cases where selected attribute name doesn't match variant attribute names
 * but the values match (e.g. user selects "Tipo/clasificación" but variant has "dominant").
 */
function variantFullyMatchesSelection(
  v: Variant,
  selectedAttributes: Record<string, string | null>
): boolean {
  // Agrupar atributos de la variante por valor normalizado para detectar duplicados
  const variantAttrsByValue = new Map<string, Set<string>>() // valor_normalizado -> Set<nombres>
  for (const [attrName, val] of Object.entries(v.attributes)) {
    if (val == null || String(val).trim() === "") continue
    const normalizedVal = norm(val)
    if (!variantAttrsByValue.has(normalizedVal)) {
      variantAttrsByValue.set(normalizedVal, new Set())
    }
    variantAttrsByValue.get(normalizedVal)!.add(attrName)
  }
  
  // Para cada valor único en la variante, verificar que esté seleccionado (por nombre o por valor)
  for (const [normalizedVal, attrNames] of variantAttrsByValue.entries()) {
    // Buscar si algún nombre de este valor está en selectedAttributes
    let foundByName = false
    for (const attrName of attrNames) {
      const selected = selectedAttributes[attrName]
      if (selected != null && String(selected).trim() !== "" && norm(selected) === normalizedVal) {
        foundByName = true
        break
      }
    }
    
    // Si no se encontró por nombre, buscar por valor normalizado en selectedAttributes
    if (!foundByName) {
      let foundByValue = false
      for (const [selectedAttrName, selectedValue] of Object.entries(selectedAttributes)) {
        if (selectedValue != null && String(selectedValue).trim() !== "" && norm(selectedValue) === normalizedVal) {
          foundByValue = true
          break
        }
      }
      if (!foundByValue) return false
    }
  }
  return true
}

/**
 * Checks if all required attributes (by name) have a selected value.
 */
export function hasAllRequiredSelections(
  selectedAttributes: Record<string, string | null>,
  requiredAttrNames: string[]
): boolean {
  if (requiredAttrNames.length === 0) return true
  return requiredAttrNames.every((name) => {
    const val = selectedAttributes[name]
    return val != null && String(val).trim() !== ""
  })
}

/**
 * Finds the variant that matches the selected attributes. Returns the first match or null.
 * Requires ALL required attribute names to be selected before returning any variant.
 * When nothing is selected (selectedCount === 0), returns null.
 */
export function findExactVariant(
  selectedAttributes: Record<string, string | null>,
  variants: Variant[],
  requiredAttrNames?: string[]
): Variant | null {
  const selectedCount = Object.values(selectedAttributes).filter(
    (v) => v != null && String(v).trim() !== ""
  ).length
  if (selectedCount === 0) return null

  // Exigir que TODOS los atributos requeridos estén seleccionados
  if (requiredAttrNames && requiredAttrNames.length > 0) {
    if (!hasAllRequiredSelections(selectedAttributes, requiredAttrNames)) return null
  }

  const valid = getValidVariants(selectedAttributes, variants)
  if (valid.length === 0) return null

  // Solo retornar variante si hay UNA sola variante que coincida completamente
  // (evita devolver variante con selección parcial cuando hay varias opciones)
  if (valid.length === 1) {
    return variantFullyMatchesSelection(valid[0], selectedAttributes) ? valid[0] : null
  }

  const fullMatch = valid.filter((v) => variantFullyMatchesSelection(v, selectedAttributes))
  return fullMatch.length > 0 ? fullMatch[0] : null
}

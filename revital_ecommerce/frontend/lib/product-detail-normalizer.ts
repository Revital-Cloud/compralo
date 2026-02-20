/**
 * Normalizes the API product detail response to ProductDetailForSelector.
 * Maps attribute_id to attribute name and adds image per variant from images_by_variant.
 */

import type {
  ProductDetailForSelector,
  Variant,
  AttributeDefinition,
} from "@/types/product"

/** API variant shape (attributes keyed by attribute_id). */
interface ApiVariant {
  id: number
  price?: number
  stock?: number
  attributes?: Record<string, string>
}

/** API variant_options.attributes item (attribute_id puede ser number o string, ej. "dominant"). */
interface ApiAttributeItem {
  attribute_id: number | string
  attribute_name: string
  values: Array<{ value: string; hex_color?: string | null; variant_ids?: number[] }>
}

/** API product response (relevant fields only). Input for normalizer. */
export interface ApiProductResponse {
  id?: number | string
  name?: string
  description?: string
  variants?: ApiVariant[]
  variant_options?: {
    attributes?: ApiAttributeItem[]
  }
  images_by_variant?: Record<string, Array<{ image_url?: string; is_main?: boolean; sort_order?: number }>>
}

function getFirstVariantImage(
  imagesByVariant: Record<string, Array<{ image_url?: string; is_main?: boolean; sort_order?: number }>> | undefined,
  variantId: number
): string | null {
  if (!imagesByVariant) return null
  const list = imagesByVariant[String(variantId)]
  if (!list?.length) return null
  const sorted = [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const main = sorted.find((i) => i.is_main) ?? sorted[0]
  return main?.image_url ?? null
}

/**
 * Builds attributeDefinitions from API variant_options.attributes (name + unique values with hex_color).
 */
function buildAttributeDefinitions(apiAttributes: ApiAttributeItem[] | undefined): AttributeDefinition[] {
  if (!apiAttributes?.length) return []
  return apiAttributes.map((attr) => {
    const seen = new Map<string, { value: string; hex_color?: string | null }>()
    for (const v of attr.values ?? []) {
      const key = (v.value ?? "").trim()
      if (key && !seen.has(key)) {
        seen.set(key, { value: v.value ?? "", hex_color: v.hex_color ?? null })
      }
    }
    return {
      name: (attr.attribute_name ?? "").trim() || `Atributo ${attr.attribute_id}`,
      values: Array.from(seen.values()),
    }
  })
}

/**
 * Builds attribute_id -> attribute_name map from variant_options.attributes.
 */
function buildAttrIdToNameMap(apiAttributes: ApiAttributeItem[] | undefined): Record<string, string> {
  const map: Record<string, string> = {}
  if (!apiAttributes) return map
  for (const a of apiAttributes) {
    const name = (a.attribute_name ?? "").trim() || `Atributo ${String(a.attribute_id)}`
    map[String(a.attribute_id)] = name
  }
  return map
}

/**
 * Resolves variant attribute value (value_id or raw) to display value using variant_options.
 * For each attribute, finds the value whose variant_ids contains this variantId.
 */
function resolveDisplayValue(
  apiAttributes: ApiAttributeItem[] | undefined,
  attrId: string,
  rawValue: string,
  variantId: number
): string {
  if (!apiAttributes) return rawValue
  const attr = apiAttributes.find((a) => String(a.attribute_id) === String(attrId))
  if (!attr?.values?.length) return rawValue
  const val = attr.values.find((v) => (v.variant_ids ?? []).includes(variantId))
  if (val?.value != null && String(val.value).trim()) return String(val.value).trim()
  return rawValue
}

/**
 * Converts API product response to ProductDetailForSelector.
 * Variants get attributes keyed by attribute name with display values (no value_ids).
 */
export function normalizeProductDetail(apiProduct: ApiProductResponse | null | undefined): ProductDetailForSelector | null {
  if (!apiProduct?.variants?.length) return null

  const apiAttributes = apiProduct.variant_options?.attributes
  const attrIdToName = buildAttrIdToNameMap(apiAttributes)
  const attributeDefinitions = buildAttributeDefinitions(apiAttributes)
  const imagesByVariant = apiProduct.images_by_variant

  const variants: Variant[] = apiProduct.variants.map((v) => {
    const attrsByKey = v.attributes ?? {}
    const attributesByName: Record<string, string> = {}
    const variantId = Number(v.id)
    // Track which attribute names (normalized) we've already added to avoid duplicates
    const addedNames = new Set<string>()
    // Priorizar atributos que vienen de attributeDefinitions (mapeados desde attribute_id)
    // sobre claves literales que no están en el mapa
    const prioritizedEntries: Array<[string, string]> = []
    const literalEntries: Array<[string, string]> = []
    
    for (const [attrId, rawValue] of Object.entries(attrsByKey)) {
      if (rawValue == null || String(rawValue).trim() === "") continue
      const name = attrIdToName[attrId] ?? attrId
      const displayValue = resolveDisplayValue(apiAttributes, attrId, String(rawValue), variantId)
      // Si el attrId está en el mapa (viene de attributeDefinitions), tiene prioridad
      if (attrIdToName[attrId]) {
        prioritizedEntries.push([name, displayValue])
      } else {
        literalEntries.push([name, displayValue])
      }
    }
    
    // Procesar primero los prioritarios (mapeados desde attributeDefinitions)
    for (const [name, displayValue] of prioritizedEntries) {
      const normalizedName = name.trim().toLowerCase()
      if (!addedNames.has(normalizedName)) {
        attributesByName[name] = displayValue
        addedNames.add(normalizedName)
      }
    }
    
    // Luego procesar los literales, saltando duplicados
    for (const [name, displayValue] of literalEntries) {
      const normalizedName = name.trim().toLowerCase()
      const normalizedValue = displayValue.trim().toLowerCase()
      
      if (addedNames.has(normalizedName)) {
        // Ya existe un atributo con este nombre normalizado - verificar si el valor es el mismo
        const existingEntry = Object.entries(attributesByName).find(
          ([k]) => k.trim().toLowerCase() === normalizedName
        )
        if (existingEntry) {
          const existingValueNorm = String(existingEntry[1]).trim().toLowerCase()
          // Si el nombre normalizado coincide y el valor también, es un duplicado - saltar
          if (existingValueNorm === normalizedValue) {
            continue // Mismo nombre y mismo valor - saltar duplicado
          }
          // Si el nombre coincide pero el valor es diferente, mantener ambos (caso raro pero posible)
        }
      }
      
      attributesByName[name] = displayValue
      addedNames.add(normalizedName)
    }
    return {
      id: variantId,
      price: Number(v.price ?? 0),
      stock: Number(v.stock ?? 0),
      image: getFirstVariantImage(imagesByVariant, variantId),
      attributes: attributesByName,
    }
  })

  return {
    id: Number(apiProduct.id ?? 0),
    name: String(apiProduct.name ?? ""),
    description: apiProduct.description != null ? String(apiProduct.description) : undefined,
    variants,
    attributeDefinitions,
  }
}

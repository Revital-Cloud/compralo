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

/** API variant_options.attributes item. */
interface ApiAttributeItem {
  attribute_id: number
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
    const name = (a.attribute_name ?? "").trim() || `Atributo ${a.attribute_id}`
    map[String(a.attribute_id)] = name
  }
  return map
}

/**
 * Converts API product response to ProductDetailForSelector.
 * Variants get attributes keyed by attribute name and image from images_by_variant.
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
    for (const [attrId, value] of Object.entries(attrsByKey)) {
      const name = attrIdToName[attrId] ?? attrId
      if (value != null && value !== "") {
        attributesByName[name] = String(value)
      }
    }
    return {
      id: Number(v.id),
      price: Number(v.price ?? 0),
      stock: Number(v.stock ?? 0),
      image: getFirstVariantImage(imagesByVariant, Number(v.id)),
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

/**
 * Helpers para manejar imágenes de productos de manera segura
 * Maneja diferentes formatos: string, objeto JSON, array, etc.
 * 
 * El backend envía img_producto como:
 * {
 *   main: "https://ejemplo.com/imagen.jpg",
 *   gallery: ["https://ejemplo.com/galeria1.jpg", "https://ejemplo.com/galeria2.jpg"]
 * }
 */

// Tipos para las imágenes
export interface ProductImages {
  main: string;
  gallery?: string[];
  thumbnails?: string[];
}

export type ImageInput = string | ProductImages | Record<string, any> | null | undefined;

/**
 * Valida si una imagen es válida para usar en Next.js Image
 * @param imageUrl - URL de la imagen o valor que puede ser string, null, undefined
 * @returns true si la imagen es válida, false en caso contrario
 */
export const isValidProductImage = (imageUrl: any): boolean => {
  if (!imageUrl) return false
  if (typeof imageUrl !== 'string') return false
  if (imageUrl.trim() === '') return false
  
  // Verificar que sea una URL válida
  try {
    const url = new URL(imageUrl)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    // Si no es una URL válida, verificar que sea una ruta relativa válida
    return imageUrl.startsWith('/') || imageUrl.startsWith('./')
  }
}

/**
 * Extrae la URL principal de la imagen del producto desde diferentes formatos
 * @param imageInput - Puede ser string, objeto ProductImages, o diccionario JSON
 * @returns URL de la imagen principal o null si no es válida
 */
export const extractMainImageUrl = (imageInput: ImageInput): string | null => {
  if (!imageInput) return null
  
  // Caso 1: String directo
  if (typeof imageInput === 'string') {
    return isValidProductImage(imageInput) ? imageInput : null
  }
  
  // Caso 2: Objeto ProductImages tipado
  if (typeof imageInput === 'object' && imageInput !== null) {
    // Verificar si tiene la estructura ProductImages
    if ('main' in imageInput && typeof imageInput.main === 'string') {
      return isValidProductImage(imageInput.main) ? imageInput.main : null
    }
    
    // Caso 3: Diccionario JSON del backend (puede tener diferentes claves)
    const possibleKeys = ['main', 'primary', 'image', 'image_url', 'url', 'src', 'img_producto']
    
    for (const key of possibleKeys) {
      if (key in imageInput && typeof (imageInput as Record<string, any>)[key] === 'string') {
        const url = (imageInput as Record<string, any>)[key]
        if (isValidProductImage(url)) {
          return url
        }
      }
    }
    
    // Caso 4: Si es un array, tomar el primer elemento
    if (Array.isArray(imageInput) && imageInput.length > 0) {
      const firstItem = imageInput[0]
      if (typeof firstItem === 'string' && isValidProductImage(firstItem)) {
        return firstItem
      }
    }
  }
  
  return null
}

/**
 * Obtiene la URL de la imagen del producto o una imagen por defecto
 * @param imageInput - Input de imagen en cualquier formato
 * @param fallbackImage - Imagen por defecto (opcional)
 * @returns URL válida de la imagen
 */
export const getProductImageUrl = (
  imageInput: ImageInput, 
  fallbackImage: string = '/placeholder-product.jpg'
): string => {
  const mainUrl = extractMainImageUrl(imageInput)
  return mainUrl || fallbackImage
}

/**
 * Obtiene la URL de la imagen del producto con validación estricta
 * @param imageInput - Input de imagen en cualquier formato
 * @param fallbackImage - Imagen por defecto (opcional)
 * @returns URL válida de la imagen o null si no es válida
 */
export const getProductImageUrlStrict = (
  imageInput: ImageInput, 
  fallbackImage: string = '/placeholder-product.jpg'
): string | null => {
  const mainUrl = extractMainImageUrl(imageInput)
  return mainUrl || null
}

/**
 * Obtiene todas las URLs de imágenes del producto (main + gallery)
 * @param imageInput - Input de imagen en cualquier formato
 * @returns Array de URLs válidas
 */
export const getAllProductImageUrls = (imageInput: ImageInput): string[] => {
  const urls: string[] = []
  
  if (!imageInput) return urls
  
  // Obtener imagen principal
  const mainUrl = extractMainImageUrl(imageInput)
  if (mainUrl) {
    urls.push(mainUrl)
  }
  
  // Obtener imágenes de la galería
  if (typeof imageInput === 'object' && imageInput !== null) {
    // Caso ProductImages tipado
    if ('gallery' in imageInput && Array.isArray(imageInput.gallery)) {
      imageInput.gallery.forEach(url => {
        if (typeof url === 'string' && isValidProductImage(url)) {
          urls.push(url)
        }
      })
    }
    
    // Caso diccionario JSON del backend
    if ('gallery' in imageInput && Array.isArray(imageInput.gallery)) {
      imageInput.gallery.forEach(url => {
        if (typeof url === 'string' && isValidProductImage(url)) {
          urls.push(url)
        }
      })
    }
    
    // Caso array directo
    if (Array.isArray(imageInput)) {
      imageInput.forEach(item => {
        if (typeof item === 'string' && isValidProductImage(item)) {
          urls.push(item)
        }
      })
    }
  }
  
  return urls
}

/**
 * Renderiza condicionalmente una imagen de producto
 * @param imageInput - Input de imagen en cualquier formato
 * @param alt - Texto alternativo
 * @param className - Clases CSS
 * @param fallbackImage - Imagen por defecto
 * @returns Objeto con propiedades para renderizar la imagen
 */
export const getProductImageProps = (
  imageInput: ImageInput,
  alt: string,
  className: string = '',
  fallbackImage: string = '/placeholder-product.jpg'
) => {
  const mainUrl = extractMainImageUrl(imageInput)
  const isValid = !!mainUrl
  
  return {
    src: mainUrl || fallbackImage,
    alt,
    className,
    isValid
  }
}

/**
 * Verifica si una imagen está cargando o si hay un error
 * @param imageInput - Input de imagen en cualquier formato
 * @returns Estado de la imagen
 */
export const getImageStatus = (imageInput: ImageInput) => {
  if (!imageInput) return 'no-image'
  
  const mainUrl = extractMainImageUrl(imageInput)
  if (!mainUrl) return 'invalid-url'
  
  return 'valid'
}



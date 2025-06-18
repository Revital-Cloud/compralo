// Mock data para página de detalles de producto

export const mockProductDetails = {
  id: 1,
  name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
  price: 125.00,
  originalPrice: 180.00,
  rating: 4.5,
  reviewCount: 248,
  isNew: true,
  images: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop"
  ],
  colors: [
    { name: "Negro", value: "#1a1a1a", available: true },
    { name: "Azul Marino", value: "#1e3a8a", available: true },
    { name: "Gris", value: "#6b7280", available: false }
  ],
  sizes: [
    { name: "38", available: true },
    { name: "39", available: true },
    { name: "40", available: true },
    { name: "41", available: true },
    { name: "42", available: true },
    { name: "43", available: true },
    { name: "44", available: false },
    { name: "45", available: true },
    { name: "46", available: true }
  ],
  description: {
    title: "ACERCA DEL PRODUCTO",
    features: [
      "Diseño exclusivo para running/training outdoor",
      "Sin Goma ni Aleación",
      "Envío gratuito incluido para miembros del club"
    ]
  }
}

export const mockRelatedProducts = [
  {
    id: 2,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 125.00,
    originalPrice: 180.00,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    badge: "Oferta",
    badgeColor: "red"
  },
  {
    id: 3,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 140.00,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
    badge: "Nuevo",
    badgeColor: "blue"
  },
  {
    id: 4,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 135.00,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    badge: "Oferta",
    badgeColor: "green"
  },
  {
    id: 5,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 155.00,
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
    badge: "Nuevo",
    badgeColor: "orange"
  },
  {
    id: 6,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 165.00,
    image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=400&fit=crop",
    badge: "Oferta",
    badgeColor: "blue"
  },
  {
    id: 7,
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    price: 145.00,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    badge: "Nuevo",
    badgeColor: "red"
  }
] 
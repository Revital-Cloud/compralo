// Mock data para página de detalles de producto

export const mockProductDetails = {
  id: 1,
  name: "Smartphone Galaxy S24 Ultra",
  price: 1199.99,
  originalPrice: 1399.99,
  rating: 4.8,
  reviewCount: 256,
  isNew: false,
  images: [
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800&h=800&fit=crop"
  ],
  colors: [
    { name: "Negro Titanio", value: "#2c2c2c", available: true },
    { name: "Blanco", value: "#f8f8f8", available: true },
    { name: "Morado", value: "#8b5cf6", available: true },
    { name: "Verde", value: "#22c55e", available: false }
  ],
  sizes: [
    { name: "128GB", available: true },
    { name: "256GB", available: true },
    { name: "512GB", available: true },
    { name: "1TB", available: false }
  ],
  description: {
    title: "ACERCA DEL PRODUCTO",
    features: [
      "Cámara principal de 200MP con zoom óptico 100x",
      "Pantalla Dynamic AMOLED 2X de 6.8 pulgadas",
      "Procesador Snapdragon 8 Gen 3 para máximo rendimiento",
      "Batería de 5000mAh con carga rápida 45W",
      "S Pen integrado con funciones avanzadas",
      "Resistente al agua IP68"
    ]
  }
}

export const mockRelatedProducts = [
  {
    id: 2,
    name: "Auriculares Bluetooth Sony WH-1000XM5",
    price: 349.99,
    originalPrice: 399.99,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    badge: "Oferta",
    badgeColor: "red"
  },
  {
    id: 3,
    name: "Laptop MacBook Air M2",
    price: 1299.99,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
    badge: "Nuevo",
    badgeColor: "blue"
  },
  {
    id: 4,
    name: "Smartwatch Apple Watch Series 9",
    price: 399.99,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop",
    badge: "Oferta",
    badgeColor: "green"
  },
  {
    id: 5,
    name: "Tablet iPad Pro 12.9",
    price: 1099.99,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop",
    badge: "Nuevo",
    badgeColor: "orange"
  },
  {
    id: 6,
    name: "Cámara Canon EOS R6 Mark II",
    price: 2499.99,
    image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=400&fit=crop",
    badge: "Oferta",
    badgeColor: "blue"
  },
  {
    id: 7,
    name: "Monitor Gaming ASUS ROG 27",
    price: 599.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop",
    badge: "Nuevo",
    badgeColor: "red"
  }
] 
// Mock data for products listing page

export const mockProducts = [
  {
    id: 1,
    name: "Smartphone Galaxy S24 Ultra",
    price: 1199.99,
    originalPrice: 1399.99,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    badge: "Oferta",
    badgeColor: "orange",
    rating: 4.8,
    isFavorite: false
  },
  {
    id: 2,
    name: "Auriculares Bluetooth Sony WH-1000XM5",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
    badge: "Nuevo",
    badgeColor: "blue",
    rating: 4.7,
    isFavorite: true
  },
  {
    id: 3,
    name: "Laptop MacBook Air M2",
    price: 1299.99,
    originalPrice: 1499.99,
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400",
    badge: "Oferta",
    badgeColor: "orange",
    rating: 4.9,
    isFavorite: false
  },
  {
    id: 4,
    name: "Cámara Canon EOS R6 Mark II",
    price: 2499.99,
    image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400",
    rating: 4.6,
    isFavorite: false
  },
  {
    id: 5,
    name: "Smartwatch Apple Watch Series 9",
    price: 399.99,
    originalPrice: 449.99,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
    badge: "Oferta",
    badgeColor: "orange",
    rating: 4.5,
    isFavorite: true
  },
  {
    id: 6,
    name: "Tablet iPad Pro 12.9",
    price: 1099.99,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    badge: "Nuevo",
    badgeColor: "blue",
    rating: 4.8,
    isFavorite: false
  },
  {
    id: 7,
    name: "Monitor Gaming ASUS ROG 27",
    price: 599.99,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
    rating: 4.4,
    isFavorite: false
  },
  {
    id: 8,
    name: "Teclado Mecánico Logitech MX",
    price: 169.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
    badge: "Oferta",
    badgeColor: "orange",
    rating: 4.3,
    isFavorite: true
  },
  {
    id: 9,
    name: "Consola PlayStation 5",
    price: 499.99,
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400",
    rating: 4.9,
    isFavorite: false
  }
]

export const mockFilters = [
  {
    id: 'category',
    title: 'Categoría',
    type: 'checkbox' as const,
    options: [
      { id: 'electronics', label: 'Electrónicos', count: 45 },
      { id: 'clothing', label: 'Ropa', count: 32 },
      { id: 'home', label: 'Hogar', count: 28 },
      { id: 'sports', label: 'Deportes', count: 25 },
      { id: 'books', label: 'Libros', count: 15 },
      { id: 'beauty', label: 'Belleza', count: 12 }
    ]
  },
  {
    id: 'brand',
    title: 'Marca',
    type: 'checkbox' as const,
    options: [
      { id: 'apple', label: 'Apple', count: 25 },
      { id: 'samsung', label: 'Samsung', count: 20 },
      { id: 'sony', label: 'Sony', count: 18 },
      { id: 'nike', label: 'Nike', count: 15 },
      { id: 'adidas', label: 'Adidas', count: 12 },
      { id: 'logitech', label: 'Logitech', count: 10 }
    ]
  },
  {
    id: 'color',
    title: 'Color',
    type: 'color' as const,
    options: [
      { id: '#000000', label: 'Negro' },
      { id: '#FFFFFF', label: 'Blanco' },
      { id: '#FF0000', label: 'Rojo' },
      { id: '#0000FF', label: 'Azul' },
      { id: '#008000', label: 'Verde' },
      { id: '#FFD700', label: 'Dorado' },
      { id: '#C0C0C0', label: 'Plateado' },
      { id: '#800080', label: 'Morado' }
    ]
  },
  {
    id: 'price',
    title: 'Precio',
    type: 'checkbox' as const,
    options: [
      { id: '0-100', label: 'Menos de $100', count: 15 },
      { id: '100-500', label: '$100 - $500', count: 25 },
      { id: '500-1000', label: '$500 - $1000', count: 20 },
      { id: '1000-2000', label: '$1000 - $2000', count: 12 },
      { id: '2000+', label: 'Más de $2000', count: 8 }
    ]
  },
  {
    id: 'rating',
    title: 'Valoración',
    type: 'checkbox' as const,
    options: [
      { id: '4+', label: '4 estrellas o más', count: 65 },
      { id: '3+', label: '3 estrellas o más', count: 85 },
      { id: '2+', label: '2 estrellas o más', count: 95 },
      { id: '1+', label: '1 estrella o más', count: 100 }
    ]
  },
  {
    id: 'availability',
    title: 'Disponibilidad',
    type: 'checkbox' as const,
    options: [
      { id: 'in-stock', label: 'En stock', count: 89 },
      { id: 'pre-order', label: 'Pre-orden', count: 8 },
      { id: 'sale', label: 'En oferta', count: 15 }
    ]
  }
]

export const sortOptions = [
  { value: 'trending', label: 'Tendencias' },
  { value: 'newest', label: 'Más recientes' },
  { value: 'price-low', label: 'Precio: menor a mayor' },
  { value: 'price-high', label: 'Precio: mayor a menor' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'bestseller', label: 'Más vendidos' }
] 
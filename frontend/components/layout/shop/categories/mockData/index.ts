export interface Category {
  id: string;
  name: string;
  image: string;
  productCount?: number;
  featured?: boolean;
  description?: string;
  slug?: string;
}

// Categorías de ejemplo para la sección Categories
export const categories: Category[] = [
  {
    id: "1",
    name: "LIFESTYLE SHOES",
    image: "/api/placeholder/400/400",
    productCount: 156,
    featured: true,
    description: "Zapatos cómodos para el día a día",
    slug: "lifestyle-shoes"
  },
  {
    id: "2",
    name: "BASKETBALL SHOES", 
    image: "/api/placeholder/400/400",
    productCount: 89,
    featured: true,
    description: "Calzado especializado para basketball",
    slug: "basketball-shoes"
  },
  {
    id: "3",
    name: "RUNNING SHOES",
    image: "/api/placeholder/400/400",
    productCount: 203,
    featured: false,
    description: "Zapatillas diseñadas para correr",
    slug: "running-shoes"
  },
  {
    id: "4",
    name: "FOOTBALL SHOES",
    image: "/api/placeholder/400/400", 
    productCount: 67,
    featured: false,
    description: "Botines para fútbol y deportes de campo",
    slug: "football-shoes"
  },
  {
    id: "5",
    name: "CASUAL SNEAKERS",
    image: "/api/placeholder/400/400",
    productCount: 124,
    featured: true,
    description: "Sneakers casuales para cualquier ocasión",
    slug: "casual-sneakers"
  },
  {
    id: "6",
    name: "TRAINING SHOES",
    image: "/api/placeholder/400/400",
    productCount: 78,
    featured: false,
    description: "Calzado para entrenamientos y gimnasio",
    slug: "training-shoes"
  }
]; 
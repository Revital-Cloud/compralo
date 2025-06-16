export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  rating?: number;
}

// Productos de ejemplo para la sección New Drops
export const newDropsProducts: Product[] = [
  {
    id: "1",
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    brand: "ADIDAS",
    price: 95,
    originalPrice: 120,
    image: "/api/placeholder/300/300",
    badge: "NEW",
    rating: 4.5
  },
  {
    id: "2", 
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    brand: "ADIDAS",
    price: 85,
    image: "/api/placeholder/300/300",
    badge: "NEW",
    rating: 4.8
  },
  {
    id: "3",
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES", 
    brand: "ADIDAS",
    price: 110,
    image: "/api/placeholder/300/300",
    badge: "NEW",
    rating: 4.6
  },
  {
    id: "4",
    name: "ADIDAS 4DFWD X PARLEY RUNNING SHOES",
    brand: "ADIDAS", 
    price: 125,
    image: "/api/placeholder/300/300",
    badge: "NEW",
    rating: 4.7
  },
  {
    id: "5",
    name: "NIKE AIR MAX 270 REACT",
    brand: "NIKE",
    price: 140,
    originalPrice: 160,
    image: "/api/placeholder/300/300",
    badge: "NEW",
    rating: 4.3
  },
  {
    id: "6",
    name: "PUMA RS-X3 PUZZLE",
    brand: "PUMA",
    price: 90,
    image: "/api/placeholder/300/300",
    badge: "NEW",
    rating: 4.4
  }
]; 
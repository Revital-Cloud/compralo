import { Category, CategoryDisplay } from '@/types/category';
import { 
  Smartphone, 
  Home, 
  Sparkles, 
  ShoppingBag, 
  Gamepad2, 
  Heart,
  Laptop,
  Car,
  Shirt,
  Book,
  Baby,
  PawPrint,
  Utensils,
  Dumbbell,
  Music,
  Camera,
  Monitor,
  Keyboard,
  Mouse,
  Printer,
  Headphones,
  Watch,
  Tablet,
  Wallet,
  Footprints,
  Glasses,
  Wine,
  Scissors,
} from 'lucide-react';

// Mapeo de iconos disponibles (categorías, líneas y sublíneas)
const iconMapping: Record<string, any> = {
  // Tecnología / electrónica
  'electronica': Smartphone,
  'electrónicos': Smartphone,
  'tecnologia': Laptop,
  'tecnología': Laptop,
  'computadores': Laptop,
  'computadoras': Laptop,
  'portatiles': Laptop,
  'portátiles': Laptop,
  'laptops': Laptop,
  'notebooks': Laptop,
  'monitores': Monitor,
  'pantallas': Monitor,
  'teclados': Keyboard,
  'keyboard': Keyboard,
  'mouse': Mouse,
  'ratones': Mouse,
  'impresoras': Printer,
  'celulares': Smartphone,
  'smartphones': Smartphone,
  'tablets': Tablet,
  'auriculares': Headphones,
  'audífonos': Headphones,
  'headphones': Headphones,
  'relojes': Watch,
  'wearables': Watch,
  // Hogar y oficina
  'hogar': Home,
  'casa': Home,
  'oficina': Home,
  // Belleza y cuidado
  'belleza': Sparkles,
  'cosmeticos': Sparkles,
  'cosméticos': Sparkles,
  'maquillaje': Sparkles,
  'skincare': Sparkles,
  'perfumes': Wine,
  'fragancias': Wine,
  'cabello': Scissors,
  'peluqueria': Scissors,
  'peluquería': Scissors,
  // Moda y ropa
  'moda': ShoppingBag,
  'ropa': Shirt,
  'ropa y accesorios': Shirt,
  'vestimenta': Shirt,
  'accesorios': Shirt,
  'camisetas': Shirt,
  'camisas': Shirt,
  'pantalones': Shirt,
  'jeans': Shirt,
  'vestidos': Shirt,
  'zapatos': Footprints,
  'calzado': Footprints,
  'bolsos': Wallet,
  'carteras': Wallet,
  'billeteras': Wallet,
  'gafas': Glasses,
  'lentes': Glasses,
  'mujer': Shirt,
  'hombre': Shirt,
  'niño': Baby,
  'niña': Baby,
  'joyeria': Sparkles,
  'joyería': Sparkles,
  'componentes': Laptop,
  'software': Laptop,
  'almacenamiento': Laptop,
  'escáner': Printer,
  'escaner': Printer,
  'proyectores': Monitor,
  'decoración': Home,
  'decoracion': Home,
  'textiles': Shirt,
  'chaquetas': Shirt,
  'sudaderas': Shirt,
  'gaming': Gamepad2,
  'videojuegos': Gamepad2,
  'juegos': Gamepad2,
  // Salud y deportes
  'salud': Heart,
  'bienestar': Heart,
  'deportes': Dumbbell,
  'fitness': Dumbbell,
  'ejercicio': Dumbbell,
  'gimnasio': Dumbbell,
  'running': Footprints,
  'automoviles': Car,
  'autos': Car,
  'carros': Car,
  'vehículos': Car,
  'vehiculos': Car,
  // Cultura y educación
  'libros': Book,
  'literatura': Book,
  'educación': Book,
  'educacion': Book,
  'bebes': Baby,
  'bebés': Baby,
  'infantil': Baby,
  'niños': Baby,
  'niñas': Baby,
  'mascotas': PawPrint,
  'animales': PawPrint,
  'pets': PawPrint,
  // Alimentos y cocina
  'comida': Utensils,
  'alimentos': Utensils,
  'cocina': Utensils,
  'bebidas': Wine,
  'musica': Music,
  'música': Music,
  'audio': Music,
  'instrumentos': Music,
  'fotografia': Camera,
  'fotografía': Camera,
  'camaras': Camera,
  'cámaras': Camera,
};

// Mapeo de colores por categoría
const colorMapping: Record<string, { color: string; bgGradient: string; iconBg: string }> = {
  'electronica': { color: '#FF8C00', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  'electrónicos': { color: '#FF8C00', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  'tecnologia': { color: '#3B82F6', bgGradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100' },
  'tecnología': { color: '#3B82F6', bgGradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100' },
  'hogar y jardín': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'casa': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'jardin': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'jardín': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'belleza': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'belleza y cuidado personal': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'cuidado personal': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'cosmeticos': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'cosméticos': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'moda': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'ropa': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'accesorios': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'ropa y accesorios': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'gaming': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'videojuegos': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'salud': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'salud y bienestar': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'bienestar': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'deportes': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'ferreteria': { color: '#F59E0B', bgGradient: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-100' },
  'ferretería': { color: '#F59E0B', bgGradient: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-100' },
  'construccion': { color: '#EF4444', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'construcción': { color: '#EF4444', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'oficina': { color: '#6366F1', bgGradient: 'from-indigo-500 to-indigo-600', iconBg: 'bg-indigo-100' },
  'automoviles': { color: '#374151', bgGradient: 'from-gray-600 to-gray-700', iconBg: 'bg-gray-100' },
  'autos': { color: '#374151', bgGradient: 'from-gray-600 to-gray-700', iconBg: 'bg-gray-100' },
  'libros': { color: '#F59E0B', bgGradient: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-100' },
  'bebes': { color: '#FB7185', bgGradient: 'from-rose-400 to-rose-500', iconBg: 'bg-rose-100' },
  'bebés': { color: '#FB7185', bgGradient: 'from-rose-400 to-rose-500', iconBg: 'bg-rose-100' },
  'mascotas': { color: '#A855F7', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'comida': { color: '#F97316', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  'alimentos': { color: '#F97316', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  'bebidas': { color: '#F97316', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  'alimentos y bebidas': { color: '#F97316', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' },
  'musica': { color: '#06B6D4', bgGradient: 'from-cyan-500 to-cyan-600', iconBg: 'bg-cyan-100' },
  'música': { color: '#06B6D4', bgGradient: 'from-cyan-500 to-cyan-600', iconBg: 'bg-cyan-100' },
  'fotografia': { color: '#6366F1', bgGradient: 'from-indigo-500 to-indigo-600', iconBg: 'bg-indigo-100' },
  'fotografía': { color: '#6366F1', bgGradient: 'from-indigo-500 to-indigo-600', iconBg: 'bg-indigo-100' },
};

// Función para generar descripción basada en el nombre
const generateDescription = (categoryName: string): string => {
  const descriptions: Record<string, string> = {
    'electronica': 'Últimos gadgets y tecnología',
    'electrónicos': 'Últimos gadgets y tecnología',
    'tecnologia': 'Computadores y accesorios',
    'tecnología': 'Computadores y accesorios',
    'hogar': 'Decoración y muebles',
    'casa': 'Decoración y muebles',
    'jardin': 'Plantas y herramientas de jardín',
    'jardín': 'Plantas y herramientas de jardín',
    'belleza': 'Productos de cuidado personal',
    'belleza y cuidado personal': 'Productos de Belleza y cuidado personal',
    'cuidado personal': 'Productos de cuidado personal',
    'cosmeticos': 'Maquillaje y cuidado facial',
    'cosméticos': 'Maquillaje y cuidado facial',
    'moda': 'Ropa y accesorios',
    'ropa': 'Vestimenta para toda ocasión',
    'accesorios': 'Complementos de moda',
    'ropa y accesorios': 'Vestimenta y complementos',
    'gaming': 'Videojuegos y consolas',
    'videojuegos': 'Entretenimiento digital',
    'salud': 'Bienestar y cuidado',
    'salud y bienestar': 'Productos de Salud y bienestar',
    'bienestar': 'Bienestar y cuidado',
    'deportes': 'Equipos y accesorios deportivos',
    'ferreteria': 'Productos de Ferretería',
    'ferretería': 'Productos de Ferretería',
    'construccion': 'Productos de Construcción',
    'construcción': 'Productos de Construcción',
    'oficina': 'Productos de Oficina',
    'automoviles': 'Accesorios para vehículos',
    'autos': 'Accesorios para vehículos',
    'libros': 'Literatura y educación',
    'bebes': 'Productos para los más pequeños',
    'bebés': 'Productos para los más pequeños',
    'mascotas': 'Todo para tus compañeros peludos',
    'comida': 'Alimentos y bebidas',
    'alimentos': 'Productos alimenticios',
    'bebidas': 'Bebidas y refrescos',
    'alimentos y bebidas': 'Productos alimenticios y bebidas',
    'musica': 'Instrumentos y audio',
    'música': 'Instrumentos y audio',
    'fotografia': 'Equipos fotográficos',
    'fotografía': 'Equipos fotográficos',
  };

  const normalizedName = categoryName.toLowerCase().trim();
  return descriptions[normalizedName] || `Productos de ${categoryName}`;
};

// Normaliza texto para búsqueda (quita tildes para coincidencias)
const normalizeForMatch = (s: string) =>
  s.toLowerCase().trim().normalize('NFD').replace(/\u0300-\u036f/g, '');

// Intenta coincidir por nombre completo o por cada palabra (para líneas/sublíneas)
const getIconByName = (name: string) => {
  const n = normalizeForMatch(name);
  const withAccent = name.toLowerCase().trim();
  if (iconMapping[withAccent]) return iconMapping[withAccent];
  if (iconMapping[n]) return iconMapping[n];
  const words = n.split(/\s+/).filter((w) => w.length > 1);
  for (const w of words) {
    if (iconMapping[w]) return iconMapping[w];
  }
  return ShoppingBag;
};

/** Icono para categoría por nombre (exportado para uso en páginas). */
export const getIconForCategory = (categoryName: string) => getIconByName(categoryName);

/** Icono para línea por nombre (exportado para uso en páginas). */
export const getIconForLine = (nomLinea: string) => getIconByName(nomLinea);

/** Icono para sublínea por nombre (exportado para uso en páginas). */
export const getIconForSubline = (nomSublinea: string) => getIconByName(nomSublinea);

// Paleta de colores predefinida para asignar automáticamente a las categorías
const colorPalette = [
  { color: '#3B82F6', bgGradient: 'from-blue-500 to-blue-600', iconBg: 'bg-blue-100' }, // Azul
  { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' }, // Verde
  { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' }, // Rosa
  { color: '#F59E0B', bgGradient: 'from-amber-500 to-amber-600', iconBg: 'bg-amber-100' }, // Ámbar
  { color: '#EF4444', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' }, // Rojo
  { color: '#6366F1', bgGradient: 'from-indigo-500 to-indigo-600', iconBg: 'bg-indigo-100' }, // Índigo
  { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' }, // Púrpura
  { color: '#06B6D4', bgGradient: 'from-cyan-500 to-cyan-600', iconBg: 'bg-cyan-100' }, // Cian
  { color: '#F97316', bgGradient: 'from-orange-500 to-orange-600', iconBg: 'bg-orange-100' }, // Naranja
  { color: '#84CC16', bgGradient: 'from-lime-500 to-lime-600', iconBg: 'bg-lime-100' }, // Lima
];

// Función para obtener colores basados en el índice (posición en la lista)
const getColorsByIndex = (index: number) => {
  return colorPalette[index % colorPalette.length];
};

// Función para obtener colores basados en el nombre (mantenida para compatibilidad si se necesita)
const getColorsForCategory = (categoryName: string) => {
  const normalizedName = categoryName.toLowerCase().trim();
  return colorMapping[normalizedName] || {
    color: '#6B7280',
    bgGradient: 'from-gray-500 to-gray-600',
    iconBg: 'bg-gray-100'
  };
};

// Función principal para mapear categorías de API a categorías de display
export const mapCategoriesToDisplay = (categories: Category[]): CategoryDisplay[] => {
  if (!categories || !Array.isArray(categories)) return [];

  const isActive = (c: Category) => (c.ind_activo ?? c.is_active) !== false
  return categories
    .filter((category) => category && isActive(category))
    .map((category, index) => {
      // Asignar colores automáticamente basados en la posición
      const colors = getColorsByIndex(index);
      const icon = getIconByName(category.name);
      const description = generateDescription(category.name);
      return {
        id: String((category as { id?: number }).id ?? (category as { id_categoria?: number }).id_categoria ?? ''),
        name: category.name,
        description,
        icon: (icon as { name?: string }).name || 'ShoppingBag',
        color: colors.color,
        bgGradient: colors.bgGradient,
        iconBg: colors.iconBg,
        isActive: (category.ind_activo ?? category.is_active) !== false,
        productCount: category.productos_count ?? 0,
      };
    });
};

// Función para obtener el componente de icono
export const getIconComponent = (iconName: string) => {
  const iconKey = Object.keys(iconMapping).find(key => 
    iconMapping[key].name === iconName
  );
  
  if (iconKey) {
    return iconMapping[iconKey];
  }
  
  return ShoppingBag; // Icono por defecto
};

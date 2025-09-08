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
  Camera
} from 'lucide-react';

// Mapeo de iconos disponibles
const iconMapping: Record<string, any> = {
  'electronica': Smartphone,
  'electrónicos': Smartphone,
  'tecnologia': Laptop,
  'computadores': Laptop,
  'computadoras': Laptop,
  'hogar': Home,
  'casa': Home,
  'belleza': Sparkles,
  'cosmeticos': Sparkles,
  'cosméticos': Sparkles,
  'moda': ShoppingBag,
  'ropa': Shirt,
  'vestimenta': Shirt,
  'gaming': Gamepad2,
  'videojuegos': Gamepad2,
  'juegos': Gamepad2,
  'salud': Heart,
  'bienestar': Heart,
  'deportes': Dumbbell,
  'fitness': Dumbbell,
  'ejercicio': Dumbbell,
  'automoviles': Car,
  'autos': Car,
  'carros': Car,
  'libros': Book,
  'literatura': Book,
  'bebes': Baby,
  'bebés': Baby,
  'infantil': Baby,
  'mascotas': PawPrint,
  'animales': PawPrint,
  'pets': PawPrint,
  'comida': Utensils,
  'alimentos': Utensils,
  'cocina': Utensils,
  'musica': Music,
  'música': Music,
  'audio': Music,
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
  'hogar y jardín': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'casa': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'jardin': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'jardín': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
  'belleza': { color: '#fec806', bgGradient: 'from-yellow-500 to-yellow-600', iconBg: 'bg-yellow-100' },
  'cosmeticos': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'cosméticos': { color: '#EC4899', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'moda': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'ropa': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'accesorios': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'ropa y accesorios': { color: '#ec2538', bgGradient: 'from-red-500 to-red-600', iconBg: 'bg-red-100' },
  'gaming': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'videojuegos': { color: '#8B5CF6', bgGradient: 'from-purple-500 to-purple-600', iconBg: 'bg-purple-100' },
  'salud': { color: '#EF4444', bgGradient: 'from-pink-500 to-pink-600', iconBg: 'bg-pink-100' },
  'deportes': { color: '#10B981', bgGradient: 'from-green-500 to-green-600', iconBg: 'bg-green-100' },
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
    'hogar': 'Decoración y muebles',
    'casa': 'Decoración y muebles',
    'jardin': 'Plantas y herramientas de jardín',
    'jardín': 'Plantas y herramientas de jardín',
    'belleza': 'Productos de cuidado personal',
    'cosmeticos': 'Maquillaje y cuidado facial',
    'cosméticos': 'Maquillaje y cuidado facial',
    'moda': 'Ropa y accesorios',
    'ropa': 'Vestimenta para toda ocasión',
    'accesorios': 'Complementos de moda',
    'ropa y accesorios': 'Vestimenta y complementos',
    'gaming': 'Videojuegos y consolas',
    'videojuegos': 'Entretenimiento digital',
    'salud': 'Bienestar y cuidado',
    'deportes': 'Equipos y accesorios deportivos',
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

// Función para obtener el icono basado en el nombre
const getIconForCategory = (categoryName: string) => {
  const normalizedName = categoryName.toLowerCase().trim();
  return iconMapping[normalizedName] || ShoppingBag; // Icono por defecto
};

// Función para obtener colores basados en el nombre
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
  console.log('Raw categories from API:', categories);
  
  if (!categories || !Array.isArray(categories)) {
    console.error('Invalid categories data:', categories);
    return [];
  }
  
  return categories
    .filter(category => {
      console.log('Processing category:', category);
      return category && category.ind_activo; // Solo categorías activas
    })
    .map(category => {
      const colors = getColorsForCategory(category.nom_categoria);
      const icon = getIconForCategory(category.nom_categoria);
      const description = generateDescription(category.nom_categoria);

      const mappedCategory = {
        id: category.id_categoria,
        name: category.nom_categoria,
        description,
        icon: icon.name || 'ShoppingBag',
        color: colors.color,
        bgGradient: colors.bgGradient,
        iconBg: colors.iconBg,
        isActive: category.ind_activo,
      };
      
      console.log('Mapped category:', mappedCategory);
      return mappedCategory;
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

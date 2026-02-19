'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

type AdminTourContextValue = {
  startAdminOverviewTour: () => void;
  startProductsListTour: () => void;
  startProductCreateTour: () => void;
  startCategoriesListTour: () => void;
  startCategoryCreateTour: () => void;
  startAttributesTour: () => void;
  startBrandsTour: () => void;
  startProvidersTour: () => void;
  startUsersTour: () => void;
  startDiscountsTour: () => void;
  startPointsTour: () => void;
  startInfoBarTour: () => void;
  startAnalyticsTour: () => void;
  startOrdersTour: () => void;
};

const AdminTourContext = createContext<AdminTourContextValue | null>(null);

function getAdminOverviewSteps() {
  return [
    {
      element: '[data-tour-id="admin-sidebar"]',
      popover: {
        title: 'Navegación del panel',
        description:
          'Aquí encuentras todas las secciones del administrador: productos, categorías, pedidos, descuentos y más.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="admin-header"]',
      popover: {
        title: 'Barra superior',
        description:
          'Desde aquí verás el título de la sección actual, el acceso al chatbot de IA y el botón de ayuda con todos los recorridos del panel.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="admin-dashboard-kpis"]',
      popover: {
        title: 'Resumen de tu tienda',
        description:
          'Estas tarjetas muestran métricas clave como órdenes, ingresos y estado general. Úsalas para ver rápidamente cómo va tu negocio.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="admin-dashboard-charts"]',
      popover: {
        title: 'Gráficas y detalle',
        description:
          'Aquí tienes el detalle de ventas, productos más vendidos y órdenes recientes para entender mejor el comportamiento de tu tienda.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getProductsListSteps() {
  return [
    {
      element: '[data-tour-id="products-header"]',
      popover: {
        title: 'Gestión de productos',
        description:
          'Desde aquí puedes crear nuevos productos y acceder a acciones rápidas sobre todo el catálogo.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="products-filters"]',
      popover: {
        title: 'Filtros y búsqueda',
        description:
          'Usa estos campos para buscar por nombre, categoría, línea, marca o proveedor y encontrar productos rápidamente.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="products-table"]',
      popover: {
        title: 'Tabla de productos',
        description:
          'Aquí ves cada producto con su imagen, clasificación, precios, stock y estado. Desde la columna de acciones puedes ver, editar o activar/desactivar.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getProductCreateSteps() {
  return [
    {
      element: '[data-tour-id="product-create-header"]',
      popover: {
        title: 'Crear producto',
        description:
          'Esta cabecera te indica que estás creando un nuevo producto y te da contexto sobre el flujo.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="product-main-form"]',
      popover: {
        title: 'Información principal',
        description:
          'Completa el nombre, descripción, precios, stock y clasificación del producto. Estos campos son la base de cómo se mostrará en la tienda.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="product-images-panel"]',
      popover: {
        title: 'Imágenes del producto',
        description:
          'Sube imágenes claras y de buena calidad. La primera será la principal que verán tus clientes.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="product-submit-button"]',
      popover: {
        title: 'Guardar producto',
        description:
          'Cuando termines, usa este botón para crear el producto y agregarlo al catálogo.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getCategoriesListSteps() {
  return [
    {
      element: '[data-tour-id="categories-header"]',
      popover: {
        title: 'Categorías de productos',
        description:
          'Aquí gestionas la estructura de categorías que organiza todo tu catálogo.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="categories-tabs"]',
      popover: {
        title: 'Niveles de clasificación',
        description:
          'Usa estas pestañas para cambiar entre Categorías, Líneas y Sublíneas. Cada nivel permite agrupar productos con más detalle.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="categories-filters"]',
      popover: {
        title: 'Filtros de categorías',
        description:
          'Filtra por nombre o por categoría/ línea padre para encontrar rápidamente la clasificación que quieres editar.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="categories-table"]',
      popover: {
        title: 'Listado de categorías',
        description:
          'En esta tabla puedes ver cada categoría, su estado y acceder a acciones para editarla o activarla/desactivarla.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getCategoryCreateSteps() {
  return [
    {
      element: '[data-tour-id="categories-header"]',
      popover: {
        title: 'Crear nueva categoría',
        description:
          'Usa el botón “Agregar Categoría” para definir nuevas categorías, líneas o sublíneas.',
        side: 'bottom',
        align: 'start',
      },
    },
  ];
}

function getAttributesSteps() {
  return [
    {
      element: '[data-tour-id="attributes-header"]',
      popover: {
        title: 'Atributos de producto',
        description:
          'Aquí defines los atributos que luego podrás asociar a categorías y variantes (por ejemplo color, talla, material).',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="attributes-filters"]',
      popover: {
        title: 'Búsqueda de atributos',
        description:
          'Filtra rápidamente por nombre para encontrar el atributo que quieres editar o revisar.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="attributes-table"]',
      popover: {
        title: 'Listado de atributos',
        description:
          'En esta tabla gestionas cada atributo, su tipo de dato y si tiene valores predefinidos, además de editar o eliminar.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getBrandsSteps() {
  return [
    {
      element: '[data-tour-id="brands-header"]',
      popover: {
        title: 'Marcas',
        description:
          'Gestiona las marcas con las que trabajas para poder asociarlas a tus productos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="brands-filters"]',
      popover: {
        title: 'Buscar marcas',
        description:
          'Usa la búsqueda para encontrar marcas específicas dentro de tu catálogo.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="brands-table"]',
      popover: {
        title: 'Listado de marcas',
        description:
          'Desde aquí puedes ver, editar y activar o desactivar marcas según las necesites.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getProvidersSteps() {
  return [
    {
      element: '[data-tour-id="providers-header"]',
      popover: {
        title: 'Proveedores',
        description:
          'Registra y administra tus proveedores para llevar un mejor control de compras e inventario.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="providers-filters"]',
      popover: {
        title: 'Buscar proveedores',
        description:
          'Busca proveedores por nombre para encontrar rápidamente a quién necesitas.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="providers-table"]',
      popover: {
        title: 'Listado de proveedores',
        description:
          'Aquí puedes ver el detalle de cada proveedor, editar su información y activar o desactivarlo.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getUsersSteps() {
  return [
    {
      element: '[data-tour-id="users-header"]',
      popover: {
        title: 'Usuarios',
        description:
          'Sección para gestionar los usuarios de tu plataforma: admins y clientes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="users-stats"]',
      popover: {
        title: 'Resumen de usuarios',
        description:
          'Estas tarjetas muestran el recuento de usuarios por rol y estado (activos/inactivos).',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="users-table"]',
      popover: {
        title: 'Listado de usuarios',
        description:
          'Desde esta tabla puedes editar datos básicos y activar o desactivar usuarios.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getDiscountsSteps() {
  return [
    {
      element: '[data-tour-id="discounts-header"]',
      popover: {
        title: 'Descuentos y cupones',
        description:
          'Configura cupones y reglas de descuento para campañas y promociones.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="discounts-filters"]',
      popover: {
        title: 'Filtros de descuentos',
        description:
          'Filtra por tipo, estado y ordena para encontrar el descuento que buscas.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="discounts-table"]',
      popover: {
        title: 'Listado de descuentos',
        description:
          'Aquí ves cada descuento con su tipo, vigencia y estado, y puedes editarlo o activarlo/desactivarlo.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getPointsSteps() {
  return [
    {
      element: '[data-tour-id="points-header"]',
      popover: {
        title: 'Sistema de puntos',
        description:
          'Administra el programa de lealtad: tasas de conversión y configuración general.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="points-stats"]',
      popover: {
        title: 'Resumen de puntos',
        description:
          'Revisa las métricas clave del sistema de puntos y cómo se están usando.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="points-table"]',
      popover: {
        title: 'Usuarios con puntos',
        description:
          'Lista de usuarios con sus puntos disponibles, totales ganados y canjeados, y acceso a su historial.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getInfoBarSteps() {
  return [
    {
      element: '[data-tour-id="info-bar-header"]',
      popover: {
        title: 'Barra informativa',
        description:
          'Desde aquí configuras la barra superior que se muestra en tu tienda para comunicar mensajes importantes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="info-bar-preview"]',
      popover: {
        title: 'Vista previa',
        description:
          'Previsualiza cómo se verá el mensaje, colores y botón de llamada a la acción antes de publicarlo.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="info-bar-form"]',
      popover: {
        title: 'Configuración detallada',
        description:
          'Aquí defines el mensaje, colores, fechas de vigencia y, si quieres, un botón con enlace.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

function getAnalyticsSteps() {
  return [
    {
      element: '[data-tour-id="analytics-header"]',
      popover: {
        title: 'Analytics avanzados',
        description:
          'Panel con métricas detalladas de conversión, tráfico, clientes y productos.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="analytics-tabs"]',
      popover: {
        title: 'Vistas de análisis',
        description:
          'Usa estas pestañas para alternar entre vistas de conversión, tráfico, clientes y productos.',
        side: 'bottom',
        align: 'center',
      },
    },
  ];
}

function getOrdersSteps() {
  return [
    {
      element: '[data-tour-id="orders-header"]',
      popover: {
        title: 'Órdenes',
        description:
          'Vista general de todas las órdenes de tu tienda, con filtros y acceso al detalle de cada pedido.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour-id="orders-stats"]',
      popover: {
        title: 'Resumen de órdenes',
        description:
          'Estas tarjetas muestran cuántas órdenes tienes en cada estado y el total vendido.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="orders-filters"]',
      popover: {
        title: 'Filtros de órdenes',
        description:
          'Filtra por estado, rango de fechas o cliente para encontrar rápidamente las órdenes que necesitas revisar.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour-id="orders-table"]',
      popover: {
        title: 'Listado de órdenes',
        description:
          'Tabla con cada orden, su cliente, fecha, estado, monto y número de items. Desde aquí accedes al detalle de cada pedido.',
        side: 'top',
        align: 'center',
      },
    },
  ];
}

export const AdminTourProvider = ({ children }: { children: ReactNode }) => {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const getDriverInstance = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!driverRef.current) {
      driverRef.current = driver({
        showProgress: true,
        overlayOpacity: 0.5,
        smoothScroll: true,
        animate: true,
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: 'Cerrar',
      });
    }
    return driverRef.current;
  }, []);

  const startWithSteps = useCallback(
    (steps: any[]) => {
      const instance = getDriverInstance();
      if (!instance || !steps.length) return;
      instance.setSteps(steps);
      instance.drive();
    },
    [getDriverInstance],
  );

  const startAdminOverviewTour = useCallback(() => {
    startWithSteps(getAdminOverviewSteps());
  }, [startWithSteps]);

  const startProductsListTour = useCallback(() => {
    startWithSteps(getProductsListSteps());
  }, [startWithSteps]);

  const startProductCreateTour = useCallback(() => {
    startWithSteps(getProductCreateSteps());
  }, [startWithSteps]);

  const startCategoriesListTour = useCallback(() => {
    startWithSteps(getCategoriesListSteps());
  }, [startWithSteps]);

  const startCategoryCreateTour = useCallback(() => {
    startWithSteps(getCategoryCreateSteps());
  }, [startWithSteps]);

  const startAttributesTour = useCallback(() => {
    startWithSteps(getAttributesSteps());
  }, [startWithSteps]);

  const startBrandsTour = useCallback(() => {
    startWithSteps(getBrandsSteps());
  }, [startWithSteps]);

  const startProvidersTour = useCallback(() => {
    startWithSteps(getProvidersSteps());
  }, [startWithSteps]);

  const startUsersTour = useCallback(() => {
    startWithSteps(getUsersSteps());
  }, [startWithSteps]);

  const startDiscountsTour = useCallback(() => {
    startWithSteps(getDiscountsSteps());
  }, [startWithSteps]);

  const startPointsTour = useCallback(() => {
    startWithSteps(getPointsSteps());
  }, [startWithSteps]);

  const startInfoBarTour = useCallback(() => {
    startWithSteps(getInfoBarSteps());
  }, [startWithSteps]);

  const startAnalyticsTour = useCallback(() => {
    startWithSteps(getAnalyticsSteps());
  }, [startWithSteps]);

  const startOrdersTour = useCallback(() => {
    startWithSteps(getOrdersSteps());
  }, [startWithSteps]);

  return (
    <AdminTourContext.Provider
      value={{
        startAdminOverviewTour,
        startProductsListTour,
        startProductCreateTour,
        startCategoriesListTour,
        startCategoryCreateTour,
        startAttributesTour,
        startBrandsTour,
        startProvidersTour,
        startUsersTour,
        startDiscountsTour,
        startPointsTour,
        startInfoBarTour,
        startAnalyticsTour,
        startOrdersTour,
      }}
    >
      {children}
    </AdminTourContext.Provider>
  );
};

export const useAdminTour = () => {
  const ctx = useContext(AdminTourContext);
  if (!ctx) {
    throw new Error('useAdminTour debe usarse dentro de AdminTourProvider');
  }
  return ctx;
};


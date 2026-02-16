# Catálogo de productos e-commerce – Guía de población

Este documento está adaptado al **modelo actual de la base de datos** (categorías jerárquicas, productos con categoría hoja, marcas, proveedores, precio/stock en variantes) y sirve para **crear y poblar datos desde el Admin**.

---

## 1. Modelo de datos actual

### Categorías (`tab_categories`)

- **Jerarquía por `parent_id`**: una categoría puede tener padre (`parent_id` = ID del padre).
- **Niveles en este catálogo**:
  - **Padre (raíz):** `parent_id` = NULL → ej. Tecnología, Hogar, Moda.
  - **Hijo (línea):** `parent_id` = ID del padre → ej. Dispositivos Tecnológicos, Organización del Hogar.
  - **Nieta (sublínea / hoja):** `parent_id` = ID del hijo → ej. Smartphones, Neveras, Camisetas.
- Los **productos** se asocian siempre a una **categoría hoja** (nieta). En `tab_products`, `category_id` = ID de esa categoría (ej. “Smartphones”, “Neveras”).

### Productos (`tab_products`)

- `category_id`: categoría **hoja** (la sublínea donde se muestra el producto).
- `id_marca`: opcional; puede ser NULL si no hay marca.
- `id_proveedor`: opcional.
- **Precio y stock** no van en `tab_products`; van en **variantes** (`tab_product_variant_combinations`). Al crear un producto desde Admin, el primer precio/stock se guarda en la primera variante (o en el flujo de variantes que use el backend).

### Marcas (`tab_marcas`) y proveedores (`tab_proveedores`)

- Se crean desde Admin → Marcas y Admin → Proveedores.
- IDs generados por la base de datos. Al crear productos se elige marca y proveedor por nombre en la UI.

---

## 2. Orden recomendado para poblar la base de datos

1. **Categorías** (Admin → Categorías)  
   - Primero las **raíces** (padres), sin padre.  
   - Luego las **hijas** (parent_id = ID del padre).  
   - Por último las **nietas** (parent_id = ID del hijo).  
   - Los productos usarán el **ID de la categoría nieta** como `category_id`.

2. **Marcas** (Admin → Marcas)  
   - Crear todas las marcas que aparecen en el catálogo.  
   - Productos “sin marca” → dejar marca en blanco (NULL) si la UI lo permite.

3. **Proveedores** (Admin → Proveedores)  
   - Crear todos con **nombre**, **email** y **teléfono** únicos (el email debe ser único en la BD).

4. **Productos** (Admin → Productos)  
   - Categoría = la **sublínea** (nieta) correspondiente.  
   - Marca y proveedor según las tablas siguientes.  
   - Precio y stock se configuran en la variante (primera variante o flujo estándar del admin).

---

## 3. Árbol de categorías (padre → hijo → nieta)

Crear en este orden. El **ID** lo asigna la base de datos; al crear productos, usar la categoría **nieta** como categoría del producto.

| Padre (parent_id = NULL) | Hijo (parent_id = Padre) | Nieta (parent_id = Hijo) – categoría del producto |
|-------------------------|---------------------------|----------------------------------------------------|
| Tecnología              | Dispositivos Tecnológicos | Smartphones |
| Tecnología              | Dispositivos Tecnológicos | Laptops básicas |
| Tecnología              | Dispositivos Tecnológicos | Laptops gaming |
| Tecnología              | Dispositivos Tecnológicos | Ultrabooks |
| Tecnología              | Dispositivos Tecnológicos | Estaciones móviles |
| Tecnología              | Dispositivos Tecnológicos | Tablets |
| Tecnología              | Dispositivos Tecnológicos | Impresoras Multifuncionales |
| Tecnología              | Dispositivos Tecnológicos | Audífonos inalámbricos |
| Tecnología              | Dispositivos Tecnológicos | Mouse |
| Tecnología              | Dispositivos Tecnológicos | Cámaras digitales |
| Hogar                   | Organización del Hogar    | Neveras |
| Hogar                   | Organización del Hogar    | Lavadoras |
| Hogar                   | Organización del Hogar    | Estanterías |
| Hogar                   | Organización del Hogar    | Aspiradoras |
| Hogar                   | Decoración del Hogar       | Sofás |
| Hogar                   | Decoración del Hogar       | Camas |
| Hogar                   | Decoración del Hogar       | Mesas |
| Hogar                   | Decoración del Hogar       | Alfombras |
| Moda                    | Ropa Masculina             | Camisetas |
| Moda                    | Ropa Masculina             | Pantalones |
| Moda                    | Ropa Masculina             | Chaquetas |
| Moda                    | Ropa Femenina              | Blusas |
| Moda                    | Ropa Femenina              | Vestidos |
| Moda                    | Ropa Femenina              | Jeans |
| Deportes                | Equipamiento               | Pesas |
| Deportes                | Equipamiento               | Bicicletas |
| Deportes                | Equipamiento               | Balones |
| Deportes                | Equipamiento               | Máquinas de ejercicio |
| Deportes                | Indumentaria deportiva     | Camisetas deportivas |
| Deportes                | Indumentaria deportiva     | Licras |
| Electrónica de consumo  | Entretenimiento            | Televisores |
| Electrónica de consumo  | Entretenimiento            | Barras de sonido |
| Electrónica de consumo  | Entretenimiento            | Cámaras digitales (consumo) |
| Computadores            | PCs y All-in-One           | PCs gaming |
| Computadores            | PCs y All-in-One           | All-in-One |
| Computadores            | PCs y All-in-One           | Mini PC |
| Telefonía               | Accesorios                 | Fundas |
| Telefonía               | Accesorios                 | Cargadores |
| Telefonía               | Accesorios                 | Baterías externas |
| Electrodomésticos       | Cocina                     | Licuadoras |
| Electrodomésticos       | Cocina                     | Freidoras de aire |
| Electrodomésticos       | Cocina                     | Microondas |
| Oficina                 | Equipamiento oficina       | Impresoras |
| Oficina                 | Equipamiento oficina       | Sillas ergonómicas |
| Oficina                 | Equipamiento oficina       | Escritorios |
| Belleza y cuidado personal | Cuidado piel y cuerpo  | Cremas |
| Belleza y cuidado personal | Cuidado piel y cuerpo  | Sérums |
| Belleza y cuidado personal | Cuidado piel y cuerpo  | Jabones |
| Audio y video           | Monitores y proyección     | Monitores |
| Audio y video           | Monitores y proyección     | Proyectores |
| Iluminación             | Luminarias                 | Lámparas de techo |
| Iluminación             | Luminarias                 | Reflectores |
| Cocina                  | Utensilios                 | Ollas |
| Cocina                  | Utensilios                 | Sartenes |
| Cocina                  | Utensilios                 | Procesadores de alimentos |
| Calzado                 | Calzado                    | Deportivo masculino |
| Calzado                 | Calzado                    | Tacones |
| Salud y bienestar       | Monitoreo y masaje         | Tensiómetros |
| Salud y bienestar       | Monitoreo y masaje         | Masajeadores |
| Ferretería              | Herramientas               | Taladros |
| Ferretería              | Herramientas               | Martillos |
| Construcción            | Materiales                 | Cementos |
| Construcción            | Materiales                 | Pinturas |
| Papelería               | Papelería empresarial      | Cuadernos |
| Papelería               | Papelería empresarial      | Resmas de papel |
| Juguetes y entretenimiento | Juguetes educativos    | Juegos didácticos |
| Juguetes y entretenimiento | Juegos y ocio          | Juegos de mesa |
| Muebles                 | Muebles de oficina         | Escritorios (muebles) |
| Muebles                 | Muebles de oficina         | Archivadores |

**Nota:** Si en tu Admin ya existen “Líneas” o “Sublíneas” como entidades separadas, migra ese árbol al modelo anterior: un solo árbol en `tab_categories` con `parent_id`. La **nieta** es la que se usa como categoría del producto.

---

## 4. Marcas a crear (Admin → Marcas)

Crear estas marcas por nombre. Los productos “sin marca” pueden quedar con marca vacía (NULL) si la aplicación lo permite.

| Nombre |
|--------|
| Samsung |
| Apple |
| Xiaomi |
| Huawei |
| HP |
| Lenovo |
| Dell |
| Asus |
| Acer |
| Epson |
| Canon |
| Sony |
| Logitech |
| LG |
| Whirlpool |
| Black+Decker |
| Nike |
| Adidas |
| Puma |
| Under Armour |
| Philips |
| Panasonic |
| L'Oréal |
| Nivea |
| Makita |
| Stanley |
| Lego |
| GoPro |
| Spigen |
| OtterBox |
| Anker |
| Oster |
| Ninja |
| T-fal |
| Magefesa |
| Imusa |
| Lodge |
| Cuisinart |
| Omron |
| Beurer |
| Dove |
| Hasbro |
| Norma |
| Scribe |
| Atlas |

(Opcional: crear una marca “Sin marca” o “Genérico” y asignarla a los productos que en el catálogo figuran como “Sin marca específica”.)

---

## 5. Proveedores a crear (Admin → Proveedores)

Cada proveedor debe tener **nombre**, **email** (único) y **teléfono**. Aquí se listan nombres únicos con email y teléfono de ejemplo para poblar la BD.

| Nombre | Email (único) | Teléfono |
|--------|----------------|----------|
| TecnoMayorista | tecnomayorista@revital.co | 3001111001 |
| Importadora Orion | importadora.orion@revital.co | 3001111002 |
| Global Supply Co | global.supply@revital.co | 3001111003 |
| Distribuciones Andina | distribuciones.andina@revital.co | 3001111004 |
| Comercial Delta | comercial.delta@revital.co | 3001111005 |
| Nexus Logistics | nexus.logistics@revital.co | 3001111006 |
| TechSource | techsource@revital.co | 3001111007 |
| Abastecimientos Alpha | abastecimientos.alpha@revital.co | 3001111008 |
| Grupo Mercantil Nova | grupo.mercantil.nova@revital.co | 3001111009 |
| Red Comercial Sigma | red.comercial.sigma@revital.co | 3001111010 |
| Proveedor Central | proveedor.central@revital.co | 3001111011 |
| Urban Supply | urban.supply@revital.co | 3001111012 |
| MacroDistribuciones | macro.distribuciones@revital.co | 3001111013 |
| Proveedor Continental | proveedor.continental@revital.co | 3001111014 |
| Andromeda Trading | andromeda.trading@revital.co | 3001111015 |
| Prisma Solutions | prisma.solutions@revital.co | 3001111016 |
| Supply Chain One | supply.chain.one@revital.co | 3001111017 |
| Distribuidor Atlas | distribuidor.atlas@revital.co | 3001111018 |
| Logística Integral Plus | logistica.integral@revital.co | 3001111019 |
| Comercial Helix | comercial.helix@revital.co | 3001111020 |

---

## 6. Productos (196) – Resumen por categoría hoja

Al crear cada producto en Admin:

- **Categoría:** elegir la **nieta** (sublínea) indicada en la tabla (según el árbol del apartado 3).
- **Marca:** elegir la de la columna “Marca” (o dejar vacío si es “Sin marca”).
- **Proveedor:** elegir el de la columna “Proveedor”.
- **Precio** y **stock:** configurarlos en la variante (primera variante o flujo que use el Admin).

A continuación se listan los 196 productos agrupados por **categoría hoja** (nieta), con nombre, marca, proveedor, precio (COP) y stock. La descripción corta está en la sección 7.

### 6.1 Tecnología – Dispositivos Tecnológicos

| # | Nombre | Categoría (nieta) | Marca | Proveedor | Precio (COP) | Stock |
|---|--------|-------------------|-------|-----------|--------------|-------|
| 1 | Samsung Galaxy S24 Ultra 512GB | Smartphones | Samsung | TecnoMayorista | 4899000 | 45 |
| 2 | iPhone 15 Pro Max 256GB | Smartphones | Apple | Importadora Orion | 5499000 | 32 |
| 3 | Xiaomi 14 Pro 5G 256GB | Smartphones | Xiaomi | Global Supply Co | 3199000 | 67 |
| 4 | Samsung Galaxy A54 5G 128GB | Smartphones | Samsung | Distribuciones Andina | 1599000 | 120 |
| 5 | iPhone 14 128GB | Smartphones | Apple | TecnoMayorista | 3799000 | 55 |
| 6 | Xiaomi Redmi Note 13 Pro 256GB | Smartphones | Xiaomi | Comercial Delta | 1299000 | 95 |
| 7 | Huawei P60 Pro 256GB | Smartphones | Huawei | Nexus Logistics | 2899000 | 38 |
| 8 | Samsung Galaxy Z Flip5 256GB | Smartphones | Samsung | Importadora Orion | 4299000 | 28 |
| 9 | Xiaomi 13T 256GB | Smartphones | Xiaomi | Global Supply Co | 2199000 | 72 |
| 10 | iPhone 13 128GB | Smartphones | Apple | TecnoMayorista | 2999000 | 48 |
| 11 | Samsung Galaxy S23 FE 256GB | Smartphones | Samsung | Distribuciones Andina | 2599000 | 63 |
| 12 | Xiaomi Poco X6 Pro 256GB | Smartphones | Xiaomi | Comercial Delta | 1499000 | 88 |
| 13 | HP Pavilion 15 Intel Core i7 16GB RAM 512GB SSD | Laptops básicas | HP | TechSource | 2899000 | 42 |
| 14 | Lenovo IdeaPad Gaming 3 Ryzen 7 RTX 3050 | Laptops gaming | Lenovo | Abastecimientos Alpha | 3799000 | 35 |
| 15 | Dell XPS 13 Intel Core i5 16GB RAM 512GB SSD | Ultrabooks | Dell | Grupo Mercantil Nova | 4299000 | 28 |
| 16 | Asus ROG Strix G16 Intel Core i9 RTX 4060 | Laptops gaming | Asus | TecnoMayorista | 6499000 | 18 |
| 17 | Lenovo ThinkPad X1 Carbon Gen 11 | Estaciones móviles | Lenovo | Red Comercial Sigma | 5799000 | 22 |
| 18 | Acer Aspire 5 Intel Core i5 8GB RAM 256GB SSD | Laptops básicas | Acer | Distribuciones Andina | 1899000 | 75 |
| 19 | HP Envy x360 Ryzen 5 16GB RAM 512GB SSD | Laptops básicas | HP | TechSource | 3199000 | 38 |
| 20 | Asus TUF Gaming F15 Intel Core i7 RTX 4050 | Laptops gaming | Asus | Global Supply Co | 4799000 | 31 |
| 21 | Samsung Galaxy Tab S9 256GB | Tablets | Samsung | TecnoMayorista | 2899000 | 52 |
| 22 | Apple iPad Air 5ta Gen 256GB | Tablets | Apple | Importadora Orion | 3299000 | 36 |
| 23 | Lenovo Tab P11 Plus 128GB | Tablets | Lenovo | Comercial Delta | 1299000 | 68 |
| 24 | Samsung Galaxy Tab A9+ 128GB | Tablets | Samsung | Distribuciones Andina | 899000 | 95 |
| 25 | HP DeskJet Ink Advantage 2775 | Impresoras Multifuncionales | HP | Proveedor Central | 389000 | 142 |
| 26 | Epson EcoTank L3250 | Impresoras Multifuncionales | Epson | TechSource | 899000 | 86 |
| 27 | Canon PIXMA G3160 | Impresoras Multifuncionales | Canon | Nexus Logistics | 799000 | 105 |
| 28 | Sony WH-1000XM5 | Audífonos inalámbricos | Sony | Global Supply Co | 1499000 | 64 |
| 29 | Apple AirPods Pro 2da Gen | Audífonos inalámbricos | Apple | Importadora Orion | 1199000 | 78 |
| 30 | Samsung Galaxy Buds2 Pro | Audífonos inalámbricos | Samsung | TecnoMayorista | 799000 | 112 |
| 31 | Logitech MX Master 3S | Mouse | Logitech | TechSource | 449000 | 95 |
| 32 | Logitech G502 HERO | Mouse | Logitech | Abastecimientos Alpha | 259000 | 128 |
| 33 | Sony Alpha a7 IV Body | Cámaras digitales | Sony | Importadora Orion | 9499000 | 15 |
| 34 | Canon EOS R6 Mark II Body | Cámaras digitales | Canon | Global Supply Co | 10999000 | 12 |

### 6.2 Hogar

| # | Nombre | Categoría (nieta) | Marca | Proveedor | Precio (COP) | Stock |
|---|--------|-------------------|-------|-----------|--------------|-------|
| 35–38 | Neveras (Samsung, LG, Whirlpool, Samsung) | Neveras | Varias | Distribuciones Andina, Comercial Delta, Nexus | 1899000–4699000 | 18–42 |
| 39–42 | Lavadoras (LG, Samsung, Whirlpool, LG) | Lavadoras | Varias | Comercial Delta, Distribuciones Andina, Nexus | 1599000–3499000 | 24–45 |
| 43–46 | Sofás (Seccional, Cama, Reclinable, Chesterfield) | Sofás | Sin marca | Urban Supply, MacroDistribuciones, Proveedor Continental | 1799000–3499000 | 12–22 |
| 47–49 | Camas (Doble, King, Sencilla) | Camas | Sin marca | MacroDistribuciones, Urban Supply, Proveedor Continental | 899000–1899000 | 18–28 |
| 50–52 | Mesas (Comedor, Centro, Auxiliar) | Mesas | Sin marca | MacroDistribuciones, Urban Supply, Proveedor Continental | 429000–1899000 | 15–25 |
| 53–55 | Alfombras (Persa, Shaggy, Geométrica) | Alfombras | Sin marca | Urban Supply, MacroDistribuciones, Proveedor Continental | 189000–649000 | 22–35 |
| 56–58 | Estanterías (Modular, Escalera, Rincón) | Estanterías | Sin marca | MacroDistribuciones, Urban Supply, Proveedor Continental | 329000–599000 | 18–42 |
| 59–62 | Aspiradoras (Robot Samsung, LG CordZero, Black+Decker x2) | Aspiradoras | Samsung, LG, Black+Decker | Distribuciones Andina, Comercial Delta, Nexus, Abastecimientos Alpha | 299000–899000 | 45–85 |

### 6.3 Moda

| # | Nombre | Categoría (nieta) | Marca | Proveedor | Precio (COP) | Stock |
|---|--------|-------------------|-------|-----------|--------------|-------|
| 63–67 | Camisetas masculinas (Polo Nike, Adidas, Puma, Under Armour) | Camisetas | Nike, Adidas, Puma, Under Armour | Andromeda Trading, Prisma Solutions | 89900–159000 | 45–120 |
| 68–72 | Pantalones masculinos (Jean Nike, Adidas Tiro, Puma, Under Armour, Adidas Skate) | Pantalones | Nike, Adidas, Puma, Under Armour | Prisma Solutions, Andromeda Trading | 129000–189000 | 38–95 |
| 73–77 | Blusas femeninas (Nike, Adidas, Puma, Under Armour, Adidas) | Blusas | Nike, Adidas, Puma, Under Armour | Andromeda Trading, Prisma Solutions | 79900–139000 | 42–88 |
| 78–81 | Vestidos femeninos (Nike, Adidas, Puma, Under Armour) | Vestidos | Nike, Adidas, Puma, Under Armour | Prisma Solutions, Andromeda Trading | 119000–159000 | 35–72 |
| 82–84 | Jeans femeninos (Nike, Adidas, Puma) | Jeans | Nike, Adidas, Puma | Prisma Solutions, Andromeda Trading | 129000–169000 | 28–65 |
| 85–86 | Chaquetas masculinas (Nike Windrunner, Adidas Tiro) | Chaquetas | Nike, Adidas | Andromeda Trading, Prisma Solutions | 179000–229000 | 32–58 |

### 6.4 Deportes

| # | Nombre | Categoría (nieta) | Marca | Proveedor | Precio (COP) | Stock |
|---|--------|-------------------|-------|-----------|--------------|-------|
| 87–91 | Pesas y equipo (Mancuernas, Kettlebell, Barra, Discos, Rack) | Pesas | Sin marca | Supply Chain One, MacroDistribuciones | 189000–899000 | 15–45 |
| 92–95 | Bicicletas (Montaña, Ruta, Estática, Eléctrica) | Bicicletas | Sin marca | Andromeda Trading, Supply Chain One, MacroDistribuciones | 599000–1899000 | 12–38 |
| 96–98 | Balones (Fútbol Adidas, Baloncesto Nike, Voleibol Puma) | Balones | Adidas, Nike, Puma | Prisma Solutions, Andromeda Trading | 89000–159000 | 55–95 |
| 99–102 | Máquinas (Caminadora, Elíptica, Banco, Remo) | Máquinas de ejercicio | Sin marca | MacroDistribuciones, Supply Chain One | 499000–1299000 | 18–42 |
| 103–105 | Camisetas deportivas (Nike, Adidas, Under Armour) | Camisetas deportivas | Nike, Adidas, Under Armour | Andromeda Trading, Prisma Solutions | 79900–119000 | 65–110 |
| 106–108 | Licras (Nike Pro, Adidas Techfit, Under Armour Fly Fast) | Licras | Nike, Adidas, Under Armour | Prisma Solutions, Andromeda Trading | 99000–139000 | 42–85 |

### 6.5 Electrónica de consumo, Computadores, Telefonía, Electrodomésticos

(Productos 109–144: Televisores, Barras de sonido, Cámaras digitales, PCs gaming, All-in-One, Mini PC, Fundas, Cargadores, Baterías externas, Licuadoras, Freidoras de aire, Microondas. Ver sección 7 o el listado detallado por sublínea si se necesita cada fila.)

### 6.6 Oficina, Belleza, Audio/Video, Iluminación, Cocina, Calzado, Salud, Ferretería, Construcción, Papelería, Juguetes, Muebles

(Productos 145–196: Impresoras, Sillas, Escritorios, Cremas, Sérums, Jabones, Monitores, Proyectores, Lámparas, Reflectores, Ollas, Sartenes, Procesador alimentos, Tenis, Tacones, Tensiómetros, Masajeadores, Taladros, Martillos, Cementos, Pintura, Cuadernos, Resmas, LEGO, Cubo Rubik, Monopoly, Jenga, Escritorios flotante/gamer, Archivador.)

---

## 7. Descripciones cortas (por producto)

Para cada uno de los 196 productos, el catálogo original incluye una **descripción corta**. Al crear el producto en Admin, puede pegarse en el campo descripción. A continuación se listan por bloques; el orden sigue el del documento original (productos 1–196).

- **Productos 1–12 (Smartphones):** Descripciones con pantalla, procesador, cámara, batería, etc.
- **Productos 13–20 (Portátiles):** Especificaciones de portátiles, gaming, ultrabooks.
- **Productos 21–24 (Tablets):** Tablets Samsung, Apple, Lenovo.
- **Productos 25–27 (Impresoras):** Multifunción, tanque de tinta.
- **Productos 28–30 (Audífonos):** Sony, AirPods, Galaxy Buds.
- **Productos 31–34 (Mouse, Cámaras):** Logitech, Sony Alpha, Canon EOS R6.
- **Productos 35–62 (Hogar):** Neveras, lavadoras, sofás, camas, mesas, alfombras, estanterías, aspiradoras.
- **Productos 63–86 (Moda):** Camisetas, pantalones, blusas, vestidos, jeans, chaquetas.
- **Productos 87–108 (Deportes):** Pesas, bicis, balones, máquinas, camisetas deportivas, licras.
- **Productos 109–196:** Electrónica, computadores, telefonía, electrodomésticos, oficina, belleza, audio/video, iluminación, cocina, calzado, salud, ferretería, construcción, papelería, juguetes, muebles.

*(El listado extenso de las 196 descripciones literales se puede conservar en un anexo al final del mismo archivo o en un CSV/JSON aparte para importación masiva si en el futuro se implementa.)*

---

## 8. Resumen de pasos en Admin

1. **Categorías:** Crear primero todos los padres (ej. Tecnología, Hogar, Moda). Luego cada hijo con su `parent_id`. Por último cada nieta con su `parent_id`. Anotar los IDs de las **nietas** para usarlos al crear productos.
2. **Marcas:** Crear todas las de la tabla del apartado 4.
3. **Proveedores:** Crear todos con nombre, email único y teléfono (apartado 5).
4. **Productos:** Para cada producto, elegir categoría = nieta, marca y proveedor según tablas, y completar precio/stock en la variante.

Con esto el catálogo queda alineado con la estructura actual de la base de datos y listo para poblar desde la sección Admin.

---

## Nota sobre el catálogo en formato bloque

Si en otro archivo o anexo conservas los 196 productos en formato:

- **Categoría:** (ej. Tecnología)  
- **Línea:** (ej. Dispositivos Tecnológicos)  
- **Sublínea:** (ej. Smartphones)  
- **Marca:** / **Proveedor:** / **Precio:** / **Stock:** / **Descripción corta:**

entonces, al crear cada producto en Admin, la **categoría** que debes elegir es siempre la **Sublínea** (la categoría hoja). La Línea y la Categoría solo sirven para crear antes el árbol de categorías (padre → hijo → nieta); el producto se asocia solo a la nieta (Sublínea).

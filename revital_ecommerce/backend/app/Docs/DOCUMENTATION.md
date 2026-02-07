# Documentación del Backend - Revital

Bienvenido a la documentación técnica detallada del backend de la plataforma Revital.
Esta guía está diseñada para que cualquier miembro del equipo, independientemente de su nivel de experiencia, pueda entender la arquitectura, el flujo de datos y el propósito de cada componente de nuestra aplicación.

## Estructura General del Proyecto

El backend está construido con **FastAPI**, un framework de Python moderno y de alto rendimiento. La estructura de carpetas principal es la siguiente:

```
backend/
├── app/
│   ├── core/         # Configuración central, DB, dependencias.
│   ├── middlewares/  # Lógica que se ejecuta en cada petición/respuesta.
│   ├── schemas/      # Modelos de datos (Pydantic) para validación.
│   ├── services/     # Lógica de negocio (el cerebro de la app).
│   ├── routers/      # Endpoints de la API (las rutas URL).
│   ├── templates/    # Plantillas de correo electrónico.
│   └── main.py       # Punto de entrada de la aplicación.
├── requirements.txt  # Lista de dependencias de Python.
└── DOCUMENTATION.md  # Este archivo.
```

A continuación, se detalla el contenido y la función de cada parte del proyecto.

## Arquitectura de Alto Nivel y Flujo de Datos

Antes de sumergirnos en cada carpeta, es importante entender la arquitectura general del backend y cómo fluyen los datos en una petición típica. Esto nos dará un mapa mental para navegar el resto del código.

### El Punto de Entrada: `main.py`
Todo comienza en el archivo `main.py`. Este es el corazón de la aplicación, donde todas las piezas se unen:
1.  **Se crea la instancia de FastAPI:** `app = FastAPI(...)`.
2.  **Se añaden los Middlewares:** Se registran los middlewares globales, como `CORSMiddleware` (para permitir que el frontend se comunique con el backend) y nuestro `AuthMiddleware` (la primera capa de seguridad).
3.  **Se incluyen los Routers:** Cada archivo de la carpeta `routers` (ej: `product_router`, `user_router`) se importa y se incluye en la aplicación principal con `app.include_router(...)`. Aquí es donde la API cobra vida, registrando todos los endpoints.

### Arquitectura en Capas (El Flujo de una Petición)
Seguimos un patrón de **arquitectura en capas**, que es un estándar en el desarrollo de software por su organización y claridad. Una petición del usuario atraviesa estas capas en orden:

`Cliente (Navegador)  ->  Router  ->  Servicio  ->  Base de Datos`

1.  **Capa de Routers (`app/routers`):**
    -   **Responsabilidad:** Gestionar las peticiones y respuestas HTTP. Es la "cara" pública de la API.
    -   **Tareas:** Define las rutas (`/products/{id}`), los métodos (`GET`, `POST`), valida los datos de entrada usando los **Esquemas Pydantic** (`app/schemas`) y gestiona la seguridad a nivel de endpoint usando **Dependencias** (`app/core/dependencies.py`).
    -   **NO contiene lógica de negocio.** Un router es un "controlador de tráfico": recibe una petición, la valida y la pasa a la capa de servicio adecuada.

2.  **Capa de Servicios (`app/services`):**
    -   **Responsabilidad:** Contener toda la **lógica de negocio**. Es el "cerebro" de la aplicación.
    -   **Tareas:** Orquesta las operaciones. Por ejemplo, un `order_service` no solo crea una orden, sino que también verifica el stock, aplica descuentos, llama al `email_service` para enviar una confirmación, etc. Es aquí donde se toman las decisiones.

3.  **Capa de Acceso a Datos (SQLAlchemy y Funciones de la Base de Datos):**
    -   **Responsabilidad:** Interactuar con la base de datos PostgreSQL.
    -   **Tareas:** Los servicios utilizan **SQLAlchemy** (nuestro ORM) para ejecutar consultas. Un patrón muy importante en nuestro proyecto es que la lógica transaccional más compleja (como crear una orden o un descuento) no se escribe en Python, sino que se delega a **Funciones Almacenadas en PostgreSQL** (ej: `fun_crear_orden_desde_carrito`). El servicio simplemente llama a esta función, lo que garantiza que operaciones de múltiples pasos sean **atómicas** (o todo tiene éxito, o todo se revierte) y eficientes.

### El Modelo SaaS: Instancia Aislada
Es crucial recordar que esta arquitectura está diseñada para un modelo SaaS de **deployment aislado**.
-   **Sin `tenant_id`:** No verás lógica de "tenants" o inquilinos en el código. No hay `WHERE tenant_id = '...'`.
-   **Configuración por Instancia:** Toda la personalización de un cliente (nombre de la tienda, claves de API de Wompi, etc.) se gestiona a través de variables de entorno cargadas por `config.py` desde un archivo `.env`.
-   **Base de Datos Dedicada:** Cada cliente tiene su propia base de datos, definida en la variable `DATABASE_URL` de su `.env`.
-   **Consecuencia:** Esto simplifica enormemente el desarrollo. Podemos escribir el código como si fuera para una única aplicación, y la separación entre clientes se logra a nivel de infraestructura, no de código.

Con este mapa en mente, ahora podemos explorar cada carpeta sabiendo qué rol juega en el gran esquema de la aplicación.

## 1. Carpeta `app/core`

Esta carpeta es el corazón de la configuración de nuestra aplicación FastAPI. Define los parámetros esenciales que permiten que el resto de la aplicación funcione correctamente.

---

### 1.1. Archivo `config.py`

**Propósito:** Este archivo es el responsable de gestionar todas las variables de configuración de la aplicación. Piensa en él como el panel de control centralizado de la instancia de Revital para un cliente específico.

**Funcionamiento:**
Utiliza la librería `pydantic-settings` para crear una clase llamada `Settings`. Esta clase hereda de `BaseSettings`, lo que le permite leer automáticamente variables desde el entorno del sistema o desde un archivo `.env`. Esto es genial porque nos permite tener configuraciones diferentes para desarrollo, pruebas y producción sin cambiar el código.

**Clase `Settings`:**
Esta clase define todos los parámetros que la aplicación necesita para arrancar y operar. Cada atributo de la clase es una variable de configuración que Pydantic validará (se asegura de que tenga el tipo de dato correcto, como texto o número).

- **Atributos Principales:**
    - `DATABASE_URL`: La dirección completa para conectarse a la base de datos PostgreSQL de esta instancia.
    - `COMPANY_NAME`, `APP_NAME`, etc.: Datos de personalización para el cliente (nombre de su empresa, slogan, email de soporte). Esto es clave para el modelo SaaS de instancia aislada.
    - `SECRET_KEY`: Una clave secreta muy importante. Se usa para "firmar" los tokens de autenticación (JWT), garantizando que no hayan sido manipulados.
    - `ACCESS_TOKEN_EXPIRE_MINUTES`: Define cuánto tiempo es válido un token de acceso. Por ejemplo, 30 minutos. Después de ese tiempo, el usuario tendrá que volver a autenticarse o refrescar su token.
    - `ALGORITHM`: El algoritmo de encriptación que se usará para la firma de los tokens (ej: `HS256`).
    - `RESEND_API_KEY`: La clave para usar el servicio de envío de correos "Resend". Cada instancia puede tener su propia configuración de Resend.
    - `FRONTEND_URL`, `VERIFY_EMAIL_URL`, etc.: Las URLs de la aplicación frontend. Se usan para construir los enlaces que se envían en los correos (ej: "Haz clic aquí para verificar tu cuenta").
    - `WOMPI_...`: Claves y secretos para la integración con la pasarela de pagos Wompi.

- **Clase `Config` anidada:**
    - `env_file = ".env"`: Le dice a Pydantic que busque un archivo llamado `.env` en la raíz del proyecto para cargar estas variables.
    - `case_sensitive = True`: Indica que los nombres de las variables de entorno deben coincidir exactamente (mayúsculas y minúsculas).

**Instancia `settings`:**
Al final del archivo, se crea una única instancia `settings = Settings()`. Esta instancia es la que importaremos en otros archivos de la aplicación cada vez que necesitemos acceder a alguna variable de configuración. Por ejemplo, `from app.core.config import settings`.

---

### 1.2. Archivo `database.py`

**Propósito:** Este archivo configura y gestiona todo lo relacionado con la conexión a la base de datos PostgreSQL. Utiliza **SQLAlchemy**, que es una librería ORM (Object-Relational Mapper). Un ORM nos permite interactuar con la base de datos usando objetos de Python en lugar de escribir SQL puro, lo cual es más seguro y productivo.

**Funcionamiento:**

1.  **`engine = create_engine(settings.DATABASE_URL)`**:
    - Aquí se crea el "motor" de la base de datos.
    - `create_engine` es una función de SQLAlchemy que establece el punto de conexión principal con la base de datos.
    - Toma como argumento la `DATABASE_URL` que definimos en `config.py`. Esta URL contiene el usuario, la contraseña, la dirección del servidor y el nombre de la base de datos a la que nos vamos a conectar.
    - El `engine` gestiona un "pool" de conexiones, que son como líneas telefónicas pre-abiertas a la base de datos, listas para ser usadas. Esto es mucho más eficiente que abrir y cerrar una conexión por cada consulta.

2.  **`SessionLocal = sessionmaker(...)`**:
    - `sessionmaker` es una "fábrica" que crea objetos de sesión.
    - Una **sesión** en SQLAlchemy es la interfaz principal para hablar con la base de datos. Es como una conversación temporal. Todas las operaciones (crear, leer, actualizar, borrar) se agrupan dentro de una sesión.
    - `autocommit=False` y `autoflush=False`: Son configuraciones importantes. Le dicen a SQLAlchemy que no queremos que guarde automáticamente cada pequeño cambio (`commit`) ni que los envíe a la base de datos constantemente (`flush`). Nosotros controlaremos manualmente cuándo se guardan los cambios (generalmente al final de una operación completa), lo que nos da más control y previene errores.
    - `bind=engine`: Vincula esta fábrica de sesiones al motor que creamos antes. Así, cada sesión que se cree sabrá a qué base de datos conectarse.

3.  **`Base = declarative_base()`**:
    - Este objeto `Base` es una clase base de la que heredarán todos nuestros modelos de datos (las tablas de la base de datos definidas como clases de Python). Cuando una clase hereda de `Base`, SQLAlchemy sabe que debe mapearla a una tabla en la base de datos.

4.  **Función `get_db()`**:
    - **¡Esta es una de las funciones más importantes y usadas en todo el backend!**
    - Es una función "generadora" de Python (usa la palabra clave `yield`). En el contexto de FastAPI, se usa como una **dependencia**.
    - **Flujo de una petición:**
        1. Cuando llega una petición a un endpoint que necesita la base de datos (casi todos), FastAPI llama a `get_db()`.
        2. `db = SessionLocal()`: Se crea una nueva sesión de base de datos fresca para esta petición específica.
        3. `yield db`: La función "pausa" su ejecución y entrega (`yield`) el objeto `db` al endpoint. El endpoint ahora puede usar `db` para hacer consultas, crear usuarios, etc.
        4. El endpoint termina su trabajo y envía una respuesta al cliente.
        5. `finally: db.close()`: Después de que la petición ha sido atendida, la función `get_db()` se reanuda en el bloque `finally` y cierra la sesión. Esto es **crucial** para liberar la conexión y devolverla al "pool" del motor, dejándola disponible para la siguiente petición.
    - Este patrón asegura que cada petición tenga su propia sesión aislada y que siempre se limpie correctamente, evitando fugas de conexiones que podrían agotar los recursos del servidor. Lo verás usado en casi todos los `routers`.

---

### 1.3. Archivo `dependencies.py`

**Propósito:** Este archivo es uno de los más inteligentes de FastAPI. Define "dependencias", que son piezas de código reutilizables que se pueden "inyectar" en nuestros endpoints. Su principal uso en Revital es para la **seguridad**: verificar si un usuario ha iniciado sesión, qué rol tiene y si puede o no realizar una acción.

**Concepto de Inyección de Dependencias:**
Imagina que muchos de tus endpoints necesitan hacer lo mismo al principio:
1.  Verificar que la petición incluye un token de autenticación.
2.  Decodificar el token para ver qué usuario es.
3.  Comprobar que el usuario existe en la base de datos.
En lugar de repetir este código en cada endpoint, lo escribimos una sola vez en una función de dependencia y luego simplemente le decimos a FastAPI: "Oye, antes de ejecutar este endpoint, ejecuta esta dependencia". FastAPI se encarga de todo el trabajo.

**Funcionamiento:**

- **`security = HTTPBearer()`**:
    - Crea un objeto que sabe cómo buscar un `token` en la cabecera de la petición HTTP, específicamente en la cabecera `Authorization` con el formato `Bearer <token>`.

- **Función `get_current_user(...)`**:
    - **Dependencia para obtener el usuario que hace la petición.**
    - `credentials: HTTPAuthorizationCredentials = Depends(security)`: Le dice a FastAPI que use el objeto `security` para extraer el token. Si no hay token, FastAPI automáticamente devolverá un error 401 (No Autorizado) sin siquiera entrar a nuestra función.
    - `db: Session = Depends(get_db)`: ¡Aquí vemos la magia! Esta dependencia a su vez depende de `get_db`. FastAPI primero ejecutará `get_db` para obtener una sesión de base de datos y luego la pasará a `get_current_user`.
    - Llama a `auth_service.get_current_user(...)`, pasándole el token. Este servicio (que veremos más adelante) es el que realmente decodifica el token y busca al usuario.
    - Si todo es correcto, devuelve la información del usuario. Si el token es inválido o el usuario no existe, lanza una excepción `HTTPException`, que FastAPI convierte en un error HTTP claro para el cliente.

- **Función `get_current_user_optional(...)`**:
    - Una versión "light" de la anterior. Se usa en endpoints donde el inicio de sesión es opcional (por ejemplo, para ver un producto, no necesitas estar logueado, pero si lo estás, quizás te mostramos algo personalizado).
    - `auto_error=False`: Le dice a FastAPI que no lance un error si no encuentra un token.
    - Si no hay credenciales o el token es inválido, simplemente devuelve `None` en lugar de un error.

- **Función `require_role(required_role: int)`**:
    - Esto es una **fábrica de dependencias**. Es una función que devuelve *otra función* (la dependencia real).
    - La usamos para crear dependencias que exigen un rol específico. Por ejemplo, `require_role(2)` crearía una dependencia que solo deja pasar a usuarios con el `id_rol` 2.
    - `role_checker`: Esta es la función de dependencia interna. Primero, depende de `get_current_user` para obtener el usuario. Luego, compara el rol del usuario con el `required_role`. Si no coincide, lanza un error 403 (Prohibido).

- **Función `require_admin()`**:
    - Un atajo muy útil. Es simplemente una llamada a `require_role(1)`, asumiendo que el ID del rol de Administrador es siempre `1`. Hace el código en los routers más limpio y legible: en lugar de `Depends(require_role(1))`, escribimos `Depends(require_admin())`.

- **Función `require_user_or_admin(user_id: int)`**:
    - Otra fábrica de dependencias para un caso de uso muy común: "solo el dueño de este recurso o un administrador pueden modificarlo".
    - Por ejemplo, para editar los datos de un usuario, solo ese mismo usuario o un admin pueden hacerlo.
    - `access_checker`: La dependencia interna que comprueba si el `id_usuario` del token coincide con el `user_id` del recurso que se quiere modificar, O si el usuario tiene el rol de administrador. Si no cumple ninguna de las dos condiciones, lanza un error 403.

---

### 1.4. Archivo `jwt_utils.py`

**Propósito:** Este archivo es nuestra caja de herramientas criptográficas. Se encarga de dos tareas de seguridad fundamentales: la gestión de JSON Web Tokens (JWT) para la autenticación y el manejo seguro de las contraseñas de los usuarios.

**Manejo de Contraseñas:**

- **`pwd_hasher = PasswordHash.recommended()`**:
    - Aquí configuramos el sistema de "hashing" de contraseñas. Un **hash** es un proceso unidireccional que convierte una contraseña en una cadena de texto sin sentido aparente. Es "unidireccional" porque es prácticamente imposible revertir el hash para obtener la contraseña original.
    - Usamos la librería `pwdlib` con el algoritmo **Argon2**. Argon2 es el estándar de oro actual para hashear contraseñas, ya que es resistente a ataques de fuerza bruta y de diccionario. Es más seguro que algoritmos más antiguos como MD5, SHA-1 o incluso bcrypt.
    - Cuando un usuario se registra, no guardamos su contraseña "12345", sino el hash generado por Argon2.

- **`get_password_hash(password: str)`**:
    - Una función simple que toma una contraseña en texto plano y devuelve su hash seguro.

- **`verify_password(plain_password: str, hashed_password: str)`**:
    - Cuando un usuario intenta iniciar sesión, usamos esta función.
    - Toma la contraseña que el usuario acaba de escribir (`plain_password`) y el hash que tenemos guardado en la base de datos (`hashed_password`).
    - `pwdlib` vuelve a aplicar el hash a la contraseña ingresada y compara el resultado con el hash guardado. Solo si coinciden exactamente, la función devuelve `True`. Nunca se compara texto plano con texto plano.

**Gestión de JSON Web Tokens (JWT):**
Los JWT son el estándar que usamos para manejar las sesiones. Cuando un usuario inicia sesión correctamente, le damos un "pase" (el token) que deberá presentar en cada petición posterior para demostrar quién es.

- **`create_access_token(data: dict, ...)`**:
    - Crea el token de acceso principal. Este es el token de corta duración que el frontend usará para la mayoría de las peticiones.
    - `data`: Es un diccionario con la información que queremos guardar dentro del token (el "payload"). Típicamente, el ID del usuario, su rol y su email. **¡Nunca guardes información sensible como contraseñas aquí!**
    - `expires_delta`: Calcula la fecha y hora de expiración del token, basándose en el valor `ACCESS_TOKEN_EXPIRE_MINUTES` de nuestra configuración.
    - `jwt.encode(...)`: Usa la librería `jose` para codificar el `payload` y la fecha de expiración, firmándolo con nuestra `SECRET_KEY` y el `ALGORITHM` definido en la configuración. Esta firma digital es lo que garantiza que el token no pueda ser modificado por un atacante.

- **`create_refresh_token(data: dict)`**:
    - Crea un token de refresco. Este token tiene una duración mucho más larga (días o semanas).
    - Su único propósito es ser intercambiado por un nuevo token de acceso cuando el principal expire. Esto permite que el usuario no tenga que volver a escribir su contraseña cada 30 minutos. El frontend guarda este token de forma segura y lo usa para "refrescar" la sesión de forma transparente.

- **`verify_token(token: str, ...)`**:
    - La contraparte de las funciones de creación. Toma un token enviado por el cliente y lo valida.
    - `jwt.decode(...)`: Intenta decodificar el token usando nuestra `SECRET_KEY`. Si la firma no coincide (el token fue manipulado) o si el token ha expirado, la librería `jose` lanza un `JWTError`.
    - Capturamos ese error y lo convertimos en un `HTTPException` 401 (No Autorizado), indicando al frontend que el token ya no es válido.
    - También verifica el campo `"type"` dentro del payload para asegurarse de que estamos usando el tipo de token correcto (un token de acceso no se puede usar para refrescar, y viceversa).

- **Otras funciones de tokens (`create_verification_token`, `create_password_reset_token`, etc.)**:
    - Son variaciones de las funciones de creación de tokens, pero para casos de uso específicos como la verificación de correo electrónico o el reseteo de contraseña.
    - Crean JWTs que contienen información específica para esa tarea y tienen un tipo (`"email_verification"`, `"password_reset"`) y una duración diferente. Sus funciones de verificación correspondientes (`verify_verification_token`, etc.) se aseguran de que un token de reseteo de contraseña no se pueda usar para verificar un email, por ejemplo.

## 2. Carpeta `app/schemas`

**Propósito:** Esta carpeta contiene los "esquemas" de datos de la aplicación. Los esquemas son la definición de la **forma** que deben tener los datos que entran y salen de nuestra API. Para esto, usamos la librería **Pydantic**.

**¿Qué es un esquema Pydantic?**
Es una clase de Python que hereda de `BaseModel` de Pydantic. Dentro de la clase, definimos los campos que esperamos recibir o enviar, y el tipo de dato de cada campo (ej: `str`, `int`, `bool`, `EmailStr`).

**Ventajas de usar esquemas:**

1.  **Validación Automática:** Cuando un cliente (el frontend) envía datos a un endpoint (por ejemplo, para crear un usuario), FastAPI usa el esquema que le indiquemos para validar automáticamente la información. Si el cliente envía un email con formato incorrecto, o un número donde se esperaba texto, FastAPI devolverá un error claro y detallado sin que nosotros tengamos que escribir una sola línea de código de validación manual.
2.  **Documentación Automática:** FastAPI usa estos esquemas para generar la documentación interactiva de la API (la que vemos en `/docs`). Sabe exactamente qué datos espera cada endpoint y qué datos devuelve.
3.  **Serialización:** Cuando obtenemos datos de la base de datos (a través de SQLAlchemy), a menudo vienen en un formato específico de SQLAlchemy. Los esquemas Pydantic nos permiten convertir ("serializar") esos datos a un formato JSON limpio y estandarizado que el frontend pueda entender, filtrando campos que no queremos exponer (como contraseñas hasheadas).

**Patrones Comunes en los Archivos de Esquemas:**

Verás que para cada "recurso" (como `User`, `Product`, `Order`), a menudo tenemos varias clases de esquema:

-   `...Base`: Contiene los campos comunes que comparten todos los otros esquemas de ese recurso.
-   `...Create`: Define los campos necesarios para **crear** un nuevo recurso. Usualmente hereda de `Base` y añade campos específicos de la creación (como la contraseña para un usuario).
-   `...Update`: Define los campos que se pueden **actualizar**. A menudo, todos sus campos son opcionales, ya que el usuario puede querer actualizar solo el nombre, o solo el precio, etc.
-   `...InDB` o `...`: El esquema principal que representa el recurso tal como está en la base de datos. Hereda de `Base` y añade campos que se generan automáticamente (como `id` o `created_at`).
-   `...Response` (a veces): Un esquema específico para las respuestas, que puede que omita ciertos campos sensibles.

Ahora, listaré los archivos de esta carpeta para analizar algunos ejemplos concretos.

---

### 2.1. Ejemplo: `auth_schema.py`

Este archivo es un ejemplo perfecto de esquemas utilizados para manejar datos que **entran** a la API para acciones específicas. No se mapean directamente a una tabla de la base de datos, sino que definen la estructura de las peticiones de autenticación.

-   **`LoginRequest`**: Define los dos campos que un usuario debe enviar para iniciar sesión: `email` (con formato de email validado por `EmailStr`) y `password`.
-   **`TokenResponse`**: Define la estructura de la respuesta que enviamos cuando el login es exitoso. Contiene el `access_token` (para usar en las peticiones) y el `refresh_token` (para obtener un nuevo `access_token` cuando el primero expire).
-   **`UserInToken`**: Define la información que guardamos dentro del JWT (el "payload"). Es un subconjunto de los datos del usuario: su ID, email, nombre y rol. Esto es lo que la dependencia `get_current_user` nos devolverá.
-   **`ChangePasswordRequest`**, **`ResetPasswordRequest`**, etc.: Definen los campos necesarios para las otras operaciones de autenticación, como cambiar la contraseña o confirmar el reseteo con un token.

---

### 2.2. Patrón General: `user_schema.py` y otros

La mayoría de los otros archivos en la carpeta `schemas` (como `user_schema.py`, `product_schema.py`, etc.) siguen un patrón más estructurado para manejar las operaciones CRUD (Crear, Leer, Actualizar, Borrar) de un recurso de la base de datos.

Tomemos `user_schema.py` como ejemplo:

-   **`UserBase`**: Contiene los campos comunes de un usuario (nombre, email, etc.).
-   **`UserCreate`**: Hereda de `UserBase` y añade el campo `password`, que solo es necesario al momento de crear un usuario.
-   **`UserUpdate`**: Hereda de `UserBase` pero todos sus campos son opcionales (`Optional[...]`). Esto permite que el frontend envíe solo los campos que desea actualizar.
-   **`User` (o `UserInDB`)**: Representa al usuario completo, como se devuelve desde la API. Hereda de `UserBase` y añade campos como `id_usuario` y `fecha_creacion`, que son generados por la base de datos. Crucialmente, **no** incluye la contraseña.

Este patrón se repite para productos, pedidos, categorías, etc., proporcionando una estructura robusta y predecible para la manipulación de datos en toda la API.

## 3. Carpeta `app/middlewares`

**Propósito:** Esta es una de las carpetas más poderosas de FastAPI. Un "middleware" es una pieza de software que se sitúa "en medio" del cliente que hace una petición y el endpoint que la procesa. Actúa como un guardián o un inspector que puede **ver, modificar y procesar CADA petición** que llega a la API y **CADA respuesta** antes de que sea enviada de vuelta.

**Analogía:** Imagina que los middlewares son los controles de seguridad de un aeropuerto. No importa a qué puerta de embarque (endpoint) te dirijas, primero tienes que pasar por el control de seguridad. Este control puede hacer varias cosas:
-   Revisar tu pasaporte y billete (petición).
-   Añadir una etiqueta a tu maleta (modificar la petición, añadiendo información).
-   Medir el tiempo que tardas en pasar (registrar métricas).
-   Impedirte el paso si estás en una lista de no-vuelo (bloquear la petición).

**Funcionamiento en FastAPI:**
En FastAPI, un middleware es una función (o clase) `async` que recibe la `request` y una función `call_next`.
-   El middleware hace su trabajo (revisar cabeceras, registrar algo, etc.).
-   Luego, llama a `response = await call_next(request)` para pasar la petición al siguiente middleware en la cadena o, finalmente, al endpoint.
-   Una vez que el endpoint ha generado una respuesta, el control vuelve al middleware, que puede entonces inspeccionar o modificar esa `response` antes de que se envíe al cliente.

Son ideales para tareas transversales que se aplican a toda la aplicación, como:
-   Gestión de CORS (Cross-Origin Resource Sharing).
-   Manejo centralizado de errores.
-   Registro de peticiones (logging).
-   Añadir cabeceras a todas las respuestas.
-   Autenticación de alto nivel (aunque en nuestro caso, la lógica más fina está en las dependencias).

---

### 3.1. Archivo: `auth_middleware.py`

Este archivo contiene la lógica para proteger rutas a un nivel más general que las dependencias. Mientras que una dependencia se aplica a un endpoint específico, un middleware se puede aplicar a un grupo de rutas que compartan un prefijo (ej: todas las rutas que empiecen con `/admin`).

Contiene dos middlewares:

#### `AuthMiddleware(BaseHTTPMiddleware)`

**Propósito:** Este middleware está diseñado para proteger grupos de rutas, verificando si el usuario está autenticado y, opcionalmente, si es un administrador.

**Configuración:**
Se inicializa con listas de prefijos de rutas:
-   `protected_paths`: Rutas que requieren que el usuario simplemente haya iniciado sesión (no importa su rol).
-   `admin_only_paths`: Rutas que requieren que el usuario sea un administrador (`id_rol = 1`), pero interesantemente, en la implementación actual, solo para métodos de escritura (`POST`, `PUT`, `DELETE`).

**Funcionamiento (`dispatch`):**
Este es el método principal que se ejecuta en cada petición.

1.  **Revisa el path y el método:** Obtiene la URL (`/api/users/1`) y el método HTTP (`GET`, `POST`, etc.) de la petición.
2.  **Permite CORS:** Ignora las peticiones `OPTIONS`, que son peticiones "pre-vuelo" que envían los navegadores para verificar los permisos CORS. Estas no deben ser bloqueadas.
3.  **Decide si se necesita protección:**
    -   Comprueba si la URL de la petición empieza con alguno de los prefijos en `protected_paths` o `admin_only_paths`.
    -   Tiene una **lógica especial**: por ejemplo, permite que cualquiera haga un `POST` a `/api/users` (para registrarse) pero protege las otras operaciones sobre usuarios (`GET`, `PUT`, `DELETE`) para que solo los admins puedan realizarlas.
4.  **Si se necesita protección:**
    -   **Extrae el token:** Busca la cabecera `Authorization` y extrae el token JWT (ej: `Bearer eyJ...`). Si no existe, o no tiene el formato correcto, devuelve un error 401 (No Autorizado) inmediatamente.
    -   **Obtiene una sesión de DB:** Llama a `get_db()` para poder interactuar con la base de datos. Es **muy importante** que la sesión se cierre en un bloque `finally` para evitar fugas de conexión.
    -   **Verifica el token:** Llama a `auth_service.get_current_user()` (el mismo servicio que usan las dependencias) para validar el token y obtener los datos del usuario.
    -   **Verifica el rol (si es necesario):** Si la ruta está en `admin_only_paths`, comprueba que `current_user.id_rol` sea `1`. Si no lo es, devuelve un error 403 (Prohibido).
    -   **Inyecta el usuario en la petición:** Si todo es correcto, guarda los datos del usuario en `request.state.current_user`. Esto es útil porque ahora los endpoints que se ejecuten después de este middleware pueden acceder al usuario autenticado a través del objeto `request` sin tener que volver a verificar el token.
5.  **Si no se necesita protección:** Simplemente llama a `call_next(request)` para que la petición continúe su curso normal.

#### `ProductMiddleware`

**Propósito:** Un middleware más específico, enfocado únicamente en proteger las operaciones de escritura sobre los productos.

**Funcionamiento:**
1.  Comprueba si la ruta empieza con `/api/products` y si el método es `POST`, `PUT` o `DELETE`.
2.  Si es así, realiza un proceso de verificación de token y rol de administrador muy similar al de `AuthMiddleware`. Solo los administradores pueden crear, actualizar o eliminar productos.
3.  Los `GET` a `/api/products` no son interceptados por este middleware, por lo que son públicos.

**Middleware vs. Dependencias:**
Te preguntarás por qué tenemos middlewares y dependencias que parecen hacer lo mismo.
-   **Middlewares** son buenos para aplicar reglas **generales** a grupos de rutas (ej: "todo bajo `/admin` requiere ser admin"). Son un "todo o nada" para grandes secciones de la API.
-   **Dependencias** son más flexibles y se usan **dentro** de un endpoint. Permiten una lógica de permisos más granular y compleja (ej: `require_user_or_admin` que necesita saber el `user_id` del recurso, algo que un middleware general no sabría).

En nuestra app, los middlewares actúan como la primera línea de defensa para secciones enteras, y las dependencias afinan los permisos a nivel de cada endpoint individual.

---

### 3.2. Archivo: `role_middleware.py`

Este archivo presenta un enfoque de control de acceso aún más centralizado y estructurado, utilizando una configuración de permisos explícito.

#### `RoleBasedAccessMiddleware`

**Propósito:** Este middleware controla el acceso a las rutas basándose en un "mapa de permisos" muy claro que define qué roles pueden usar qué métodos HTTP en qué rutas.

**Funcionamiento:**
1.  **Mapa de Permisos (`role_permissions`):**
    -   El middleware se inicializa con un diccionario que es, en esencia, la constitución de los permisos de la API.
    -   La estructura es: `{"prefijo_de_ruta": {"METODO_HTTP": [lista_de_ids_de_rol]}}`.
    -   **Ejemplo:**
        ```python
        "/api/products": {
            "POST": [1],      # Solo el rol 1 (Admin) puede crear productos.
            "GET": [1, 2, 3]  # Los roles 1 (Admin), 2 (Empleado) y 3 (Cliente) pueden ver productos.
        }
        ```
    -   Este enfoque es extremadamente explícito y fácil de leer. Para saber quién puede hacer qué, solo necesitas mirar este diccionario.

2.  **Procesamiento (`__call__`):**
    -   Para cada petición, busca si la ruta coincide con alguno de los patrones del mapa de permisos.
    -   Si encuentra una coincidencia y el método HTTP está definido para esa ruta, obtiene la lista de roles requeridos (`required_roles`).
    -   Si la ruta no está en el mapa, la deja pasar (asume que es pública o está protegida por otro mecanismo).
    -   Si la ruta está protegida, extrae y verifica el token JWT (similar a `AuthMiddleware`).
    -   Una vez que tiene el usuario, comprueba si `current_user.id_rol` está en la lista `required_roles`.
    -   Si el rol no está permitido, devuelve un error 403 (Prohibido) muy descriptivo, indicando qué roles son necesarios.
    -   Si el rol es correcto, inyecta al usuario en `request.state.current_user` y permite que la petición continúe.

#### `SmartAuthMiddleware`

**Propósito:** Un intento de crear un middleware que "adivine" la protección necesaria para una ruta sin un mapa de permisos explícito, basándose en convenciones sobre su nombre y método.

**Funcionamiento:**
1.  **Define listas de rutas:** El middleware tiene varias listas predefinidas:
    -   `public_paths`: Rutas siempre públicas (ej: `/docs`, `/login`).
    -   `public_read_paths`: Rutas que son públicas solo para peticiones `GET` (ej: el catálogo de productos).
    -   `authenticated_paths`: Rutas que requieren cualquier usuario autenticado.
    -   `admin_only_paths`: Rutas que solo un administrador puede acceder.
2.  **Lógica de `dispatch`:** Para cada petición, sigue una serie de `if/elif/else` para determinar a qué categoría pertenece la ruta y su método.
    -   Si es una ruta de lectura pública y el método es `GET`, la deja pasar.
    -   Si es una ruta de escritura en el catálogo (`POST`, `PUT` en `/api/products`), exige rol de administrador.
    -   Si es una ruta en `authenticated_paths`, verifica que el usuario esté logueado.
    -   Etc.
3.  Llama a funciones auxiliares como `_verify_authenticated_user` y `_verify_admin` que contienen la lógica de verificación del token y el rol.

**Comparación:**
-   El `RoleBasedAccessMiddleware` es más **explícito, seguro y fácil de mantener**. Los permisos están todos en un solo lugar. Es menos propenso a errores.
-   El `SmartAuthMiddleware` es más **implícito y basado en convenciones**. Puede ser más rápido de desarrollar al principio (no hay que actualizar el mapa de permisos), but es más frágil. Si un nuevo desarrollador crea una ruta `/api/special-users` y olvida añadirla a la lista correcta, podría quedar desprotegida por accidente.

Para un proyecto serio y escalable, el enfoque de `RoleBasedAccessMiddleware` suele ser el preferido por su claridad y seguridad.

## 4. Carpeta `app/routers`

**Propósito:** Esta carpeta contiene los "routers" o enrutadores de la aplicación. Un router es un objeto de FastAPI (`APIRouter`) que agrupa un conjunto de endpoints (rutas) relacionados con un recurso específico. Piensa en ellos como los capítulos de un libro: en lugar de tener un archivo gigante con todas las rutas de la API, las organizamos en archivos más pequeños y manejables. Por ejemplo, `product_router.py` contiene todas las rutas relacionadas con productos (`/products`, `/products/{id}`, etc.), y `user_router.py` contiene las de usuarios.

**Funcionamiento de un Router:**

1.  **Creación del Router:** En cada archivo, se crea una instancia de `APIRouter`, usualmente especificando un `prefix` y `tags`.
    -   `prefix="/products"`: Le dice a FastAPI que todas las rutas definidas en este router comenzarán con `/products`. Así, en lugar de escribir `@router.get("/products/{id}")`, podemos escribir `@router.get("/{id}")`, lo cual es más limpio.
    -   `tags=["Products"]`: Agrupa todos los endpoints de este router bajo la etiqueta "Products" en la documentación automática (`/docs`), haciendo que sea mucho más fácil de navegar.

2.  **Definición de Endpoints (Operaciones de Ruta):**
    -   Se usan "decoradores" de Python como `@router.get()`, `@router.post()`, `@router.put()`, `@router.delete()` para asociar una función de Python con una ruta HTTP y un método específicos.
    -   **Ejemplo:** `@router.post("/")` en `product_router.py` (con el prefijo `/products`) corresponde a una petición `POST` a la URL `/api/v1/products/`.

3.  **La Función del Endpoint:**
    -   Esta es la función que se ejecuta cuando una petición llega a la ruta.
    -   **Parámetros y Dependencias:** La firma de la función es clave. FastAPI la usa para entender qué necesita la función para ejecutarse.
        -   `product: schemas.ProductCreate`: FastAPI tomará el cuerpo (body) de la petición `POST`, lo validará contra el esquema `ProductCreate` y, si es válido, lo convertirá en un objeto Python `product` disponible dentro de la función.
        -   `db: Session = Depends(get_db)`: Aquí se inyecta la dependencia de la base de datos que vimos en `core/dependencies.py`. FastAPI nos proporciona una sesión de base de datos lista para usar.
        -   `current_user: User = Depends(require_admin())`: Aquí se inyecta una dependencia de seguridad. El código de `require_admin()` se ejecutará primero. Si el usuario no es un administrador, la petición será rechazada antes de que se ejecute una sola línea de nuestra función de endpoint. Si tiene éxito, tendremos los datos del usuario en la variable `current_user`.
    -   **Lógica de la Función:** La función del endpoint debe ser lo más "tonta" posible. Su única responsabilidad es:
        1.  Recibir la petición validada y las dependencias.
        2.  Llamar al **servicio** correspondiente (ej: `product_service.create_product(...)`), pasándole los datos necesarios.
        3.  Tomar el resultado del servicio y devolverlo. FastAPI se encargará de convertirlo a JSON y enviarlo como respuesta.
    -   Esta separación (Router -> Service -> DB) mantiene el código organizado y fácil de probar. El router se ocupa del "qué" (qué ruta y método), y el servicio se ocupa del "cómo" (la lógica de negocio).

---

### 4.1. Ejemplo: `brand_router.py`

Casi todos los archivos en esta carpeta siguen el mismo patrón. El router de marcas (`brand_router.py`) es un ejemplo claro y conciso.

-   Define un `APIRouter` con el prefijo `/api/brands` y la etiqueta `Brands`.
-   **`@router.post("/")` (Crear una marca):**
    -   Espera recibir en el body de la petición datos que cumplan con el esquema `BrandCreate`.
    -   Requiere permisos de administrador a través de la dependencia `Depends(require_admin())`.
    -   Recibe la sesión de la base de datos con `Depends(get_db)`.
    -   Llama a `brand_service.create_brand(db, brand_data)`.
    -   Devuelve la nueva marca creada.
-   **`@router.get("/")` (Obtener todas las marcas):**
    -   Es una ruta pública.
    -   Recibe la sesión de la base de datos.
    -   Llama a `brand_service.get_all_brands(db)`.
    -   Devuelve una lista de todas las marcas.
-   **`@router.get("/{brand_id}")` (Obtener una marca por ID):**
    -   Toma el `brand_id` de la URL.
    -   Llama a `brand_service.get_brand_by_id(db, brand_id)`.
    -   Devuelve la marca encontrada o un error 404 si no existe (manejado por el servicio).
-   **`@router.put("/{brand_id}")` (Actualizar una marca):**
    -   Toma el `brand_id` de la URL y los datos a actualizar del body (validados con `BrandUpdate`).
    -   Requiere permisos de administrador.
    -   Llama a `brand_service.update_brand(db, brand_id, brand_data)`.
    -   Devuelve la marca actualizada.
-   **`@router.delete("/{brand_id}")` (Eliminar una marca):**
    -   Toma el `brand_id` de la URL.
    -   Requiere permisos de administrador.
    -   Llama a `brand_service.delete_brand(db, brand_id)`.
    -   Devuelve un mensaje de confirmación.

Este mismo patrón se replica en `product_router.py`, `category_router.py`, `order_router.py` y los demás, adaptado a la lógica y los datos de cada recurso.

## 5. Carpeta `app/services`

**Propósito:** Si los routers son la "cara" pública de nuestra API, los servicios son el "cerebro". Esta carpeta contiene toda la **lógica de negocio** de la aplicación. Mientras que el router se encarga de gestionar la petición y la respuesta HTTP, el servicio se encarga de ejecutar la tarea solicitada.

**Responsabilidades de un Servicio:**

-   **Interactuar con la Base de Datos:** Los servicios son los únicos que deben hablar directamente con la base de datos (a través de SQLAlchemy). Reciben la sesión `db` del router y la usan para realizar las consultas: crear, buscar, actualizar o eliminar registros.
-   **Contener la Lógica de Negocio Compleja:** Cualquier operación que vaya más allá de una simple consulta a la base de datos pertenece aquí. Por ejemplo:
    -   Al crear un pedido (`order_service`), no solo se crea un registro en la tabla de pedidos. También se debe descontar el stock de los productos, registrar la transacción, enviar un email de confirmación, etc. Toda esa orquestación ocurre en el servicio.
    -   Al registrar un usuario (`user_service`), se debe hashear la contraseña antes de guardarla.
    -   Al procesar un pago (`payment_service`), se debe interactuar con la API de un tercero como Wompi o Mercado Pago.
-   **Manejo de Errores de Negocio:** Los servicios son responsables de manejar y lanzar errores específicos del dominio. Por ejemplo, si un router pide crear un producto con un `id_categoria` que no existe, el `product_service` debe verificarlo y lanzar una `HTTPException` con un error 404 (No Encontrado) y un mensaje claro como "La categoría no existe".
-   **Abstracción:** Los servicios abstraen la complejidad. El router no necesita saber cómo se hashea una contraseña o cómo se conecta a una API externa; simplemente llama a una función del servicio como `auth_service.register_new_user(...)` y confía en que el servicio hará el trabajo correctamente.

**Estructura:**
Generalmente, hay un archivo de servicio por cada archivo de router, manteniendo la correspondencia de recursos (ej: `product_router.py` usa `product_service.py`).

A continuación, nos centraremos en los dos servicios más críticos para el funcionamiento de la plataforma: el servicio de autenticación y el servicio de envío de correos.

---

### 5.1. Servicio Detallado: `auth_service.py`

Este servicio encapsula toda la lógica de negocio relacionada con la autenticación de usuarios. Trabaja en estrecha colaboración con `jwt_utils.py` para manejar credenciales y tokens.

#### **`authenticate_user(db, email, password)`**

-   **Propósito:** Verificar si un par de email y contraseña son válidos.
-   **Funcionamiento:**
    1.  Llama a `user_service.get_user_by_email()` para buscar al usuario en la base de datos. Si no lo encuentra, devuelve `None`.
    2.  Si encuentra al usuario, llama a `verify_password()` (de `jwt_utils.py`) para comparar la contraseña proporcionada en texto plano con el hash seguro almacenado en la base de datos.
    3.  Si la contraseña no coincide, devuelve `None`.
    4.  Si la contraseña es correcta, crea y devuelve un objeto `UserInToken` con los datos básicos del usuario (ID, email, nombre y rol), listo para ser usado en la creación de un token.

#### **`login_user(db, login_data)`**

-   **Propósito:** Gestionar el proceso de login completo.
-   **Funcionamiento:**
    1.  Llama a la función anterior, `authenticate_user()`.
    2.  Si `authenticate_user()` devuelve `None` (porque el email no existe o la contraseña es incorrecta), lanza una `HTTPException` con código 401 (No Autorizado) y un mensaje claro: "Email o contraseña incorrectos".
    3.  Si la autenticación es exitosa, procede a crear los tokens.
    4.  Llama a `create_access_token()` y `create_refresh_token()` (de `jwt_utils.py`), pasando los datos del usuario (su ID y email, que se guardarán dentro del "payload" de los tokens).
    5.  Devuelve un objeto `TokenResponse` que contiene ambos tokens, listo para ser enviado al cliente.

#### **`refresh_access_token(db, refresh_token)`**

-   **Propósito:** Generar un nuevo par de tokens usando un token de refresco válido.
-   **Funcionamiento:**
    1.  Llama a `verify_token()` para validar el `refresh_token` que envió el cliente. Es importante que le especifica `token_type="refresh"` para asegurarse de que no se pueda usar un token de acceso para esta operación.
    2.  Si el token es inválido o ha expirado, `verify_token()` lanzará una excepción.
    3.  Extrae el ID de usuario del payload del token y comprueba que el usuario todavía existe en la base de datos. Esto es una medida de seguridad importante: si el usuario fue eliminado, su token de refresco, aunque sea válido, ya no debería poder generar nuevas sesiones.
    4.  Si todo es correcto, crea un **nuevo token de acceso** y también un **nuevo token de refresco**. Esto se conoce como "rotación de tokens de refresco" y es una buena práctica de seguridad.
    5.  Devuelve ambos tokens nuevos en un `TokenResponse`.

#### **`get_current_user(db, token)`**

-   **Propósito:** Esta es la función central que usan las dependencias y los middlewares para validar un token de acceso y obtener los datos del usuario correspondiente.
-   **Funcionamiento:**
    1.  Llama a `verify_token()`, esta vez con el `token_type="access"` por defecto.
    2.  Extrae el ID del usuario del payload del token decodificado.
    3.  Busca al usuario en la base de datos por su ID.
    4.  Si no lo encuentra (por ejemplo, el usuario fue borrado después de que el token fue emitido), lanza una excepción 401.
    5.  Si el usuario existe, devuelve un objeto `UserInToken` con sus datos.

#### **`change_password(db, user_id, current_password, new_password)`**

-   **Propósito:** Cambiar la contraseña de un usuario que ha iniciado sesión.
-   **Funcionamiento:**
    1.  Busca al usuario por su `user_id`.
    2.  Verifica que la `current_password` proporcionada sea correcta, usando `verify_password()`. Si no lo es, lanza un error 400 (Bad Request).
    3.  Si la contraseña actual es correcta, llama a `get_password_hash()` para hashear la `new_password`.
    4.  Llama a una función en `user_service` para que actualice el campo de la contraseña en la base de datos con el nuevo hash.
    5.  Devuelve `True` para indicar que la operación fue exitosa.

---

### 5.2. Servicio Detallado: `email_service.py` y `email_templates.py`

Este es el sistema de comunicaciones de la aplicación. Su responsabilidad es enviar correos electrónicos transaccionales y de marketing a los usuarios y administradores. La lógica está inteligentemente separada en dos archivos: `email_templates.py` para **construir** el contenido del correo y `email_service.py` para **enviarlo**.

#### **`email_templates.py`: El Constructor de Contenido**

**Propósito:** Este archivo utiliza la librería **Jinja2** para generar el cuerpo HTML de los correos a partir de plantillas. Jinja2 es un motor de plantillas muy potente que nos permite crear archivos HTML con "variables" y lógica simple (bucles, condicionales), y luego "renderizarlos" con datos reales.

**Clase `EmailTemplates`:**
-   **`__init__(self)` (El Constructor):**
    1.  Localiza la carpeta `app/templates/emails`.
    2.  Inicializa el entorno de Jinja2 (`self.env`), diciéndole que busque las plantillas en esa carpeta.
    3.  Configura el `autoescape`, una medida de seguridad crucial que neutraliza cualquier HTML malicioso que pudiera venir en los datos, evitando ataques XSS.
    4.  Define **filtros personalizados** como `currency` o `datetime` que se pueden usar directamente en las plantillas (ej: `{{ order.total | currency }}`) para formatear datos de manera consistente.
-   **`render_template(self, template_name, **context)`:**
    1.  Esta es la función central. Recibe el nombre de un archivo de plantilla (ej: `auth/welcome.html`) y un diccionario `context` con los datos dinámicos (ej: `user_name="Juan"`).
    2.  **Importante:** Automáticamente añade al contexto las variables globales de la instancia SaaS (nombre de la empresa, logo, etc.) desde `settings`. Esto permite que todas las plantillas se personalicen con la marca del cliente sin esfuerzo.
    3.  Carga la plantilla (`.html`) y la renderiza, reemplazando las variables (`{{ user_name }}`) con los valores del contexto.
    4.  Devuelve el string HTML final.
-   **Funciones de conveniencia (`get_welcome_template`, `get_password_reset_template`, etc.):**
    -   Son atajos que llaman a `render_template` con el nombre de la plantilla y los parámetros correctos. Por ejemplo, `get_password_reset_template` también construye la URL completa de reseteo antes de pasársela a la plantilla. Esto simplifica el código en el `email_service`.

#### **`email_service.py`: El Cartero**

**Propósito:** Este servicio toma el HTML generado por `email_templates.py` y lo envía al destinatario final utilizando el servicio de terceros **Resend**.

**Funcionamiento General:**
-   **`_configure_resend()`:** Una función auxiliar que establece la clave API de Resend, leída desde `settings.RESEND_API_KEY`.
-   **`_get_from_field()`:** Construye el campo "De:" del correo en el formato `Nombre <email@dominio.com>`, usando los datos de `settings`.
-   **`send_basic_email(email_data)`:**
    1.  Esta es la función de envío fundamental.
    2.  Llama a `_configure_resend()`.
    3.  Si se le pasa un `template_name`, llama a `email_templates.render_template()` para generar el HTML.
    4.  Llama a `resend.Emails.send({...})`, pasándole el remitente, destinatario, asunto y el cuerpo del correo.
    5.  Maneja la respuesta de Resend, registrando el éxito o el fracaso de la operación.
-   **Funciones de alto nivel (`send_welcome_email`, `send_order_confirmation_email`, etc.):**
    -   Estas son las funciones que se llaman desde otros servicios (como `auth_service` o `order_service`).
    -   Su única responsabilidad es orquestar la llamada.
    1.  Llaman a la función de plantilla correspondiente en `email_templates` para obtener el HTML (ej: `email_templates.get_welcome_template(...)`).
    2.  Crean un objeto `EmailSend` con el destinatario, el asunto y el HTML generado.
    3.  Llaman a `send_basic_email()` para realizar el envío.
    4.  Devuelven `True` o `False` para indicar si el envío fue exitoso.

**Flujo Completo (Ejemplo: Bienvenida a un nuevo usuario):**
1.  Un usuario se registra. El `auth_router` llama a `auth_service.register_new_user()`.
2.  Dentro de `auth_service`, después de crear el usuario, se llama a `email_service.send_welcome_email(user.email, user.name)`.
3.  `email_service` llama a `email_templates.get_welcome_template(user.name)`.
4.  `email_templates` carga `auth/welcome.html`, lo renderiza con el nombre del usuario y las variables globales de la empresa, y devuelve el HTML final.
5.  `email_service` toma ese HTML, lo empaqueta en un `EmailSend` y llama a `send_basic_email()`.
6.  `send_basic_email` se conecta a la API de Resend y envía el correo.

Esta arquitectura es muy robusta: la lógica de presentación (HTML) está separada de la lógica de envío, y ambas están separadas de la lógica de negocio que decide *cuándo* enviar el correo.

---

### 5.3. Servicio Detallado: `payment_service.py` y `wompi_service.py`

Este es el sistema encargado de todo lo relacionado con los pagos. Al igual que el servicio de email, está dividido en dos capas:
-   **`wompi_service.py`**: Una capa de bajo nivel que se comunica **directamente** con la API de la pasarela de pagos Wompi.
-   **`payment_service.py`**: Una capa de lógica de negocio que utiliza el `wompi_service` y se comunica con nuestra base de datos para gestionar los métodos de pago del usuario.

#### **`wompi_service.py`: El Adaptador de Wompi**

**Propósito:** Encapsular toda la complejidad de la comunicación con la API de Wompi. Si en el futuro quisiéramos añadir otra pasarela de pago como Mercado Pago, solo tendríamos que crear un `mercadopago_service.py` similar, y el resto de la aplicación no se vería afectada.

**Clase `WompiService`:**
-   **`__init__(self)`:** En el constructor, inicializa la URL base de la API de Wompi (usando el entorno `sandbox` o `producción` desde la configuración) y las cabeceras HTTP necesarias, incluyendo la `WOMPI_PRIVATE_KEY` para la autenticación.
-   **`_request(...)`:** Una función auxiliar privada y genérica para realizar peticiones a Wompi. Centraliza el manejo de errores, el logging y la construcción de URLs, manteniendo el resto del código limpio.
-   **`get_acceptance_token()`:** Una función crucial. Para poder guardar una tarjeta (tokenizarla), Wompi exige un "token de aceptación" que certifica que el usuario ha aceptado los términos y condiciones. Esta función obtiene dicho token consultando los datos del comercio.
-   **`create_payment_source(...)`:** Esta es la función para **guardar una tarjeta de forma segura**.
    1.  Primero, llama a `get_acceptance_token()` para obtener el permiso necesario.
    2.  Luego, hace una petición a Wompi para crear una "fuente de pago". Le envía el `card_token` (un token de un solo uso que el frontend de Wompi genera), el email del cliente y el token de aceptación.
    3.  Wompi procesa esto, guarda la tarjeta en su bóveda segura y nos devuelve un ID permanente para esa tarjeta (ej: `src_prod_123abc`). **Nosotros nunca vemos ni almacenamos el número de tarjeta completo.**
-   **`create_transaction(...)`:** Esta función se usaría para realizar un cobro. Toma el monto, el email, la referencia del pedido y, lo más importante, el `payment_source_id` que obtuvimos al guardar la tarjeta. Le dice a Wompi: "Cobra X cantidad a la tarjeta asociada con este ID".

#### **`payment_service.py`: El Gestor de Pagos del Usuario**

**Propósito:** Orquestar el proceso de añadir y gestionar los métodos de pago de un usuario, conectando la lógica de Wompi con nuestra base de datos.

**Funciones Principales:**
-   **`add_payment_method(db, user, card_token, brand)`:**
    1.  Llama a `wompi_service.create_payment_source()` para guardar la tarjeta en Wompi.
    2.  Si Wompi responde con éxito, extrae los datos importantes: el `provider_source_id` (el ID de la tarjeta en Wompi), los últimos 4 dígitos, el mes/año de expiración, etc.
    3.  Llama a una **función de la base de datos** (`fun_agregar_metodo_pago`) pasándole estos datos. Esta es una decisión de diseño interesante: en lugar de escribir la lógica SQL con SQLAlchemy en el servicio, se delega a una función almacenada en PostgreSQL. Esto puede ser útil para centralizar lógica de base de datos compleja.
    4.  La función de la base de datos inserta el nuevo método de pago en la tabla `tab_metodos_pago_usuario`, asociándolo al `id_usuario`.
    5.  Si todo es correcto, hace un `db.commit()` para guardar los cambios. Si algo falla (ya sea en Wompi o en la DB), hace un `db.rollback()` para deshacer todo y mantener la consistencia.
-   **`list_payment_methods(db, id_usuario)`:** Realiza una consulta `SELECT` simple a la tabla `tab_metodos_pago_usuario` para devolver todas las tarjetas que un usuario tiene guardadas.
-   **`delete_payment_method(...)` y `set_default_payment_method(...)`:** Al igual que `add_payment_method`, llaman a funciones almacenadas en la base de datos (`fun_eliminar_metodo_pago` y `fun_actualizar_metodo_pago_default`) para realizar estas operaciones.

**Flujo Completo (Añadir una tarjeta):**
1.  El usuario, en el frontend, rellena el formulario de tarjeta de Wompi.
2.  El frontend de Wompi se comunica con la API de Wompi y recibe un `card_token` temporal.
3.  El frontend envía este `card_token` a nuestro endpoint (`/api/payment-methods`).
4.  El `payment_router` llama a `payment_service.add_payment_method()`.
5.  `payment_service` llama a `wompi_service.create_payment_source()` para validar el token y guardar la tarjeta en Wompi.
6.  `wompi_service` devuelve el ID permanente de la tarjeta.
7.  `payment_service` llama a la función `fun_agregar_metodo_pago` en nuestra base de datos para guardar una referencia a esa tarjeta (últimos 4 dígitos, marca, y el ID de Wompi).
8.  El servicio devuelve una respuesta de éxito al frontend.

---

### 5.4. Servicio Detallado: `order_service.py`

Este servicio gestiona toda la lógica de negocio relacionada con los pedidos de los clientes, desde su creación hasta su consulta. Representa uno de los flujos más críticos de una plataforma de e-commerce.

**Patrón de Diseño: Lógica en la Base de Datos**
Al igual que el servicio de pagos, `order_service.py` sigue un patrón en el que la lógica de negocio más compleja y crítica se delega a una **función almacenada en la base de datos** (`fun_crear_orden_desde_carrito`).

**¿Por qué hacer esto?**
-   **Atomicidad y Transacciones:** La creación de una orden implica múltiples pasos (verificar el carrito, validar el stock de cada producto, aplicar descuentos, crear el registro de la orden, crear los registros de los detalles de la orden, vaciar el carrito). Agrupar toda esta lógica en una única función de base de datos asegura que la operación sea **atómica**: o todos los pasos se completan con éxito, o ninguno lo hace. Esto previene estados inconsistentes, como que se descuente el stock de un producto pero no se cree la orden.
-   **Rendimiento:** Las operaciones dentro de la base de datos suelen ser más rápidas que hacer múltiples viajes de ida y vuelta entre la aplicación y la base de datos.
-   **Centralización:** La "verdad" sobre cómo se crea una orden reside en un único lugar (la función SQL), lo que facilita su mantenimiento.

**Funciones Principales:**
-   **`create_order(db, order, usr_insert)`:**
    1.  **Rol Principal:** Su función no es construir la orden paso a paso, sino **invocar de forma segura la función de la base de datos**.
    2.  Recibe los datos validados del router (un esquema `OrderCreate` que contiene el `id_carrito` a procesar, la dirección de envío, un posible código de descuento y observaciones).
    3.  Prepara los parámetros y ejecuta la llamada a `SELECT fun_crear_orden_desde_carrito(...)`.
    4.  **Lógica dentro de `fun_crear_orden_desde_carrito` (lo que realmente pasa):**
        -   Inicia una transacción.
        -   Recupera todos los productos del carrito especificado.
        -   Verifica que haya stock suficiente para cada producto. Si no, falla y revierte todo.
        -   Calcula los subtotales y el total.
        -   Si se proporcionó un `codigo_descuento`, lo valida y aplica el descuento al total.
        -   Inserta la cabecera de la orden en la tabla `tab_ordenes`.
        -   Inserta cada producto del carrito como una línea de detalle en la tabla `tab_detalle_orden`.
        -   Llama a otra función, `fun_actualizar_stock_automatico`, para restar las cantidades compradas del inventario.
        -   Elimina los productos del carrito del usuario.
        -   Si todo fue exitoso, confirma la transacción (`COMMIT`).
    5.  El servicio de FastAPI recibe el resultado de la función de la base de datos (que es un diccionario con todos los datos de la orden recién creada) y lo devuelve al router.
    6.  Maneja los `commit` y `rollback` de la sesión de SQLAlchemy y propaga los errores que puedan ocurrir dentro de la base de datos.
-   **`get_orders(db)`**, **`get_orders_by_user(db, id_usuario)`**, **`get_order_by_id(db, id_orden)`:**
    -   Estas son funciones de lectura más tradicionales.
    -   Ejecutan consultas `SELECT` directas (usando `sqlalchemy.text` para SQL plano) sobre la tabla `tab_ordenes` para recuperar la información de los pedidos.
    -   Devuelven los resultados para que el router los envíe al cliente.

---

### 5.5. Servicio Detallado: `cart_product_service.py`

Este servicio es el corazón de la experiencia de compra antes del checkout. Gestiona todas las interacciones con el carrito de compras del usuario, con la particularidad de que debe funcionar tanto para usuarios autenticados como para visitantes anónimos.

**Concepto Clave: Carritos Anónimos y Registrados**
-   **Usuario Anónimo:** Un visitante que aún no ha iniciado sesión. Se le identifica mediante un `session_id` único, que el frontend debe generar y mantener (por ejemplo, en el `localStorage` del navegador). El carrito de este usuario está asociado a ese `session_id`.
-   **Usuario Registrado:** Un usuario que ha iniciado sesión. Su carrito está directamente asociado a su `id_usuario`.
-   Esta dualidad permite que cualquier persona pueda empezar a añadir productos a un carrito y, si decide registrarse o iniciar sesión, que no pierda su selección.

**Patrón de Diseño: Lógica en la Base de Datos (de nuevo)**
Siguiendo el patrón de `order_service`, este servicio también delega la lógica compleja a funciones almacenadas en la base de datos para garantizar la integridad y el rendimiento.

**Funciones Principales:**
-   **`create_cart_product(db, cart_product, ...)`:**
    -   Llama a la función `fun_agregar_producto_carrito`.
    -   **Lógica en la DB:** Esta función es inteligente. Primero, comprueba si ya existe un carrito para el `id_usuario` o el `session_id` proporcionado. Si no existe, lo crea. Luego, añade el producto especificado al carrito correspondiente. Si el producto ya estaba en el carrito, simplemente actualiza la cantidad.
-   **`delete_cart_product(db, ...)`:**
    -   Llama a `fun_eliminar_producto_carrito`.
    -   **Lógica en la DB:** Busca el producto en el carrito del usuario/sesión y reduce su cantidad. Si la cantidad llega a cero, elimina la fila por completo.
-   **`get_cart_user(db, ...)`:**
    -   Llama a `fun_obtener_carrito_usuario`.
    -   **Lógica en la DB:** Devuelve el ID del carrito para un usuario o sesión. Si no existe, lo crea sobre la marcha. Esto asegura que siempre tengamos un carrito al que añadir productos.
-   **`get_cart_detail(db, ...)`:**
    -   Llama a `fun_obtener_carrito_detalle`.
    -   **Lógica en la DB:** Esta función es más compleja. Realiza un `JOIN` entre la tabla de carritos, la de productos del carrito y la de productos para devolver una lista completa de los artículos en el carrito, incluyendo nombre, imagen, cantidad, precio, etc.
-   **`calculate_total_cart(db, ...)`:**
    -   Llama a `fun_calcular_total_carrito`.
    -   **Lógica en la DB:** Itera sobre todos los productos en el carrito, multiplica la cantidad por el precio unitario de cada uno y devuelve los totales (subtotal, descuentos, total final). Puede incluir lógica para aplicar descuentos a nivel de carrito.
-   **`migrate_cart_anonymous(db, ...)`:**
    -   **¡Función Clave del Flujo de Usuario!**
    -   Se llama cuando un usuario con un carrito anónimo (`session_id`) inicia sesión o se registra.
    -   Llama a la función de base de datos `fun_migrar_carrito_anonimo_a_usuario`.
    -   **Lógica en la DB:**
        1.  Busca los productos en el carrito del `session_id` anónimo.
        2.  Busca el carrito del `id_usuario` recién autenticado (o lo crea si no existe).
        3.  Mueve/copia los productos del carrito anónimo al carrito del usuario. Si un producto ya existía en ambos, puede fusionar las cantidades.
        4.  Elimina el carrito anónimo original.
        5.  Todo esto ocurre dentro de una única transacción para garantizar que no se pierdan productos en el proceso.

---

### 5.6. Servicio Detallado: `discount_service.py`

Este es el servicio que gestiona el motor de promociones y descuentos de la tienda, una de las herramientas más potentes para el marketing y las ventas. Su complejidad radica en la gran cantidad de reglas y condiciones que se pueden aplicar para definir cuándo y cómo se otorga un descuento.

**Patrón de Diseño: Motor de Reglas en la Base de Datos**
Una vez más, la lógica de negocio más crítica y compleja reside en funciones almacenadas en la base de datos (`fun_insert_descuento`, `fun_update_descuento`, etc.). El servicio de FastAPI actúa como una capa de acceso que valida los datos de entrada a través de los esquemas Pydantic (`DiscountCreate`, `DiscountUpdate`) y llama a la función correspondiente.

**Anatomía de un Descuento**
Analizando los parámetros que reciben las funciones de la base de datos, podemos deducir la flexibilidad del motor de descuentos. Un descuento puede ser configurado con múltiples condiciones y tipos de aplicación:

-   **Tipo de Cálculo:**
    -   `val_porce_descuento`: Un porcentaje sobre el precio (ej. 15% de descuento).
    -   `val_monto_descuento`: Un monto fijo (ej. $5 de descuento).

-   **Ámbito de Aplicación (`aplica_a`):**
    -   Puede aplicar a toda la orden.
    -   Puede aplicar a un `id_producto` específico.
    -   Puede aplicar a todos los productos de una `id_categoria`, `id_linea`, `id_sublinea` o `id_marca`.

-   **Condiciones para la Activación:**
    -   `min_valor_pedido`: El carrito debe superar un monto mínimo.
    -   `monto_minimo_producto` / `cantidad_minima_producto`: Se debe comprar una cantidad o un valor mínimo de un producto específico.
    -   `solo_primera_compra`: El descuento solo es válido para clientes nuevos.
    -   `requiere_codigo`: El usuario debe introducir un `codigo_descuento` específico. Si es falso, el descuento puede aplicarse automáticamente si se cumplen las demás condiciones.

-   **Condiciones de Tiempo:**
    -   `fec_inicio` y `fec_fin`: Rango de fechas de validez de la promoción.
    -   `dias_semana_aplica`: Puede ser válido solo ciertos días (ej. "Lunes,Miércoles,Viernes").
    -   `horas_inicio` y `horas_fin`: Puede ser válido solo en un horario específico (ej. "Happy Hour").

-   **Límites de Uso:**
    -   `max_usos_total`: Límite de veces que el descuento puede ser usado en total por todos los clientes.
    -   `max_usos_por_usuario`: Límite de veces que un mismo cliente puede usar el descuento.

-   **Sistema de Puntos (Fidelización):**
    -   `ind_canjeable_puntos`: Indica si este descuento se puede "comprar" con puntos de fidelidad.
    -   `costo_puntos_canje`: Cuántos puntos cuesta canjear este descuento.

-   **Descuentos Especiales:**
    -   `ind_es_para_cumpleanos`: Un descuento que se activa automáticamente para el cumpleaños del usuario.

**Funciones Principales:**
-   **`create_discount(db, discount, ...)` y `update_discount(db, ...)`:** Toman los datos del esquema Pydantic, los empaquetan y llaman a las funciones `fun_insert_descuento` o `fun_update_descuento` en la base de datos para crear o modificar la regla de descuento.
-   **`get_discount_exchangeable(db, ...)`:** Llama a la función `fun_listar_descuentos_canjeables`, que contiene la lógica para mostrar a un usuario qué descuentos puede "comprar" con su saldo de puntos actual.
-   **`deactivate_activate_discount(db, ...)`:** Llama a `fun_activar_desactivar_descuento` para cambiar el estado de una promoción sin borrarla.

La lógica de **aplicación** de estos descuentos (el cálculo final) probablemente resida en la función `fun_crear_orden_desde_carrito` o `fun_calcular_total_carrito`, que tomarán el `codigo_descuento` o verificarán los descuentos automáticos aplicables en el momento del checkout. 
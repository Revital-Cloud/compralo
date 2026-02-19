"""
Middleware de roles y permisos.

Define middlewares para verificar roles específicos y permisos
basados en el tipo de operación y recurso.
"""
from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from typing import Callable, Dict, List
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from core.database import get_db
from services import auth_service

logger = logging.getLogger(__name__)

class RoleBasedAccessMiddleware:
    """
    Middleware que controla el acceso basado en roles para diferentes rutas.
    """
    
    def __init__(self, role_permissions: Dict[str, Dict[str, List[int]]] = None):
        """
        Inicializa el middleware de control de acceso basado en roles.
        
        Args:
            role_permissions: Diccionario que mapea rutas a métodos y roles permitidos
                Ejemplo: {
                    "/api/products": {
                        "POST": [1],  # Solo admin (rol 1)
                        "PUT": [1],   # Solo admin
                        "DELETE": [1], # Solo admin
                        "GET": [1, 2]  # Admin y usuarios normales
                    }
                }
        """
        self.role_permissions = role_permissions or self._get_default_permissions()
    
    def _get_default_permissions(self) -> Dict[str, Dict[str, List[int]]]:
        """
        Retorna los permisos por defecto para diferentes rutas.
        
        Returns:
            Dict: Configuración de permisos por defecto
        """
        return {
            "/api/products": {
                "POST": [1],      # Solo administradores pueden crear
                "PUT": [1],       # Solo administradores pueden actualizar
                "DELETE": [1],    # Solo administradores pueden eliminar
                "GET": [1, 2]     # Administradores y usuarios pueden ver
            },
            "/api/users": {
                "POST": [1],      # Solo administradores pueden crear usuarios
                "PUT": [1],       # Solo administradores pueden actualizar usuarios
                "DELETE": [1],    # Solo administradores pueden eliminar usuarios
                "GET": [1]        # Solo administradores pueden listar usuarios
            },
            "/api/providers": {
                "POST": [1],      # Solo administradores
                "PUT": [1],       # Solo administradores
                "DELETE": [1],    # Solo administradores
                "GET": [1, 2]     # Administradores y usuarios
            },
            "/api/brands": {
                "POST": [1],      # Solo administradores
                "PUT": [1],       # Solo administradores
                "DELETE": [1],    # Solo administradores
                "GET": [1, 2]     # Administradores y usuarios
            },
            "/api/categories": {
                "POST": [1],      # Solo administradores
                "PUT": [1],       # Solo administradores
                "DELETE": [1],    # Solo administradores
                "GET": [1, 2]     # Administradores y usuarios
            },
            "/api/cms": {
                "POST": [1],      # Solo administradores
                "PUT": [1],       # Solo administradores
                "DELETE": [1],    # Solo administradores
                "GET": [1, 2]     # Administradores y usuarios
            }
        }
    
    async def __call__(self, request: Request, call_next: Callable):
        """
        Procesa la solicitud y verifica los permisos basados en roles.
        
        Args:
            request: Solicitud HTTP
            call_next: Siguiente función en la cadena de middleware
            
        Returns:
            Response: Respuesta HTTP
        """
        path = request.url.path
        method = request.method.upper()
        
        # Verificar si la ruta necesita verificación de permisos
        route_found = False
        required_roles = None
        
        for route_pattern, methods in self.role_permissions.items():
            if path.startswith(route_pattern):
                route_found = True
                required_roles = methods.get(method)
                break
        
        if route_found and required_roles is not None:
            try:
                # Obtener el token del header Authorization
                authorization = request.headers.get("Authorization")
                if not authorization:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Se requiere autenticación para acceder a este recurso",
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                scheme, token = get_authorization_scheme_param(authorization)
                if scheme.lower() != "bearer" or not token:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token de autorización inválido",
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                # Obtener sesión de base de datos
                db_gen = get_db()
                db = next(db_gen)
                
                try:
                    # Verificar el token y obtener el usuario
                    current_user = auth_service.get_current_user(db, token)
                    
                    # Verificar si el usuario tiene el rol requerido
                    if current_user.id_rol not in required_roles:
                        # Usar nombres de roles fijos (más simple y rápido)
                        role_names = {1: "Administrador", 2: "Usuario"}
                        required_role_names = [role_names.get(role, f"Rol {role}") for role in required_roles]
                        
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Se requiere uno de los siguientes roles: {', '.join(required_role_names)}"
                        )
                    
                    # Agregar información del usuario a la request
                    request.state.current_user = current_user
                    
                    logger.info(
                        f"Usuario {current_user.email_usuario} (rol {current_user.id_rol}) "
                        f"accedió a {method} {path}"
                    )
                    
                finally:
                    db.close()
                    
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error en middleware de roles: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error interno del servidor"
                )
        
        # Continuar con la siguiente función
        response = await call_next(request)
        return response

class SmartAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware inteligente de autenticación que categoriza rutas automáticamente.
    
    Rutas PÚBLICAS (sin autenticación):
    - GET: Todos los productos, categorías, marcas, líneas, etc. (catálogo público)
    - POST: Login, registro de usuarios, verificación de email, refresh tokens
    
    Rutas PRIVADAS (con autenticación):
    - GET: Información personal del usuario (/me, /favorites)
    - POST/PUT/DELETE: Operaciones administrativas y de usuario autenticado
    """
    
    def __init__(self, app):
        """Inicializa el middleware inteligente."""
        super().__init__(app)
        # Rutas completamente públicas (sin autenticación)
        self.public_paths = [
            "/",
            "/docs",
            "/openapi.json",
            "/redoc",
            # Autenticación
            "/api/login",
            "/api/refresh", 
            "/api/verify-email",
            # Registro público
            "/api/users",  # Solo POST será público
        ]
        
        # Rutas de solo lectura públicas (GET sin autenticación)
        self.public_read_paths = [
            "/api/products",    # Catálogo público
            "/api/categories",  # Categorías públicas
            "/api/brands",      # Marcas públicas
            "/api/cms"          # Contenido público (páginas, banners, etc.)
        ]
        
        # Rutas que requieren autenticación pero cualquier usuario puede acceder
        self.authenticated_paths = [
            "/api/me",
            "/api/verify-token",
            "/api/change-password",
            "/api/users", #Put de users
            "/api/logout",
            "/api/favorites",
            "/api/send-verification-email"
        ]
        
        # Rutas que solo pueden acceder administradores
        self.admin_only_paths = [
            "/api/users",           # GET, PUT, DELETE de usuarios
            "/api/providers",       # Gestión de proveedores (solo admin)
            "/api/email/send",      # Envío de emails
            "/api/email/welcome",
            "/api/email/verify", 
            "/api/email/password-reset",
            "/api/email/validate-config",
            "/api/email/config",    # Configuración de emails
            "/api/email/stats",     # Estadísticas de emails
            "/api/test",             # Endpoints de testing
            "/api/products",
            "/api/categories",
            "/api/brands",
            "/api/cms",
            "/api/attributes"
        ]
        
        # Recursos que solo admins pueden modificar pero todos pueden leer
        self.admin_write_paths = [
            "/api/products",    # Solo admin puede crear/editar productos
            "/api/categories",  # Solo admin puede gestionar categorías
            "/api/brands",      # Solo admin puede gestionar marcas
            "/api/cms",         # Solo admin puede gestionar contenido
            "/api/attributes"   # Solo admin puede gestionar atributos
        ]
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        Procesa la solicitud y aplica la autenticación según el tipo de ruta.
        """
        path = request.url.path
        method = request.method.upper()
        
        # 1. Rutas completamente públicas
        if self._is_public_path(path):
            return await call_next(request)
        
        # 2. Registro de usuarios (POST público, resto privado)
        if path.startswith("/api/users"):
            if method == "POST":
                return await call_next(request)  # Registro público
            else:
                # GET, PUT, DELETE requieren admin
                await self._verify_admin(request)
        
        # 3. Rutas de solo lectura públicas (GET sin auth, resto requiere admin)
        elif any(path.startswith(public_path) for public_path in self.public_read_paths):
            if method == "GET":
                return await call_next(request)  # Lectura pública
            else:
                # POST, PUT, DELETE requieren admin
                await self._verify_admin(request)
        
        # 4. Rutas que requieren cualquier usuario autenticado
        elif any(path.startswith(auth_path) for auth_path in self.authenticated_paths):
            await self._verify_authenticated_user(request)
        
        # 5. Rutas que solo pueden acceder administradores
        elif any(path.startswith(admin_path) for admin_path in self.admin_only_paths):
            await self._verify_admin(request)
        
        # 6. Recursos con escritura restringida a admin
        elif any(path.startswith(write_path) for write_path in self.admin_write_paths):
            if method == "GET":
                return await call_next(request)  # Lectura pública
            else:
                await self._verify_admin(request)  # Escritura solo admin
        
        # 7. Por defecto, permitir acceso (para rutas no categorizadas)
        else:
            logger.warning(f"Ruta no categorizada: {method} {path}")
        
        return await call_next(request)
    
    def _is_public_path(self, path: str) -> bool:
        """Verifica si una ruta es completamente pública."""
        return any(path.startswith(public_path) for public_path in self.public_paths)
    
    async def _verify_authenticated_user(self, request: Request):
        """Verifica que el usuario esté autenticado (cualquier rol)."""
        try:
            authorization = request.headers.get("Authorization")
            if not authorization:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Se requiere autenticación para acceder a este recurso",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            scheme, token = get_authorization_scheme_param(authorization)
            if scheme.lower() != "bearer" or not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de autorización inválido",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Obtener sesión de base de datos
            db_gen = get_db()
            db = next(db_gen)
            
            try:
                # Verificar el token y obtener el usuario
                current_user = auth_service.get_current_user(db, token)
                request.state.current_user = current_user
                
                logger.info(f"Usuario autenticado: {current_user.email_usuario} accedió a {request.method} {request.url.path}")
                
            finally:
                db.close()
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error en autenticación: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno del servidor"
            )
    
    async def _verify_admin(self, request: Request):
        """Verifica que el usuario sea administrador."""
        try:
            authorization = request.headers.get("Authorization")
            if not authorization:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Se requiere autenticación de administrador",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            scheme, token = get_authorization_scheme_param(authorization)
            if scheme.lower() != "bearer" or not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token de autorización inválido",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Obtener sesión de base de datos
            db_gen = get_db()
            db = next(db_gen)
            
            try:
                # Verificar el token y obtener el usuario
                current_user = auth_service.get_current_user(db, token)
                
                # Verificar que sea administrador (rol ID = 1)
                if current_user.id_rol != 1:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Se requieren permisos de administrador para realizar esta operación"
                    )
                
                request.state.current_user = current_user
                
                logger.info(f"Admin {current_user.email_usuario} realizó {request.method} en {request.url.path}")
                
            finally:
                db.close()
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error en verificación de admin: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno del servidor"
            )

# Instancias de middlewares configurados
role_based_middleware = RoleBasedAccessMiddleware()
# smart_auth_middleware = SmartAuthMiddleware()

# Función helper para verificar roles en endpoints específicos
def require_role(required_role: str):
    """
    Dependency para verificar que el usuario tenga un rol específico.
    
    Args:
        required_role (str): Rol requerido ("admin" o "user")
        
    Returns:
        Callable: Dependency function para FastAPI
    """
    def role_dependency(current_user: dict):
        """
        Verifica que el usuario actual tenga el rol requerido.
        
        Args:
            current_user (dict): Usuario actual obtenido del token
            
        Raises:
            HTTPException: Si el usuario no tiene el rol requerido
        """
        user_role_id = current_user.get('id_rol', 0)
        
        # Mapeo de roles
        role_mapping = {
            "admin": 1,
            "user": 2
        }
        
        required_role_id = role_mapping.get(required_role.lower())
        
        if required_role_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Rol '{required_role}' no válido"
            )
        
        if user_role_id != required_role_id:
            # Usar nombres de roles fijos
            role_names = {1: "Administrador", 2: "Usuario"}
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere rol de {role_names.get(required_role_id, required_role)} para acceder a este recurso"
            )
        
        return current_user
    
    return role_dependency 
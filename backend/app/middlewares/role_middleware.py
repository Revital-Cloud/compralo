"""
Middleware de roles y permisos.

Define middlewares para verificar roles específicos y permisos
basados en el tipo de operación y recurso.
"""
from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from typing import Callable, Dict, List
import logging

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
            "/api/suppliers": {
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
            "/api/sublines": {
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

class AdminOnlyMiddleware:
    """
    Middleware simple que solo permite acceso a administradores.
    """
    
    def __init__(self, protected_paths: List[str] = None):
        """
        Inicializa el middleware de solo administradores.
        
        Args:
            protected_paths: Lista de rutas que solo pueden acceder administradores
        """
        self.protected_paths = protected_paths or [
            "/api/admin",
            "/api/products",
            "/api/users"
        ]
    
    async def __call__(self, request: Request, call_next: Callable):
        """
        Procesa la solicitud y verifica que el usuario sea administrador.
        
        Args:
            request: Solicitud HTTP
            call_next: Siguiente función en la cadena de middleware
            
        Returns:
            Response: Respuesta HTTP
        """
        path = request.url.path
        method = request.method.upper()
        
        # Verificar si la ruta necesita permisos de administrador
        needs_admin = any(path.startswith(protected_path) for protected_path in self.protected_paths)
        
        # Solo verificar en operaciones de escritura para productos
        if path.startswith("/api/products") and method in ["POST", "PUT", "DELETE"]:
            needs_admin = True
        elif path.startswith("/api/products") and method == "GET":
            needs_admin = False  # Permitir lectura a todos los usuarios autenticados
        
        if needs_admin:
            try:
                # Obtener el token del header Authorization
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
                    
                    # Agregar información del usuario a la request
                    request.state.current_user = current_user
                    
                    logger.info(f"Admin {current_user.email_usuario} realizó {method} en {path}")
                    
                finally:
                    db.close()
                    
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error en middleware de admin: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error interno del servidor"
                )
        
        # Continuar con la siguiente función
        response = await call_next(request)
        return response

# Instancias de middlewares configurados
role_based_middleware = RoleBasedAccessMiddleware()
admin_only_middleware = AdminOnlyMiddleware() 
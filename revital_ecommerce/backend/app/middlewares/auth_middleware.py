"""
Módulo de Middlewares.

Este archivo está destinado a contener middlewares personalizados para la aplicación.
Los middlewares pueden interceptar las solicitudes y respuestas para realizar
acciones como autenticación, manejo de errores centralizado, logging, etc.

Actualmente, este módulo está vacío pero puede ser extendido según sea necesario.
"""
# Middlewares personalizados, autenticación, manejo de errores, etc.

"""
Middlewares de autenticación y autorización.

Define middlewares personalizados para proteger rutas específicas
y manejar la autenticación de manera centralizada.
"""
from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from sqlalchemy.orm import Session
from typing import Callable, Optional
import logging
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from core.database import get_db
from services import auth_service

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware de autenticación que verifica tokens JWT en las rutas protegidas.
    """
    
    def __init__(self, app, protected_paths: list[str] = None, admin_only_paths: list[str] = None):
        """
        Inicializa el middleware de autenticación.
        
        Args:
            app: La aplicación FastAPI
            protected_paths: Lista de rutas que requieren autenticación
            admin_only_paths: Lista de rutas que solo pueden acceder administradores
        """
        super().__init__(app)
        self.protected_paths = protected_paths or []
        self.admin_only_paths = admin_only_paths or []
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        Procesa la solicitud y verifica la autenticación si es necesaria.
        """
        path = request.url.path
        method = request.method
        
        # Permitir que las solicitudes OPTIONS de pre-vuelo de CORS pasen sin autenticación
        if method == "OPTIONS":
            return await call_next(request)

        # Carrito: rutas de carrito y totales son públicas (usuarios anónimos con session_id)
        if "/carrito" in path or path.rstrip("/").endswith("carrito") or "/calcular-total" in path:
            return await call_next(request)

        # Inicializar variables
        needs_auth = False
        needs_admin = False
        users_path_handled = False

        # Caso especial: POST a /api/users es público (registro y reactivate-request)
        # POST a /api/users/me/deactivate requiere autenticación
        # PUT a /api/users/{id} permite que un usuario actualice su propio perfil
        if path.startswith("/api/users"):
            users_path_handled = True
            if method == "POST":
                if "/me/deactivate" in path:
                    needs_auth = True
                    needs_admin = False
                else:
                    return await call_next(request)  # Registro y reactivate-request públicos
            elif method == "PUT":
                # Para PUT, requerir autenticación pero no necesariamente admin
                # El router verificará que sea el mismo usuario o admin
                needs_auth = True
                needs_admin = False
            elif method in ["GET", "DELETE", "PATCH"]:
                # Otras operaciones de usuarios son admin-only
                needs_auth = True
                needs_admin = True
        
        # Caso especial: GET /api/top-info-bar/active es público
        if path == "/api/top-info-bar/active" and method == "GET":
            return await call_next(request)
        
        # Verificar si la ruta necesita protección (si no se estableció en el caso especial de /api/users)
        if not needs_auth:
            needs_auth = any(path.startswith(protected_path) for protected_path in self.protected_paths)
        
        # Para rutas administrativas, solo requerir admin en métodos de escritura
        # PERO solo si no es el caso especial de /api/users que ya manejamos arriba
        if not users_path_handled and not needs_admin and any(path.startswith(admin_path) for admin_path in self.admin_only_paths):
            if method in ["POST", "PUT", "DELETE", "PATCH"]:
                needs_admin = True
                needs_auth = True
        
        if needs_auth or needs_admin:
            try:
                # Obtener el token del header Authorization
                authorization = request.headers.get("Authorization")
                if not authorization:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token de autorización requerido",
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                scheme, token = get_authorization_scheme_param(authorization)
                if scheme.lower() != "bearer":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Esquema de autorización inválido. Use Bearer",
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                if not token:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token no proporcionado",
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                # Obtener sesión de base de datos
                db_gen = get_db()
                db = next(db_gen)
                
                try:
                    # Verificar el token y obtener el usuario
                    current_user = auth_service.get_current_user(db, token)
                    
                    # Verificar si necesita permisos de administrador
                    # IMPORTANTE: Para PUT en /api/users/{id}, el router verificará los permisos
                    if needs_admin and current_user.id_rol != 1:
                        logger.warning(f"Acceso denegado: {method} {path} - Usuario {current_user.id_usuario} (rol: {current_user.id_rol}) necesita admin")
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Se requieren permisos de administrador para realizar esta operación"
                        )
                    
                    # Agregar información del usuario a la request
                    request.state.current_user = current_user
                    
                    logger.debug("Authenticated request: method=%s path=%s needs_admin=%s needs_auth=%s", method, path, needs_admin, needs_auth)
                    
                finally:
                    db.close()
                    
            except HTTPException as e:
                return Response(
                    content=str(e.detail),
                    status_code=e.status_code,
                    headers=e.headers or {}
                )
            except Exception as e:
                logger.error(f"Error en middleware de autenticación: {str(e)}")
                return Response(
                    content="Error interno del servidor",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Continuar con la siguiente función
        return await call_next(request)

class ProductMiddleware:
    """
    Middleware específico para operaciones de productos.
    """
    
    def __init__(self):
        """Inicializa el middleware de productos."""
        pass
    
    async def __call__(self, request: Request, call_next: Callable):
        """
        Procesa solicitudes relacionadas con productos.
        
        Args:
            request: Solicitud HTTP
            call_next: Siguiente función en la cadena de middleware
            
        Returns:
            Response: Respuesta HTTP
        """
        path = request.url.path
        method = request.method
        
        # Verificar operaciones específicas de productos
        if path.startswith("/api/products"):
            # Solo administradores pueden crear, actualizar o eliminar productos
            if method in ["POST", "PUT", "DELETE"]:
                try:
                    # Obtener el token del header Authorization
                    authorization = request.headers.get("Authorization")
                    if not authorization:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Se requiere autenticación para esta operación",
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
                                detail="Solo los administradores pueden realizar operaciones de escritura en productos"
                            )
                        
                        # Agregar información del usuario a la request
                        request.state.current_user = current_user
                        
                        logger.info(f"Admin {current_user.email_usuario} realizó {method} en productos: {path}")
                        
                    finally:
                        db.close()
                        
                except HTTPException:
                    raise
                except Exception as e:
                    logger.error(f"Error en middleware de productos: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Error interno del servidor"
                    )
        
        # Continuar con la siguiente función
        response = await call_next(request)
        return response

# Ya no necesitamos estas instancias predefinidas ya que configuramos el middleware directamente en main.py
# auth_middleware = AuthMiddleware(...)
# product_middleware = ProductMiddleware()
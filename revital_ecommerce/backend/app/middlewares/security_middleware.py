"""
Middleware de Seguridad
Proporciona headers de seguridad y validación adicional contra XSS
"""

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import re
import logging
from typing import Dict, Any
import json

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware para añadir headers de seguridad y validación XSS
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Patrones XSS comunes
        self.xss_patterns = [
            re.compile(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', re.IGNORECASE),
            re.compile(r'<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>', re.IGNORECASE),
            re.compile(r'javascript:', re.IGNORECASE),
            re.compile(r'vbscript:', re.IGNORECASE),
            re.compile(r'onload\s*=', re.IGNORECASE),
            re.compile(r'onerror\s*=', re.IGNORECASE),
            re.compile(r'onclick\s*=', re.IGNORECASE),
            re.compile(r'eval\s*\(', re.IGNORECASE),
            re.compile(r'Function\s*\(', re.IGNORECASE),
            re.compile(r'expression\s*\(', re.IGNORECASE),
            re.compile(r'url\s*\(', re.IGNORECASE),
            re.compile(r'@import', re.IGNORECASE),
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Validar headers de seguridad en requests
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                # Validar Content-Type
                content_type = request.headers.get("content-type", "")
                if not content_type.startswith(("application/json", "multipart/form-data", "application/x-www-form-urlencoded")):
                    logger.warning(f"Content-Type sospechoso: {content_type} desde {request.client.host}")
                
                # Validar tamaño del body
                content_length = request.headers.get("content-length")
                if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB
                    logger.warning(f"Request demasiado grande: {content_length} bytes desde {request.client.host}")
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request demasiado grande"}
                    )
                
            except Exception as e:
                logger.error(f"Error validando request: {e}")
        
        # Procesar request
        response = await call_next(request)
        
        # Añadir headers de seguridad
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        # Content Security Policy - Configuración flexible para desarrollo y producción
        import os
        environment = os.getenv("ENVIRONMENT", "development").lower().strip()
        is_development = environment in {"development", "dev", "local"}
        is_docs_path = request.url.path in {"/docs", "/redoc", "/openapi.json"} or request.url.path.startswith("/docs/")
        
        # Para documentación (/docs, /redoc, /openapi.json) evitamos CSP:
        # Swagger UI carga assets externos (CDN) y un CSP restrictivo rompe el render.
        # Esto NO afecta la API; solo mejora DX en desarrollo/diagnóstico.
        if is_docs_path:
            # Starlette's MutableHeaders no implementa .pop()
            if "Content-Security-Policy" in response.headers:
                del response.headers["Content-Security-Policy"]
            return response

        if is_development:
            csp = (
                "default-src 'self'; "
                # Swagger UI (FastAPI /docs) suele cargar assets desde CDN (jsdelivr/unpkg)
                "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com; "
                "script-src-elem 'self' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:8000 https://api.revital.com; "
                "frame-src 'none'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'"
            )
        else:
            csp = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https: blob:; "
                "connect-src 'self' https://api.revital.com; "
                "frame-src 'none'; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "frame-ancestors 'none'; "
                "upgrade-insecure-requests"
            )
        response.headers["Content-Security-Policy"] = csp
        
        return response
    
    def detect_xss_in_data(self, data: Any, path: str = "") -> bool:
        """
        Detecta patrones XSS en datos recursivamente
        """
        if isinstance(data, str):
            for pattern in self.xss_patterns:
                if pattern.search(data):
                    logger.warning(f"XSS detectado en {path}: {data[:100]}...")
                    return True
        elif isinstance(data, dict):
            for key, value in data.items():
                if self.detect_xss_in_data(value, f"{path}.{key}"):
                    return True
        elif isinstance(data, list):
            for i, item in enumerate(data):
                if self.detect_xss_in_data(item, f"{path}[{i}]"):
                    return True
        
        return False
    
    def sanitize_string(self, text: str) -> str:
        """
        Sanitiza una cadena eliminando patrones XSS
        """
        if not isinstance(text, str):
            return text
        
        sanitized = text
        
        # Eliminar patrones XSS
        for pattern in self.xss_patterns:
            sanitized = pattern.sub('', sanitized)
        
        # Escapar caracteres HTML
        sanitized = (sanitized
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                    .replace('"', '&quot;')
                    .replace("'", '&#x27;')
                    .replace('/', '&#x2F;'))
        
        return sanitized
    
    def sanitize_data(self, data: Any) -> Any:
        """
        Sanitiza datos recursivamente
        """
        if isinstance(data, str):
            return self.sanitize_string(data)
        elif isinstance(data, dict):
            return {key: self.sanitize_data(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self.sanitize_data(item) for item in data]
        else:
            return data

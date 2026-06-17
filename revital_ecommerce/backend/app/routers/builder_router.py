"""
Router del CMS Builder (páginas).

Expone el constructor visual de páginas sobre `tab_cms_content`.

Rutas:
- GET    /builder/pages               (admin)   lista de páginas + metadatos.
- POST   /builder/pages               (admin)   crea una página nueva.
- GET    /builder/pages/{slug}        (admin)   detalle/borrador para el editor.
- PUT    /builder/pages/{slug}        (admin)   guarda el borrador.
- POST   /builder/pages/{slug}/publish(admin)   publica (borrador -> publicado).
- DELETE /builder/pages/{slug}        (admin)   elimina la página (home protegida).
- GET    /builder/public/{slug}       (público) versión publicada para el storefront.

Los GET admin se protegen con `require_admin()` a nivel de router (el middleware
solo exige admin en métodos de escritura sobre `/api/builder`). El GET público no
requiere autenticación.
"""
from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from core.dependencies import require_admin
from schemas.auth_schema import UserInToken
from schemas.builder_schema import (
    BuilderPageCreatePayload,
    BuilderPageDetail,
    BuilderPagePublic,
    BuilderPageSavePayload,
    BuilderPageSummary,
)
from schemas.cms_schema import ResponseMessage
from schemas.theme_schema import SiteThemeDetail, SiteThemePayload, SiteThemePublic
from services import builder_service, theme_service

router = APIRouter(tags=["CMS Builder"])


# ---------------------------------------------------------------------------
# Theme global + chrome (header/footer)
# ---------------------------------------------------------------------------
@router.get("/builder/theme", response_model=SiteThemeDetail)
async def get_builder_theme(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Borrador del theme global para el editor."""
    try:
        return theme_service.get_theme_detail(db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/builder/theme", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def save_builder_theme(
    payload: SiteThemePayload = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Guarda el borrador del theme global."""
    try:
        theme_service.save_theme_draft(db, payload, current_user.id_usuario)
        return ResponseMessage(message="Theme guardado correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/builder/theme/publish", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def publish_builder_theme(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Publica el theme global (borrador -> publicado)."""
    try:
        theme_service.publish_theme(db, current_user.id_usuario)
        return ResponseMessage(message="Theme publicado correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/builder/theme/public", response_model=SiteThemePublic | None)
async def get_public_builder_theme(db: Session = Depends(get_db)):
    """Theme publicado para el storefront. Devuelve null si no hay nada publicado."""
    try:
        return theme_service.get_public_theme(db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/builder/pages", response_model=list[BuilderPageSummary])
async def list_builder_pages(
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Lista las páginas del builder para el panel admin."""
    try:
        return builder_service.list_pages(db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/builder/pages", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_builder_page(
    payload: BuilderPageCreatePayload = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Crea una página nueva en estado borrador."""
    try:
        builder_service.create_page(db, payload, current_user.id_usuario)
        return ResponseMessage(message="Página creada correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/builder/pages/{slug}", response_model=BuilderPageDetail)
async def get_builder_page(
    slug: str,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Detalle/borrador de una página para el editor."""
    try:
        detail = builder_service.get_page_detail(db, slug)
        if detail is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Página no encontrada")
        return detail
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/builder/pages/{slug}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def save_builder_page(
    slug: str,
    payload: BuilderPageSavePayload = Body(...),
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Guarda el borrador de una página."""
    try:
        builder_service.save_draft(db, slug, payload, current_user.id_usuario)
        return ResponseMessage(message="Borrador guardado correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/builder/pages/{slug}/publish", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def publish_builder_page(
    slug: str,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Publica una página (copia el borrador a la versión publicada)."""
    try:
        builder_service.publish_page(db, slug, current_user.id_usuario)
        return ResponseMessage(message="Página publicada correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/builder/pages/{slug}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_builder_page(
    slug: str,
    db: Session = Depends(get_db),
    current_user: UserInToken = Depends(require_admin()),
):
    """Elimina una página (la home está protegida)."""
    try:
        builder_service.delete_page(db, slug, current_user.id_usuario)
        return ResponseMessage(message="Página eliminada correctamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/builder/public/{slug}", response_model=BuilderPagePublic | None)
async def get_public_builder_page(slug: str, db: Session = Depends(get_db)):
    """Versión publicada de una página para el storefront. Devuelve null si no existe."""
    try:
        return builder_service.get_public_page(db, slug)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

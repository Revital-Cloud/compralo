"""
Router para generación de descripciones de producto con IA en admin.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from core.dependencies import require_admin, UserInToken
from core.exceptions import get_safe_message, MSG_BAD_GATEWAY
from schemas.ai_description_schema import (
    GenerateProductDescriptionRequest,
    GenerateProductDescriptionResponse,
)
from services.admin_ai_service import generate_product_description
from services.groq_service import is_groq_available

router = APIRouter(tags=["AI Admin Description"])


@router.post(
    "/admin/ai/generate-product-description",
    response_model=GenerateProductDescriptionResponse,
    status_code=status.HTTP_200_OK,
)
async def post_generate_product_description(
    body: GenerateProductDescriptionRequest,
    _current_user: UserInToken = Depends(require_admin()),
):
    """Genera descripción comercial de producto con IA (sin tool-calling)."""
    if not is_groq_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La IA no está configurada. Añade GROQ_API_KEY al entorno.",
        )
    try:
        description = generate_product_description(
            name=body.name,
            category=body.category,
            brand=body.brand,
            attributes=body.attributes,
            tone=body.tone,
        )
        return {"description": description}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_safe_message(e) or "Datos inválidos para generar la descripción.",
        ) from e
    except RuntimeError as e:
        safe_message = get_safe_message(e) or ""
        status_code = (
            status.HTTP_503_SERVICE_UNAVAILABLE
            if "no está configurada" in safe_message.lower()
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(status_code=status_code, detail=safe_message or MSG_BAD_GATEWAY) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_safe_message(e),
        ) from e

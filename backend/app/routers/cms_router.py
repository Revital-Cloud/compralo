"""
Módulo de Routers de CMS Content

Define los endpoints de la API relacionados con el CMS Content.
Utiliza FastAPI para definir las rutas y los servicios de la API.
"""
import json
from typing import Dict,Any
from fastapi import APIRouter, Body,Depends,HTTPException,status,Form
from sqlalchemy.orm import Session
from schemas.cms_schema import Cms, CmsCreate,CmsUpdate,ResponseMessage
from services.cms_service import get_contents,get_content,create_cms_content,update_cms_content,delete_cms_content
from core.database import get_db

router = APIRouter(tags=["CMS Content"])

@router.get("/cms",response_model=list[Cms])
async def get_cms_contents(db:Session=Depends(get_db)):
    """
    Obtiene todos los CMS Content registrados en la base de datos.

    Args:
        db (Session): La sesión de base de datos SQLAlchemy.

    Returns:
        list[Cms]: Una lista de diccionarios, donde cada diccionario representa un CMS Content.
    """
    try:
        cms_contents = get_contents(db)
        if cms_contents is None:
            raise HTTPException(status_code=404,detail="No se encontraron CMS Content")
        return cms_contents
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))

@router.get("/cms/{id_cms_content}", response_model=Cms)
async def get_cms_content(id_cms_content:int,db:Session=Depends(get_db)):
    """
    Obtiene un CMS Content específico de la base de datos.

    Args:
        id_cms_content (int): El ID del CMS Content a obtener.
    """
    try:
        cms_content = get_content(db,id_cms_content)
        if cms_content is None:
            raise HTTPException(status_code=404,detail="CMS Content no encontrado")
        return cms_content
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))

@router.post("/cms",response_model=ResponseMessage,status_code=status.HTTP_201_CREATED)
async def create_cms_content_endpoint(
    cms_content:CmsCreate = Body(...),
    db:Session=Depends(get_db)
):
    """
    Crea un nuevo CMS Content en la base de datos.

    Args:
        cms_content (CmsCreate): El CMS Content a crear.
    """
    try:
        cms_content = CmsCreate(
            nom_cms_content=cms_content.nom_cms_content,
            des_cms_content=cms_content.des_cms_content,
            num_version=cms_content.num_version,
            ind_publicado=cms_content.ind_publicado
        )
        result = create_cms_content(db,cms_content)
        if not result:
            raise HTTPException(status_code=500,detail="Error al crear CMS Content en la base de datos")
        return ResponseMessage(message="CMS Content creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))
    
@router.put("/cms/{id_cms_content}",response_model=ResponseMessage,status_code=status.HTTP_200_OK)
async def update_cms_content_endpoint(
    id_cms_content:int,
    cms_content:CmsUpdate = Body(...),
    db:Session=Depends(get_db)):
    """
    Actualiza un CMS Content específico en la base de datos.
    """
    try:
        cms_content = CmsUpdate(
            nom_cms_content=cms_content.nom_cms_content,
            des_cms_content=cms_content.des_cms_content,
            num_version=cms_content.num_version,
            ind_publicado=cms_content.ind_publicado
        )
        result = update_cms_content(db,id_cms_content,cms_content)
        if not result:
            raise HTTPException(status_code=500,detail="Error al actualizar CMS Content en la base de datos")
        return ResponseMessage(message="CMS Content actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))

@router.delete("/cms/{id_cms_content}",response_model=ResponseMessage,status_code=status.HTTP_200_OK)
async def delete_cms_content_endpoint(id_cms_content:int,db:Session=Depends(get_db)):
    """
    Elimina un CMS Content específico de la base de datos.
    """
    try:
        result = delete_cms_content(db,id_cms_content)
        if not result:
            raise HTTPException(status_code=500,detail="Error al eliminar CMS Content en la base de datos")
        return ResponseMessage(message="CMS Content eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
    

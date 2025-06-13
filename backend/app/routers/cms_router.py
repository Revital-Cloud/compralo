"""
Módulo de Routers de CMS Content

Define los endpoints de la API relacionados con el CMS Content.
Utiliza FastAPI para definir las rutas y los servicios de la API.
"""
from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from schemas.cms_schema import Cms, CmsCreate,CmsUpdate,ResponseMessage
from services.cms_service import get_cms_contents,get_cms_content,create_cms_content,update_cms_content,delete_cms_content
from core.database import get_db

router = APIRouter(prefix="/cms",tags=["CMS Content"])

@router.get("/cms",response_model=list[Cms])
async def get_cms_contents(db:Session=Depends(get_db)):
    """
    Obtiene todos los CMS Content registrados en la base de datos.
    """
    cms_contents = get_cms_contents(db)
    return cms_contents

@router.get("/cms/{id_cms_content}", response_model=list[Cms])
async def get_cms_content(id_cms_content:int,db:Session=Depends(get_db)):
    """
    Obtiene un CMS Content específico de la base de datos.

    Args:
        id_cms_content (int): El ID del CMS Content a obtener.
    """
    try:
        cms_content = get_cms_content(db,id_cms_content)
        if cms_content is None:
            raise HTTPException(status_code=404,detail="CMS Content no encontrado")
        return cms_content
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))

@router.post("/cms",response_model=ResponseMessage,status_code=status.HTTP_201_CREATED)
async def create_cms_content(cms_content:CmsCreate,db:Session=Depends(get_db)):
    """
    Crea un nuevo CMS Content en la base de datos.

    Args:
        cms_content (CmsCreate): El CMS Content a crear.
    """
    try:
        create_cms_content(db,cms_content)
        return ResponseMessage(message="CMS Content creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
    
@router.put("/cms/{id_cms_content}",response_model=ResponseMessage,status_code=status.HTTP_200_OK)
async def update_cms_content(id_cms_content:int,cms_content:CmsUpdate,db:Session=Depends(get_db)):
    """
    Actualiza un CMS Content específico en la base de datos.
    """
    try:
        update_cms_content(db,id_cms_content,cms_content)
        return ResponseMessage(message="CMS Content actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))

@router.delete("/cms/{id_cms_content}",response_model=ResponseMessage,status_code=status.HTTP_200_OK)
async def delete_cms_content(id_cms_content:int,db:Session=Depends(get_db)):
    """
    Elimina un CMS Content específico de la base de datos.
    """
    try:
        delete_cms_content(db,id_cms_content)
        return ResponseMessage(message="CMS Content eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=400,detail=str(e))
    

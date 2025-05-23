
from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import Optional, Dict, Any
from datetime import datetime

from core.database import get_db
from schemas.users_schema import User, UserCreate, UserUpdate, ResponseMessage
from services import user_service

router = APIRouter()

@router.get("/users", response_model=list[User])
async def get_users(db: Session = Depends(get_db)):
    
    users = user_service.get_users(db)
    return users

@router.get("/users/{id_usuario}", response_model=User)
async def get_user(id_usuario: Decimal, db: Session = Depends(get_db)):
    
    user = user_service.get_user(db, id_usuario)
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.post("/users", response_model=ResponseMessage, status_code=status.HTTP_201_CREATED)
async def create_users(
    db: Session = Depends(get_db),
    id_usuario: str = Form(...),
    nom_usuario: str = Form(...),
    ape_usuario: str = Form(...),
    email_usuario: str = Form(...),
    password_usuario: str = Form(...),
    des_direccion: Optional[str] = Form(None),
    id_rol: Decimal = Form(...),
    ind_genero: bool = Form(...),
    cel_usuario: str = Form(...),
    fec_nacimiento: Optional[str] = Form(None)
):
    try:
        user_data = UserCreate(
            id_usuario=id_usuario,
            nom_usuario=nom_usuario,
            ape_usuario=ape_usuario,
            email_usuario=email_usuario,
            password_usuario=password_usuario,
            des_direccion=des_direccion,
            id_rol=id_rol,
            ind_genero=ind_genero,
            cel_usuario=cel_usuario,
            fec_nacimiento=fec_nacimiento
        )
        user_service.create_users(db,user_data)
        return ResponseMessage(message="Usuario creado exitosamente")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def update_user(
    id_usuario: Decimal,
    nom_usuario: str = Form(...),
    ape_usuario: str = Form(...),
    email_usuario: str = Form(...),
    password_usuario: str = Form(...),
    des_direccion: Optional[str] = Form(None),
    id_rol: Decimal = Form(...),
    ind_genero: bool = Form(...),
    cel_usuario: str = Form(...),
    fec_nacimiento: Optional[str] = (None),
    db: Session = Depends(get_db)
):     
    try:
        user_data = UserUpdate(
            id_usuario=id_usuario,
            nom_usuario=nom_usuario,
            ape_usuario=ape_usuario,
            email_usuario=email_usuario,
            password_usuario=password_usuario,
            des_direccion=des_direccion,
            id_rol=id_rol,
            ind_genero=ind_genero,
            cel_usuario=cel_usuario,
            fec_nacimiento=fec_nacimiento
        )
        user_service.update_user(db,id_usuario,user_data)
        return ResponseMessage(message="Usuario actualizado exitosamente")
    except Exception as e:
        raise HTTPException(status_Code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.delete("/users/{id_usuario}", response_model=ResponseMessage, status_code=status.HTTP_200_OK)
async def delete_user(id_usuario: Decimal, db: Session = Depends(get_db)):
    try:
        user_service.delete_user(db,id_usuario)
        return ResponseMessage(message="Usuario eliminado exitosamente")
    except Exception as e:
        raise HTTPException(status_Code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    

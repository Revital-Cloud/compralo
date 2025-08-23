"""
Servicio para la integración con la pasarela de pagos Wompi.

Este módulo encapsula toda la lógica de comunicación con la API de Wompi,
incluyendo la creación de fuentes de pago (tokenización de tarjetas),
la generación de transacciones y el manejo de webhooks.
"""
import httpx
from typing import Dict, Any, Optional
from fastapi import HTTPException

from core.config import settings

class WompiService:
    def __init__(self):
        self.base_url = f"https://{settings.WOMPI_ENVIRONMENT}.wompi.co/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.WOMPI_PRIVATE_KEY}",
            "Content-Type": "application/json"
        }
        self.private_key = settings.WOMPI_PRIVATE_KEY

    async def _request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint}"
        headers = {"Authorization": f"Bearer {self.private_key}"}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, url, json=data, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                print(f"Error de Wompi: {e.response.status_code} - {e.response.text}")
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Error en la API de Wompi: {e.response.text}"
                )
            except Exception as e:
                print(f"Error inesperado en Wompi Service: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="Error interno al comunicarse con Wompi"
                )

    async def create_payment_source(self, user_email: str, card_token: str) -> Dict[str, Any]:
        """
        Crea una fuente de pago (tarjeta) para un cliente en Wompi.
        """
        acceptance_token_data = await self.get_acceptance_token()
        acceptance_token = acceptance_token_data["data"]["presigned_acceptance"]["acceptance_token"]

        return await self._request(
            method="post",
            endpoint=f"payment_sources",
            data={
                "type": "CARD",
                "token": card_token,
                "customer_email": user_email,
                "acceptance_token": acceptance_token,
            },
        )

    async def get_acceptance_token(self) -> Dict[str, Any]:
        """
        Obtiene un token de aceptación necesario para crear fuentes de pago.
        Este token se obtiene consultando las llaves del comercio.
        """
        endpoint = f"merchants/{settings.WOMPI_PUBLIC_KEY}"
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/{endpoint}"
            response = await client.get(url)
            response.raise_for_status()
            return response.json()

    async def create_transaction(
        self,
        amount_in_cents: int,
        customer_email: str,
        payment_source_id: str,
        reference: str
    ) -> Dict[str, Any]:
        """
        Crea una transacción (un cobro) utilizando una fuente de pago ya existente.

        Args:
            amount_in_cents: El monto a cobrar en centavos.
            customer_email: Email del cliente.
            payment_source_id: El ID de la tarjeta guardada en Wompi.
            reference: Una referencia única para la transacción (ej. el ID de la orden).

        Returns:
            Un diccionario con la respuesta de la API de Wompi.
        """
        endpoint = f"{self.base_url}/transactions"
        payload = {
            "amount_in_cents": amount_in_cents,
            "currency": "COP",
            "customer_email": customer_email,
            "payment_method": {
                "type": "CARD",
                "payment_source_id": payment_source_id,
                # Las cuotas pueden ser un parámetro opcional en el futuro
                "installments": 1,
            },
            "reference": reference,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()


# Instancia global del servicio
wompi_service = WompiService() 
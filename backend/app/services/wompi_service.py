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
import hashlib


class WompiService:
    def __init__(self):
        self.base_url = f"https://{settings.WOMPI_ENVIRONMENT}.wompi.co/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.WOMPI_PRIVATE_KEY}",
            "Content-Type": "application/json"
        }

    async def _request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint}"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, url, json=data, headers=self.headers)
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
                    detail="Error inesperado al comunicarse con Wompi"
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

    def _build_signature(self, reference: str, amount_in_cents: int, currency: str) -> str:
        payload = f"{reference}{amount_in_cents}{currency}{settings.WOMPI_INTEGRITY_SECRET}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    async def create_transaction(
        self,
        amount_in_cents: int,
        customer_email: str,
        payment_source_id: str,
        reference: str
    ) -> Dict[str, Any]:
        """
        Crea una transacción (un cobro) utilizando una fuente de pago ya existente.
        """
        currency = "COP"
        signature = self._build_signature(reference, amount_in_cents, currency)

        endpoint = f"transactions"
        payload = {
            "amount_in_cents": amount_in_cents,
            "currency": currency,
            "customer_email": customer_email,
            # En pagos con fuente guardada, el payment_source_id va al nivel raíz
            "payment_source_id": payment_source_id,
            "reference": reference,
            "signature": signature,
            # Parámetros adicionales del método de pago
            "payment_method": {
                "type": "CARD",
                "installments": 1,
            },
        }

        return await self._request("post", endpoint, data=payload)

    async def get_transaction(self, transaction_id: str) -> Dict[str, Any]:
        """Obtiene el detalle de una transacción por id."""
        endpoint = f"transactions/{transaction_id}"
        return await self._request("get", endpoint)


# Instancia global del servicio
wompi_service = WompiService() 
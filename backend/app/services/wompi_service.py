"""
Servicio para la integración con la pasarela de pagos Wompi.

Este módulo encapsula toda la lógica de comunicación con la API de Wompi,
incluyendo la creación de fuentes de pago (tokenización de tarjetas),
la generación de transacciones y el manejo de webhooks.
"""
import httpx
from typing import Dict, Any

from core.config import settings

class WompiService:
    def __init__(self):
        self.base_url = "https://sandbox.wompi.co/v1"
        self.headers = {
            "Authorization": f"Bearer {settings.WOMPI_PRIVATE_KEY}",
            "Content-Type": "application/json"
        }

    async def create_payment_source(self, user_email: str, card_token: str) -> Dict[str, Any]:
        """
        Crea una fuente de pago (guarda una tarjeta) para un cliente en Wompi.

        Args:
            user_email: El email del usuario, que Wompi usa para identificar al cliente.
            card_token: El token de la tarjeta generado por el frontend.

        Returns:
            Un diccionario con la respuesta de la API de Wompi.
        """
        endpoint = f"{self.base_url}/payment_sources"
        payload = {
            "type": "CARD",
            "token": card_token,
            "customer_email": user_email,
            "acceptance_token": await self.get_acceptance_token() # Es requerido por Wompi
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()  # Lanza una excepción si la respuesta es un error HTTP
            return response.json()

    async def get_acceptance_token(self) -> str:
        """
        Obtiene el token de aceptación necesario para crear fuentes de pago.
        Este token se obtiene consultando las llaves del comercio.
        """
        endpoint = f"{self.base_url}/merchants/{settings.WOMPI_PUBLIC_KEY}"
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint)
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}).get("presigned_acceptance", {}).get("acceptance_token")

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
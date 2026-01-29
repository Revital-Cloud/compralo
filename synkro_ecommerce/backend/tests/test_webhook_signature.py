"""
Tests para la verificación de firma de webhook de Wompi.
"""
import pytest
import json
import hashlib
import hmac
from routers.payment_router import _verify_webhook_signature, _get_nested_value


def test_get_nested_value():
    """Test que _get_nested_value obtiene valores anidados correctamente."""
    data = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "123456789",
                "status": "APPROVED"
            }
        }
    }
    
    assert _get_nested_value(data, "event") == "transaction.updated"
    assert _get_nested_value(data, "data.transaction.id") == "123456789"
    assert _get_nested_value(data, "data.transaction.status") == "APPROVED"
    assert _get_nested_value(data, "data.transaction.nonexistent") == ""
    assert _get_nested_value(data, "nonexistent.path") == ""


def test_verify_webhook_signature_valid():
    """Test que la verificación de firma funciona con payload válido."""
    events_secret = "test_events_secret_123"
    
    payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "123456789",
                "status": "APPROVED"
            }
        },
        "signature": {
            "properties": ["event", "data.transaction.id", "data.transaction.status"],
            "timestamp": "1234567890",
            "checksum": ""  # Se calculará
        }
    }
    
    # Calcular checksum correcto
    values_to_hash = [
        "transaction.updated",  # event
        "123456789",  # data.transaction.id
        "APPROVED",  # data.transaction.status
        "1234567890",  # timestamp
        events_secret
    ]
    string_to_hash = "".join(values_to_hash)
    expected_checksum = hashlib.sha256(string_to_hash.encode("utf-8")).hexdigest()
    
    payload["signature"]["checksum"] = expected_checksum
    
    result = _verify_webhook_signature(
        payload=payload,
        signature_data=payload["signature"],
        events_secret=events_secret
    )
    
    assert result is True


def test_verify_webhook_signature_invalid():
    """Test que la verificación de firma rechaza payload inválido."""
    events_secret = "test_events_secret_123"
    
    payload = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "123456789",
                "status": "APPROVED"
            }
        },
        "signature": {
            "properties": ["event", "data.transaction.id", "data.transaction.status"],
            "timestamp": "1234567890",
            "checksum": "invalid_checksum_123"
        }
    }
    
    result = _verify_webhook_signature(
        payload=payload,
        signature_data=payload["signature"],
        events_secret=events_secret
    )
    
    assert result is False


def test_verify_webhook_signature_missing_properties():
    """Test que la verificación falla si faltan properties."""
    events_secret = "test_events_secret_123"
    
    payload = {
        "event": "transaction.updated",
        "signature": {
            "timestamp": "1234567890",
            "checksum": "some_checksum"
            # Falta "properties"
        }
    }
    
    result = _verify_webhook_signature(
        payload=payload,
        signature_data=payload["signature"],
        events_secret=events_secret
    )
    
    assert result is False


def test_verify_webhook_signature_different_order():
    """Test que el orden de properties importa."""
    events_secret = "test_events_secret_123"
    
    # Checksum con orden: event, id, status
    values1 = ["transaction.updated", "123456789", "APPROVED", "1234567890", events_secret]
    checksum1 = hashlib.sha256("".join(values1).encode("utf-8")).hexdigest()
    
    # Checksum con orden diferente: id, event, status
    values2 = ["123456789", "transaction.updated", "APPROVED", "1234567890", events_secret]
    checksum2 = hashlib.sha256("".join(values2).encode("utf-8")).hexdigest()
    
    assert checksum1 != checksum2  # Diferentes órdenes producen diferentes checksums


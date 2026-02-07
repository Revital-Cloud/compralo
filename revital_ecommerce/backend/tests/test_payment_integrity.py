"""
Tests para la generación de firma integrity de Wompi.
"""
import pytest
from services.payment_widget_service import generate_integrity_signature


def test_generate_integrity_signature():
    """Test que la firma integrity se genera correctamente."""
    reference = "revital_123_a1b2c3d4e5"
    amount_in_cents = 100000
    currency = "COP"
    integrity_secret = "test_secret_123"
    
    signature = generate_integrity_signature(
        reference=reference,
        amount_in_cents=amount_in_cents,
        currency=currency,
        integrity_secret=integrity_secret
    )
    
    # Verificar que la firma es un string hexadecimal de 64 caracteres (SHA256)
    assert isinstance(signature, str)
    assert len(signature) == 64
    assert all(c in '0123456789abcdef' for c in signature)
    
    # Verificar que la misma entrada produce la misma firma (determinista)
    signature2 = generate_integrity_signature(
        reference=reference,
        amount_in_cents=amount_in_cents,
        currency=currency,
        integrity_secret=integrity_secret
    )
    assert signature == signature2
    
    # Verificar que diferentes entradas producen diferentes firmas
    signature3 = generate_integrity_signature(
        reference="revital_456_a1b2c3d4e5",
        amount_in_cents=amount_in_cents,
        currency=currency,
        integrity_secret=integrity_secret
    )
    assert signature != signature3


def test_integrity_signature_format():
    """Test que la firma sigue el formato esperado por Wompi."""
    reference = "revital_123_a1b2c3d4e5"
    amount_in_cents = 100000
    currency = "COP"
    integrity_secret = "test_secret_123"
    
    signature = generate_integrity_signature(
        reference=reference,
        amount_in_cents=amount_in_cents,
        currency=currency,
        integrity_secret=integrity_secret
    )
    
    # Formato: sha256(reference + amount_in_cents + currency + integrity_secret)
    # Debe ser un hash SHA256 en hexadecimal
    assert len(signature) == 64  # SHA256 produce 64 caracteres hex
    assert signature.isalnum() or all(c in '0123456789abcdef' for c in signature)


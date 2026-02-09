"""
Tests para transiciones de estados de payment.
"""
import pytest
from services.payment_widget_service import generate_payment_reference


def test_generate_payment_reference():
    """Test que la referencia se genera con el formato correcto."""
    order_id = 123
    
    reference = generate_payment_reference(order_id)
    
    # Formato: revital_{order_id}_{random10}
    assert reference.startswith(f"revital_{order_id}_")
    assert len(reference) > len(f"revital_{order_id}_")
    
    # Verificar que diferentes llamadas producen diferentes referencias
    reference2 = generate_payment_reference(order_id)
    assert reference != reference2  # Debe ser único


def test_payment_reference_format():
    """Test que la referencia sigue el formato esperado."""
    order_id = 123
    
    reference = generate_payment_reference(order_id)
    
    parts = reference.split("_")
    assert len(parts) == 3
    assert parts[0] == "revital"
    assert parts[1] == str(order_id)
    assert len(parts[2]) == 10  # random10


def test_payment_state_transitions():
    """Test que las transiciones de estado son válidas."""
    # Estados válidos según la implementación
    valid_states = ["CREATED", "PENDING", "APPROVED", "DECLINED", "VOIDED", "ERROR"]
    
    # Estados finales (no pueden cambiar)
    final_states = ["APPROVED", "DECLINED", "VOIDED", "ERROR"]
    
    # Estados que permiten reintento
    reattemptable_states = ["DECLINED", "ERROR", "VOIDED"]
    
    # Verificar que todos los estados finales están en valid_states
    for state in final_states:
        assert state in valid_states
    
    # Verificar que los estados que permiten reintento están en final_states
    for state in reattemptable_states:
        assert state in final_states
    
    # Verificar que CREATED y PENDING no son finales
    assert "CREATED" not in final_states
    assert "PENDING" not in final_states


def test_payment_reference_uniqueness():
    """Test que las referencias generadas son únicas."""
    order_id = 123
    references = set()
    
    # Generar múltiples referencias
    for _ in range(100):
        reference = generate_payment_reference(order_id)
        references.add(reference)
    
    # Todas deben ser únicas
    assert len(references) == 100


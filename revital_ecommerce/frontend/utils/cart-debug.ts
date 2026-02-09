/**
 * Utilidades de debug para el carrito
 */

/**
 * Limpia completamente los datos del carrito del localStorage
 */
export function clearCartStorage() {
  try {
    localStorage.removeItem('revital-cart-storage');
    console.log('✅ Datos del carrito limpiados del localStorage');
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar localStorage:', error);
    return false;
  }
}

/**
 * Muestra el estado actual del carrito en localStorage
 */
export function debugCartStorage() {
  try {
    const cartData = localStorage.getItem('revital-cart-storage');
    if (cartData) {
      const parsed = JSON.parse(cartData);
      console.log('🛒 Estado actual del carrito en localStorage:', parsed);
      return parsed;
    } else {
      console.log('🛒 No hay datos del carrito en localStorage');
      return null;
    }
  } catch (error) {
    console.error('❌ Error al leer localStorage:', error);
    return null;
  }
}

/**
 * Resetea completamente el carrito (localStorage + sessionStorage)
 */
export function resetAllCartData() {
  try {
    // Limpiar localStorage
    localStorage.removeItem('revital-cart-storage');
    
    // Limpiar posibles session IDs
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('cart') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Todos los datos del carrito han sido limpiados');
    
    // Recargar la página para resetear completamente el estado
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('❌ Error al resetear datos del carrito:', error);
    return false;
  }
}

// Exponer funciones globalmente para debug en consola
if (typeof window !== 'undefined') {
  (window as any).cartDebug = {
    clearStorage: clearCartStorage,
    debugStorage: debugCartStorage,
    resetAll: resetAllCartData
  };
  
  console.log('🛠️ Funciones de debug del carrito disponibles:');
  console.log('- cartDebug.clearStorage() - Limpia localStorage');
  console.log('- cartDebug.debugStorage() - Muestra estado actual');
  console.log('- cartDebug.resetAll() - Resetea todo y recarga');
}

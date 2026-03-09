import { useState, useEffect } from 'react'

export interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export interface CookieConsent {
  accepted: boolean
  preferences: CookiePreferences
  timestamp: number
}

export function useCookies() {
  // Estado inicial null para evitar diferencias SSR
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Solo cargar cookies después de la hidratación. Primera visita = no guardar nada, el banner se muestra.
  useEffect(() => {
    const loadCookiePreferences = () => {
      try {
        const accepted = localStorage.getItem('cookies-accepted')
        const preferences = localStorage.getItem('cookies-preferences')
        
        if (accepted && preferences) {
          setCookieConsent({
            accepted: true,
            preferences: JSON.parse(preferences),
            timestamp: Date.now()
          })
        } else {
          // Primera vez: no hay decisión guardada → dejar null para que el banner se muestre
          setCookieConsent(null)
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error)
        setCookieConsent(null)
      } finally {
        setIsHydrated(true)
      }
    }

    loadCookiePreferences()
  }, [])

  const acceptAllCookies = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    }
    
    const consent: CookieConsent = {
      accepted: true,
      preferences,
      timestamp: Date.now()
    }
    
    
    localStorage.setItem('cookies-accepted', 'true')
    localStorage.setItem('cookies-preferences', JSON.stringify(preferences))
    setCookieConsent(consent)
  }

  const acceptNecessaryOnly = () => {
    const preferences: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    }
    
    const consent: CookieConsent = {
      accepted: true,
      preferences,
      timestamp: Date.now()
    }
    
    
    localStorage.setItem('cookies-accepted', 'true')
    localStorage.setItem('cookies-preferences', JSON.stringify(preferences))
    setCookieConsent(consent)
  }

  const updateCookiePreferences = (newPreferences: Partial<CookiePreferences>) => {
    // Base: si no hay consentimiento previo, partimos de solo necesarias activas
    const basePreferences: CookiePreferences = cookieConsent?.preferences ?? {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }

    const updatedPreferences: CookiePreferences = { ...basePreferences, ...newPreferences }
    const updatedConsent: CookieConsent = {
      accepted: true,
      preferences: updatedPreferences,
      timestamp: Date.now(),
    }

    localStorage.setItem('cookies-accepted', 'true')
    localStorage.setItem('cookies-preferences', JSON.stringify(updatedPreferences))
    setCookieConsent(updatedConsent)
  }

  const revokeConsent = () => {
    localStorage.removeItem('cookies-accepted')
    localStorage.removeItem('cookies-preferences')
    setCookieConsent(null)
  }

  const canUseCookie = (type: keyof CookiePreferences): boolean => {
    // Si no está hidratado, permitir solo cookies necesarias para que el sitio funcione
    if (!isHydrated && type === 'necessary') {
      return true
    }
    // Primera visita (cookieConsent null): solo permitir necesarias hasta que acepte el banner
    if (!cookieConsent?.accepted) {
      return type === 'necessary'
    }
    return cookieConsent.preferences[type]
  }

  // Función para verificar cookies en tiempo real desde localStorage
  const checkCookiesInRealTime = () => {
    // Solo verificar si ya está hidratado
    if (!isHydrated) return null
    
    try {
      const accepted = localStorage.getItem('cookies-accepted')
      const preferences = localStorage.getItem('cookies-preferences')
      
      if (accepted && preferences) {
        return {
          accepted: true,
          preferences: JSON.parse(preferences),
          timestamp: Date.now()
        }
      }
    } catch (error) {
      console.error('Error checking cookies in real time:', error)
    }
    return null
  }

  return {
    cookieConsent,
    isLoading: !isHydrated,
    isHydrated,
    acceptAllCookies,
    acceptNecessaryOnly,
    updateCookiePreferences,
    revokeConsent,
    canUseCookie,
    checkCookiesInRealTime
  }
}

"use client"

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

  // Solo cargar cookies después de la hidratación
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
          // Si no hay cookies configuradas, establecer cookies necesarias por defecto
          // para evitar problemas de acceso a funcionalidades básicas
          const defaultPreferences: CookiePreferences = {
            necessary: true,
            functional: false,
            analytics: false,
            marketing: false
          }
          
          setCookieConsent({
            accepted: true,
            preferences: defaultPreferences,
            timestamp: Date.now()
          })
          
          // Guardar en localStorage
          localStorage.setItem('cookies-accepted', 'true')
          localStorage.setItem('cookies-preferences', JSON.stringify(defaultPreferences))
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error)
        // En caso de error, establecer cookies necesarias por defecto
        const defaultPreferences: CookiePreferences = {
          necessary: true,
          functional: false,
          analytics: false,
          marketing: false
        }
        
        setCookieConsent({
          accepted: true,
          preferences: defaultPreferences,
          timestamp: Date.now()
        })
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
    if (!cookieConsent) return
    
    const updatedPreferences = { ...cookieConsent.preferences, ...newPreferences }
    const updatedConsent: CookieConsent = {
      ...cookieConsent,
      preferences: updatedPreferences,
      timestamp: Date.now()
    }
    
    localStorage.setItem('cookies-preferences', JSON.stringify(updatedPreferences))
    setCookieConsent(updatedConsent)
  }

  const revokeConsent = () => {
    localStorage.removeItem('cookies-accepted')
    localStorage.removeItem('cookies-preferences')
    setCookieConsent(null)
  }

  const canUseCookie = (type: keyof CookiePreferences): boolean => {
    // Si no está hidratado, permitir cookies necesarias por defecto
    if (!isHydrated && type === 'necessary') {
      return true
    }
    
    if (!cookieConsent?.accepted) return false
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


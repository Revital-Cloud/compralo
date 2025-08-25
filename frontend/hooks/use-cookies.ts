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
  const [cookieConsent, setCookieConsent] = useState<CookieConsent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar preferencias de cookies desde localStorage
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
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error)
      } finally {
        setIsLoading(false)
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
    if (!cookieConsent?.accepted) return false
    return cookieConsent.preferences[type]
  }

  return {
    cookieConsent,
    isLoading,
    acceptAllCookies,
    acceptNecessaryOnly,
    updateCookiePreferences,
    revokeConsent,
    canUseCookie
  }
}

'use client'

import { useEffect } from 'react'
import PWAInstallButton from './PWAInstallButton'

export default function PWASetup() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      }).then(registration => {
        console.log('Service Worker registered:', registration)

        // Check for updates periodically (every hour)
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }).catch(error => {
        console.log('Service Worker registration failed:', error)
      })
    }

    // Set theme color based on system preference
    const updateThemeColor = () => {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const themeColor = document.querySelector('meta[name="theme-color"]')
      if (themeColor) {
        themeColor.setAttribute('content', isDark ? '#050816' : '#ffffff')
      }
    }

    updateThemeColor()
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor)

    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateThemeColor)
    }
  }, [])

  return <PWAInstallButton />
}

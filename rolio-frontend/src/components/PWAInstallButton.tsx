'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectIOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  // iPadOS 13+ reports as Mac; touch points distinguish iPad from Mac
  const isIPad =
    /iPad/.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))
  return (
    (isIPad || /iPhone|iPod/.test(ua)) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}

export default function PWAInstallButton() {
  const [mounted, setMounted] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setMounted(true)

    const ios = detectIOS()
    setIsIOS(ios)

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone || (window.navigator as Navigator & { standalone?: boolean }).standalone) {
      setIsInstalled(true)
      setIsVisible(false)
      return
    }

    // iOS has no beforeinstallprompt — show manual Add to Home Screen guide
    if (ios) {
      setIsVisible(true)
    }

    // Listen for install prompt event (Android/Web)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsVisible(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
      }

      setIsVisible(false)
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Installation failed:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  // Avoid SSR/hydration flash; state is set in useEffect on the client
  if (!mounted || isInstalled) {
    return null
  }

  // iOS manual install prompt
  if (isIOS) {
    return (
      <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-4 left-4 right-4 z-50 rounded-lg glass p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Install ROLIO</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap Share → Add to Home Screen to install
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    )
  }

  // Android/Web install button
  return (
    <AnimatePresence>
        {isVisible && deferredPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:left-6 sm:right-auto sm:w-auto"
          >
            <div className="glass rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Install ROLIO for quick access
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Install
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                >
                  Not now
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  )
}

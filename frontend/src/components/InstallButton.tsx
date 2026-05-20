'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const beforeInstallPromptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(beforeInstallPromptEvent)
      setShowInstall(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted install')
        setIsInstalled(true)
        setShowInstall(false)
      } else {
        console.log('User dismissed install')
      }
    } catch (error) {
      console.error('Installation error:', error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowInstall(false)
  }

  // Don't show if already installed
  if (isInstalled || !showInstall || !deferredPrompt) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="cyber-glass border border-cyan-500/40 rounded-xl p-4 md:p-6 max-w-sm shadow-2xl"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              className="text-3xl flex-shrink-0 pt-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📱
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-bold text-cyan-300 mb-1">Install Rolio</h3>
              <p className="text-sm text-slate-400 mb-4">
                Get Rolio on your home screen for quick access and offline support!
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isInstalling ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      Installing...
                    </>
                  ) : (
                    <>
                      <span>⬇️</span>
                      Install
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Later
                </motion.button>
              </div>
            </div>

            {/* Close button */}
            <motion.button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-300 flex-shrink-0 text-xl"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

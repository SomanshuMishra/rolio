'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { createContext, useContext, useState, ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toastStyles = {
  success: 'bg-green-500/10 border-green-500/50 text-green-400',
  error: 'bg-red-500/10 border-red-500/50 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
}

const toastIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

let toastCounter = 0

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${++toastCounter}`
    const newToast = { id, message, type, duration }
    setToasts((prev) => [...prev, newToast])

    if (duration) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`border rounded-lg p-4 flex items-center gap-3 ${toastStyles[toast.type]} pointer-events-auto`}
          >
            <span className="text-lg">{toastIcons[toast.type]}</span>
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

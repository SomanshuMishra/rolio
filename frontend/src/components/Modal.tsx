'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  actions?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }[]
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
}

const buttonStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-[#0f172a]',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-[#0f172a]',
  danger: 'bg-red-600 hover:bg-red-700 text-[#0f172a]',
}

export default function Modal({ isOpen, onClose, title, children, actions }: ModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 bg-[#f8f7ff]/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-white to-white border border-gray-100 rounded-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            {title && (
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-4">{children}</div>

            {/* Actions */}
            {actions && actions.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                {actions.map((action, idx) => (
                  <motion.button
                    key={idx}
                    onClick={action.onClick}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${buttonStyles[action.variant || 'primary']}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface AnimatedInputProps {
  label: string
  type?: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
}

export default function AnimatedInput({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  icon,
  required = false,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 group-focus-within:text-cyan-300">
            {icon}
          </div>
        )}

        {/* Input field - Dark Cyberpunk */}
        <motion.input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 ${
            icon ? 'pl-12' : ''
          } bg-slate-900/60 border rounded-lg text-cyan-50 placeholder-slate-500 focus:outline-none transition-all duration-300 ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
              : isFocused
                ? 'border-cyan-500 bg-slate-900/80 ring-4 ring-cyan-500/20'
                : 'border-cyan-900/50 hover:border-cyan-700/50'
          }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(6, 182, 212, 0.4), inset 0 0 10px rgba(6, 182, 212, 0.1)'
              : '0 0 0px rgba(6, 182, 212, 0)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Floating label */}
        <motion.label
          htmlFor={name}
          className="absolute left-4 pointer-events-none origin-left"
          animate={{
            y: value || isFocused ? -24 : 12,
            scale: value || isFocused ? 0.85 : 1,
            color: error ? 'rgb(239, 68, 68)' : isFocused ? 'rgb(6, 182, 212)' : 'rgb(148, 163, 184)',
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>

        {/* Error message */}
        <motion.p
          className="text-red-400 text-sm mt-2 h-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: error ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      </div>
    </motion.div>
  )
}

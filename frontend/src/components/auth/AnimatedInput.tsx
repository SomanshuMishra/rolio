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
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 group-focus-within:text-purple-500">
            {icon}
          </div>
        )}

        {/* Input field */}
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
          } bg-white border border-pink-100 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-300 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
              : isFocused
                ? 'border-purple-300 bg-white ring-4 ring-purple-50'
                : 'hover:border-purple-200'
          }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(217, 165, 245, 0.15)'
              : '0 0 0px rgba(217, 165, 245, 0)',
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
            color: error ? 'rgb(239, 68, 68)' : isFocused ? 'rgb(217, 165, 245)' : 'rgb(120, 113, 108)',
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </motion.label>

        {/* Error message */}
        <motion.p
          className="text-red-500 text-sm mt-2 h-5"
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

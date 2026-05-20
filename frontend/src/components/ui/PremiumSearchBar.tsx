'use client'

import { motion } from 'framer-motion'
import { useState, useRef } from 'react'

interface PremiumSearchBarProps {
  onSearch: (value: string) => void
  isSearching?: boolean
  placeholder?: string
}

export default function PremiumSearchBar({
  onSearch,
  isSearching = false,
  placeholder = 'Scanning for opportunities...',
}: PremiumSearchBarProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const isSubmittingRef = useRef(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim() && !isSubmittingRef.current && !isSearching) {
      isSubmittingRef.current = true
      onSearch(value)
      // Reset flag after search starts
      setTimeout(() => {
        isSubmittingRef.current = false
      }, 100)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="relative">
        {/* Glow Background */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 blur-xl"
          animate={{
            opacity: isFocused || isSearching ? 0.8 : 0.3,
            scale: isFocused || isSearching ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Glass Container */}
        <motion.div
          className="relative bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40 backdrop-blur-xl border border-cyan-500/40 rounded-2xl px-6 py-4 transition-all"
          animate={{
            borderColor: isFocused || isSearching ? 'rgba(34, 211, 238, 0.8)' : 'rgba(34, 211, 238, 0.4)',
            boxShadow: isFocused || isSearching ? '0 0 30px rgba(34, 211, 238, 0.3)' : '0 0 15px rgba(139, 92, 246, 0.1)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <motion.span
              className="text-xl text-cyan-400"
              animate={{ rotate: isSearching ? 360 : 0 }}
              transition={{ duration: isSearching ? 1 : 0, repeat: isSearching ? Infinity : 0 }}
            >
              🔍
            </motion.span>

            {/* Input */}
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isSearching}
              className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-lg font-medium disabled:opacity-50"
            />

            {/* Scan Line Animation */}
            {isSearching && (
              <motion.div
                className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
                animate={{ x: [0, 200, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSearching || !value.trim()}
              className="flex-shrink-0 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={!isSearching ? { scale: 1.05 } : {}}
              whileTap={!isSearching ? { scale: 0.95 } : {}}
            >
              {isSearching ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ⚡
                </motion.span>
              ) : (
                'Search'
              )}
            </motion.button>
          </div>

          {/* Animated Border Accent */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full"
            animate={{
              width: isFocused || isSearching ? '100%' : '0%',
              opacity: isFocused || isSearching ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>

      {/* Helper Text */}
      <motion.p
        className="mt-3 text-center text-xs text-slate-500 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {isSearching ? '🛰️ Scanning across multiple job sources...' : '💫 Enter keywords to find your perfect match'}
      </motion.p>
    </motion.form>
  )
}

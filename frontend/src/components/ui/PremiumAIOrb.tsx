'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

interface PremiumAIOrbProps {
  state: 'idle' | 'thinking' | 'searching' | 'success'
  onClick?: () => void
}

export default function PremiumAIOrb({ state, onClick }: PremiumAIOrbProps) {
  const [orbPos, setOrbPos] = useState({ x: 0, y: 0 })
  const orbRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbRef.current) return

      const now = Date.now()
      if (now - lastUpdateRef.current < 32) return // ~30fps for mouse tracking
      lastUpdateRef.current = now

      const rect = orbRef.current.getBoundingClientRect()
      const orbCenterX = rect.left + rect.width / 2
      const orbCenterY = rect.top + rect.height / 2

      const dx = e.clientX - orbCenterX
      const dy = e.clientY - orbCenterY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDistance = 100

      if (distance < maxDistance) {
        const angle = Math.atan2(dy, dx)
        const moveDistance = (1 - distance / maxDistance) * 20
        posRef.current = {
          x: Math.cos(angle) * moveDistance,
          y: Math.sin(angle) * moveDistance,
        }
        setOrbPos(posRef.current)
      } else if (posRef.current.x !== 0 || posRef.current.y !== 0) {
        posRef.current = { x: 0, y: 0 }
        setOrbPos({ x: 0, y: 0 })
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getStateVariant = () => {
    switch (state) {
      case 'thinking':
        return {
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9],
        }
      case 'searching':
        return {
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }
      case 'success':
        return {
          scale: [1, 1.15, 1],
        }
      default:
        return {
          y: [0, -10, 0],
        }
    }
  }

  const getGlowColor = () => {
    switch (state) {
      case 'thinking':
        return 'from-purple-500 to-cyan-500'
      case 'searching':
        return 'from-cyan-500 to-purple-500'
      case 'success':
        return 'from-cyan-400 to-blue-400'
      default:
        return 'from-purple-500/60 to-cyan-500/60'
    }
  }

  return (
    <motion.div
      ref={orbRef}
      className="fixed bottom-8 right-8 z-50 cursor-pointer"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: 'spring' }}
      style={{ x: orbPos.x, y: orbPos.y }}
      onClick={onClick}
    >
      {/* Outer Glow Ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: state === 'searching' ? `0 0 40px rgba(34, 211, 238, 0.6)` :
                     state === 'success' ? `0 0 40px rgba(34, 211, 238, 0.8)` :
                     `0 0 30px rgba(139, 92, 246, 0.4)`,
        }}
        animate={getStateVariant()}
        transition={{
          duration: state === 'idle' ? 3 : state === 'thinking' ? 1.5 : 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Holographic Ring 1 */}
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-400/40"
        animate={{
          rotate: state === 'searching' ? 360 : 180,
          borderColor: state === 'searching' ? 'rgba(34, 211, 238, 0.6)' : 'rgba(34, 211, 238, 0.2)',
        }}
        transition={{
          rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
          borderColor: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Holographic Ring 2 */}
      <motion.div
        className="absolute inset-2 rounded-full border border-purple-400/30"
        animate={{
          rotate: state === 'searching' ? -360 : -180,
          borderColor: state === 'searching' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.15)',
        }}
        transition={{
          rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
          borderColor: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Core Orb */}
      <motion.div
        className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${getGlowColor()} flex items-center justify-center overflow-hidden`}
        animate={getStateVariant()}
        transition={{
          duration: state === 'idle' ? 3 : state === 'thinking' ? 1.5 : 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner Glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

        {/* Center Icon */}
        <motion.span
          className="text-3xl relative z-10"
          animate={{
            scale: state === 'success' ? [1, 1.2, 1] : [1],
            rotate: state === 'searching' ? 360 : 0,
          }}
          transition={{
            scale: { duration: 0.6, repeat: Infinity },
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          }}
        >
          ✨
        </motion.span>

        {/* Particle Aura */}
        {(state === 'thinking' || state === 'searching') && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-300 rounded-full"
                animate={{
                  x: Math.cos((i / 6) * Math.PI * 2) * 40,
                  y: Math.sin((i / 6) * Math.PI * 2) * 40,
                  opacity: [0.6, 0.2, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: (i / 6) * 0.3,
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Floating Label */}
      <motion.div
        className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs font-bold text-cyan-300 whitespace-nowrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {state === 'idle' ? 'AI Assistant' : state === 'thinking' ? 'Thinking...' : state === 'searching' ? 'Searching...' : 'Ready!'}
      </motion.div>
    </motion.div>
  )
}

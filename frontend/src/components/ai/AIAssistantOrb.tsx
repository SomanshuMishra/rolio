'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import {
  ORB_COLORS,
  STATUS_MESSAGES,
  auraVariants,
  orbCoreVariants,
  ringVariants,
  shimmerVariants,
  statusChipVariants,
  energyBeamVariants,
} from './OrbAnimations'

interface AIAssistantOrbProps {
  isThinking: boolean
  isSearching: boolean
  isSuccess?: boolean
  onClick: () => void
  matchCount?: number
  size?: number
  position?: 'bottom-right' | 'bottom-left'
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  radius: number
  color: string
}

export default function AIAssistantOrb({
  isThinking,
  isSearching,
  isSuccess = false,
  onClick,
  matchCount = 0,
  size = 80,
  position = 'bottom-right',
}: AIAssistantOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [showRipple, setShowRipple] = useState(false)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()
  const messageIntervalRef = useRef<NodeJS.Timeout>()

  // Determine current state
  const state = isSuccess ? 'success' : isSearching ? 'searching' : isThinking ? 'thinking' : 'idle'
  const colors = ORB_COLORS[state as keyof typeof ORB_COLORS]
  const messages = STATUS_MESSAGES[state as keyof typeof STATUS_MESSAGES]
  const actualMessages = typeof messages === 'function' ? messages(matchCount) : messages

  // Message cycling
  useEffect(() => {
    if (messageIntervalRef.current) clearInterval(messageIntervalRef.current)
    messageIntervalRef.current = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % actualMessages.length)
    }, 3000)
    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current)
    }
  }, [actualMessages.length])

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const particleCount =
      state === 'idle' ? 8 : state === 'thinking' ? 15 : state === 'searching' ? 20 : 40
    const particleSize =
      size < 60 ? 1 : 1.5 // smaller particles on mobile

    // Initialize particles on state change
    if (particlesRef.current.length !== particleCount && state !== 'success') {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        alpha: Math.random() * 0.5 + 0.3,
        radius: particleSize,
        color: [colors.glow, '#e879f9', '#22d3ee'][Math.floor(Math.random() * 3)],
      }))
    }

    // Success burst: explosion of particles
    if (state === 'success' && particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 40 }, () => {
        const angle = (Math.random() * Math.PI * 2)
        const speed = Math.random() * 4 + 2
        return {
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          radius: particleSize,
          color: colors.glow,
        }
      })
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0)

      particlesRef.current.forEach((p) => {
        // Physics
        if (state === 'idle' || state === 'thinking') {
          p.x += p.vx * 0.3
          p.y += p.vy * 0.3
          p.vx *= 0.98
          p.vy *= 0.98

          // Circular motion for thinking state
          if (state === 'thinking') {
            const angle = Math.atan2(p.y - canvas.height / 2, p.x - canvas.width / 2)
            const distance = 30
            p.x = canvas.width / 2 + Math.cos(angle + 0.02) * distance
            p.y = canvas.height / 2 + Math.sin(angle + 0.02) * distance
          }
        } else if (state === 'searching') {
          // Stream outward
          p.vx *= 1.02
          p.vy *= 1.02
          p.x += p.vx
          p.y += p.vy
        } else if (state === 'success') {
          // Burst outward with deceleration
          p.vx *= 0.95
          p.vy *= 0.95
          p.x += p.vx
          p.y += p.vy
        }

        // Fade
        p.alpha *= state === 'idle' ? 0.99 : 0.96

        // Draw
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      ctx.globalAlpha = 1
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [state, size])

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
  }, [size])

  const handleClick = () => {
    setShowRipple(true)
    setTimeout(() => setShowRipple(false), 600)
    onClick()
  }

  const positionClass = position === 'bottom-left' ? 'left-4 md:left-8' : 'right-4 md:right-8'
  const sizePixels = size

  return (
    <div className={`fixed bottom-4 md:bottom-8 ${positionClass} z-50`}>
      {/* Main Orb Container */}
      <motion.div
        className="relative"
        style={{ width: sizePixels, height: sizePixels }}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
      >
        {/* Ambient Aura Layers */}
        {[1.2, 1.1, 1].map((scale, i) => (
          <motion.div
            key={`aura-${i}`}
            className="absolute inset-0 rounded-full blur-2xl"
            style={{
              background: `radial-gradient(circle, ${colors.glow}40, transparent)`,
              width: `${sizePixels * scale}px`,
              height: `${sizePixels * scale}px`,
              left: `${(sizePixels * (scale - 1)) / -2}px`,
              top: `${(sizePixels * (scale - 1)) / -2}px`,
            }}
            variants={auraVariants}
            animate={state}
            initial={state}
          />
        ))}

        {/* Energy Beams (SVG) */}
        <AnimatePresence>
          {isSearching && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${sizePixels} ${sizePixels}`}
              style={{ pointerEvents: 'none' }}
            >
              {[0, 1, 2].map((i) => {
                const angle = (Math.PI * 2) / 3 * i + Math.PI / 2 // top-left, top, top-right
                const endX = sizePixels / 2 + Math.cos(angle) * (sizePixels * 1.5)
                const endY = sizePixels / 2 + Math.sin(angle) * (sizePixels * 1.5)
                return (
                  <motion.path
                    key={`beam-${i}`}
                    d={`M ${sizePixels / 2} ${sizePixels / 2} L ${endX} ${endY}`}
                    stroke={colors.glow}
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.4"
                    filter="blur(0.5px)"
                    variants={energyBeamVariants}
                    initial="initial"
                    animate="animate"
                  />
                )
              })}
            </svg>
          )}
        </AnimatePresence>

        {/* Holographic Rings */}
        <AnimatePresence>
          {(isThinking || isSearching) && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2"
                style={{
                  borderColor: `${colors.ring}60`,
                  width: sizePixels,
                  height: sizePixels,
                }}
                variants={ringVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <motion.div
                  className="w-full h-full rounded-full"
                  style={{
                    borderColor: 'inherit',
                    borderStyle: 'inherit',
                    borderWidth: 'inherit',
                  }}
                  variants={ringVariants}
                  animate="spin"
                />
              </motion.div>

              {isSearching && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{
                    borderColor: `${colors.ring}40`,
                    width: sizePixels * 1.3,
                    height: sizePixels * 1.3,
                    left: `${-sizePixels * 0.15}px`,
                    top: `${-sizePixels * 0.15}px`,
                  }}
                  variants={ringVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <motion.div
                    className="w-full h-full rounded-full"
                    style={{
                      borderColor: 'inherit',
                      borderStyle: 'inherit',
                      borderWidth: 'inherit',
                    }}
                    variants={ringVariants}
                    animate="spinReverse"
                  />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Canvas Particle System */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-full"
          style={{ pointerEvents: 'none' }}
        />

        {/* Core Orb Sphere */}
        <motion.button
          onClick={handleClick}
          className="absolute inset-0 w-full h-full rounded-full cursor-pointer focus:outline-none transition-all"
          style={{
            background: `radial-gradient(circle at 30% 30%, #ffffff30, ${colors.core}80, ${colors.core}ff)`,
            backdropFilter: 'blur(10px)',
            boxShadow: `0 0 0 2px ${colors.glow}40 inset`,
          }}
          variants={orbCoreVariants}
          animate={state}
          initial={state}
          whileHover={{ scale: isHovering ? 1.1 : 1 }}
          whileTap={{ scale: 0.95 }}
        />

        {/* Inner Shimmer (Light Reflection) */}
        <motion.div
          className="absolute rounded-full bg-white"
          style={{
            width: sizePixels * 0.25,
            height: sizePixels * 0.25,
            left: `${sizePixels * 0.2}px`,
            top: `${sizePixels * 0.2}px`,
            opacity: 0.5,
          }}
          variants={shimmerVariants}
          animate={state}
          initial={state}
        />

        {/* Click Ripple Effect */}
        <AnimatePresence>
          {showRipple && (
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: colors.glow }}
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Chip */}
      <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`msg-${state}-${currentMessage}`}
            variants={statusChipVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="px-3 py-1 rounded-full text-xs font-medium text-white backdrop-blur-md border"
            style={{
              backgroundColor: `${colors.glow}30`,
              borderColor: `${colors.glow}60`,
              color: colors.text,
              boxShadow: `0 0 20px ${colors.glow}40`,
            }}
          >
            {actualMessages[currentMessage]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Success Indicator Badge */}
      <AnimatePresence>
        {isSuccess && matchCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-lg"
          >
            {matchCount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()

    // Determine particle count based on device
    const isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 20 : 40

    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2 + 1,
      }))
    }

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(3, 7, 18, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx
        p.y += p.vy

        // Bounce off edges
        if (p.x - p.radius < 0 || p.x + p.radius > canvas.width) p.vx *= -1
        if (p.y - p.radius < 0 || p.y + p.radius > canvas.height) p.vy *= -1

        // Clamp position
        p.x = Math.max(p.radius, Math.min(canvas.width - p.radius, p.x))
        p.y = Math.max(p.radius, Math.min(canvas.height - p.radius, p.y))
      })

      // Draw lines between nearby particles
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)'
      ctx.lineWidth = 1
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i]
          const p2 = particlesRef.current[j]
          const dx = p2.x - p1.x
          const dy = p2.y - p1.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.globalAlpha = 1 - distance / 150
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      // Draw particles
      ctx.fillStyle = 'rgba(139, 92, 246, 0.4)'
      particlesRef.current.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()

        // Glow effect
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      resizeCanvas()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  )
}

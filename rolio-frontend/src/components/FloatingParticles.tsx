"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number }>>([])

  useEffect(() => {
    // Generate particles only on client side after hydration
    setParticles(
      [...Array(15)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
      }))
    )
  }, [])

  return (
    <>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-primary/40"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </>
  )
}

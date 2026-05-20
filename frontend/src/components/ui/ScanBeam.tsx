'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface ScanBeamProps {
  isActive: boolean
  onComplete?: () => void
}

export default function ScanBeam({ isActive, onComplete }: ScanBeamProps) {
  const beamRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!beamRef.current) return

    if (isActive) {
      // Kill existing timeline
      if (timelineRef.current) {
        timelineRef.current.kill()
      }

      // Create GSAP timeline
      timelineRef.current = gsap.timeline({
        onComplete: () => {
          onComplete?.()
        },
      })

      // Scan animation: top to bottom
      timelineRef.current.fromTo(
        beamRef.current,
        { top: '0%', opacity: 1 },
        { top: '100%', opacity: 0, duration: 1.5, ease: 'none' }
      )
    } else {
      // Reset position when not active
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
      gsap.set(beamRef.current, { top: '0%', opacity: 0 })
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [isActive, onComplete])

  if (!isActive) return null

  return (
    <div
      ref={beamRef}
      className="absolute left-0 right-0 h-0.5 w-full z-10 pointer-events-none"
      style={{
        height: '2px',
        background: 'linear-gradient(to right, transparent, #06b6d4, transparent)',
        boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)',
        top: '0%',
      }}
    />
  )
}

'use client'

import { ReactNode } from 'react'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: 'cyan' | 'purple' | 'pink'
  leftBorder?: boolean
}

export default function GlowCard({
  children,
  className = '',
  glowColor = 'cyan',
  leftBorder = false,
}: GlowCardProps) {
  const glowColorMap = {
    cyan: {
      border: 'border-cyan-500/30',
      glow: 'hover:neon-glow-cyan',
      accent: 'border-l-cyan-400',
    },
    purple: {
      border: 'border-purple-500/30',
      glow: 'hover:neon-glow-purple',
      accent: 'border-l-purple-400',
    },
    pink: {
      border: 'border-pink-500/30',
      glow: 'hover:neon-glow-pink',
      accent: 'border-l-pink-400',
    },
  }

  const colors = glowColorMap[glowColor]

  return (
    <div
      className={`
        cyber-glass rounded-xl p-6
        border ${colors.border}
        ${leftBorder ? `border-l-4 ${colors.accent}` : ''}
        ${colors.glow}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  )
}

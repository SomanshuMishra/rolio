'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  circle?: boolean
}

export function Skeleton({ width = '100%', height = '20px', className = '', circle = false }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-white via-gray-800 to-gray-900 ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{
        width,
        height,
      }}
      animate={{
        backgroundPosition: ['0% 0%', '100% 0%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white0 border border-gray-800 rounded-xl space-y-4">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="80%" />
      <div className="flex gap-3 mt-4">
        <Skeleton height="40px" width="50%" />
        <Skeleton height="40px" width="50%" />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="16px" width={i === lines - 1 ? '80%' : '100%'} />
      ))}
    </div>
  )
}

export function JobCardSkeleton() {
  return (
    <div className="h-80 p-6 bg-gradient-to-br from-white to-white border border-gray-100 rounded-xl space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton height="24px" width="80%" />
          <Skeleton height="16px" width="60%" />
        </div>
        <Skeleton height="120px" width="120px" circle />
      </div>
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <Skeleton height="16px" width="40%" />
        <Skeleton height="16px" width="60%" />
        <div className="flex gap-2">
          <Skeleton height="40px" width="50%" />
          <Skeleton height="40px" width="50%" />
        </div>
      </div>
    </div>
  )
}

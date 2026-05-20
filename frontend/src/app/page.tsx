'use client'

import { motion } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import ParticleBackground from '@/components/animations/ParticleBackground'
import TextReveal from '@/components/animations/TextReveal'

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const ctaRef = useRef<HTMLButtonElement>(null)

  // Magnetic button effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ctaRef.current) return

      const rect = ctaRef.current.getBoundingClientRect()
      const buttonX = rect.left + rect.width / 2
      const buttonY = rect.top + rect.height / 2

      const distance = Math.sqrt(
        Math.pow(e.clientX - buttonX, 2) + Math.pow(e.clientY - buttonY, 2)
      )

      if (distance < 100) {
        const angle = Math.atan2(e.clientY - buttonY, e.clientX - buttonX)
        const magneticX = Math.cos(angle) * (100 - distance) * 0.3
        const magneticY = Math.sin(angle) * (100 - distance) * 0.3

        setMousePosition({ x: magneticX, y: magneticY })
      } else {
        setMousePosition({ x: 0, y: 0 })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <main className="relative w-full min-h-screen bg-[#f8f7ff] overflow-hidden">
      {/* Particle background */}
      <ParticleBackground
        particleCount={200}
        textString="Rolio"
        interactive={true}
      />

      {/* Content */}
      <div className="relative z-10 w-full h-screen flex flex-col items-center justify-center px-6">
        {/* Hero section */}
        <motion.div
          className="text-center max-w-4xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Main heading */}
          <div className="mb-6">
            <TextReveal
              text="ROLIO"
              delay={0.3}
              duration={0.05}
              className="text-5xl md:text-7xl font-display font-bold mb-4 gradient-text"
            />
          </div>

          {/* Subheading */}
          <motion.p
            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto font-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Land your next tech role with AI
          </motion.p>

          {/* Description */}
          <motion.p
            className="text-gray-700 mb-12 max-w-xl mx-auto text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            Upload your resume. Set your preferences. Let AI match you with the best tech roles. It's that simple.
          </motion.p>

          {/* CTA Button with magnetic effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="mb-16"
          >
            <Link href="/auth/register">
              <motion.button
                ref={ctaRef}
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-[#0f172a] rounded-full glow smooth-transition hover:shadow-2xl relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  x: mousePosition.x,
                  y: mousePosition.y,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span className="relative z-10">Get Started Free</span>
                <motion.div
                  className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </motion.button>
            </Link>
          </motion.div>

          {/* Feature highlights */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.8 }}
          >
            {[
              {
                icon: '🚀',
                title: 'AI Powered Matching',
                description: 'Advanced algorithms match your skills with ideal job opportunities',
              },
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Get job matches in seconds, not hours',
              },
              {
                icon: '🎯',
                title: 'Precise Filtering',
                description: 'Filter by salary, location, and job type preferences',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 glass rounded-lg group hover:bg-opacity-10 hover:border-indigo-500 smooth-transition"
                whileHover={{ y: -5 }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-center justify-center">
          <motion.div
            className="w-1 h-2 bg-gradient-to-b from-indigo-600 to-violet-600 rounded-full"
            animate={{ y: [0, 8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Rolio',
        url: 'https://rolio.in',
        description: 'Rolio uses AI to match your resume with the best tech roles',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://rolio.in/dashboard/jobs?search={search_term_string}'
          }
        }
      })}</script>

      <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Rolio',
        applicationCategory: 'BusinessApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '250'
        }
      })}</script>
    </main>
  )
}

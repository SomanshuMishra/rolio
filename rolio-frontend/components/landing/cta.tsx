"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CTA() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])

  return (
    <section ref={containerRef} className="relative overflow-hidden py-24 sm:py-32">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Aurora gradients */}
        <motion.div
          style={{ y }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 30% 30%, oklch(0.62 0.25 290 / 0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 70%, oklch(0.75 0.15 200 / 0.2) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, oklch(0.65 0.25 350 / 0.15) 0%, transparent 60%)
              `,
            }}
          />
        </motion.div>

        {/* Grid */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-primary/50"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        style={{ opacity }}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/80">
              <Sparkles className="h-4 w-4 text-primary" />
              Start for free, no credit card required
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            THE FUTURE OF CAREERS
            <br />
            <span className="gradient-text">STARTS HERE.</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8 text-lg text-muted-foreground sm:text-xl leading-relaxed max-w-2xl mx-auto"
          >
            Join thousands of professionals who have already transformed their careers 
            with AI-powered job matching. Your dream role is waiting.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <Link href="/register">
              <Button
                size="lg"
                className="group relative overflow-hidden bg-primary px-10 py-7 text-lg font-semibold text-primary-foreground transition-all hover:scale-105 glow-violet w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" 
                  style={{ backgroundSize: "200% 100%", animation: "aurora 3s ease infinite" }} 
                />
              </Button>
            </Link>
            
            <Link href="#features">
              <Button
                size="lg"
                variant="outline"
                className="glass border-glass-border px-10 py-7 text-lg font-semibold text-foreground hover:bg-white/10 w-full sm:w-auto"
              >
                Learn More
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-neon-emerald" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-neon-cyan" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

"use client"

import { useRef, Suspense } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles, Play } from "lucide-react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const AIOrb = dynamic(() => import("@/components/three/ai-orb"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-64 w-64 rounded-full bg-primary/20 animate-pulse" />
    </div>
  ),
})

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

const FloatingCard = ({ 
  children, 
  className, 
  delay = 0 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay, duration: 0.8, ease: "easeOut" }}
    className={`glass rounded-xl p-4 ${className}`}
    whileHover={{ scale: 1.05, y: -5 }}
  >
    {children}
  </motion.div>
)

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen overflow-hidden bg-background"
    >
      {/* Grid background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Aurora gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%] animate-[aurora_15s_ease-in-out_infinite]"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, oklch(0.62 0.25 290 / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, oklch(0.75 0.15 200 / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 60% 80%, oklch(0.65 0.25 350 / 0.1) 0%, transparent 50%)
            `,
            backgroundSize: "200% 200%",
          }}
        />
      </div>

      {/* 3D AI Orb */}
      <Suspense fallback={null}>
        <AIOrb />
      </Suspense>

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center"
      >
        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="mb-8"
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground/80">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-Powered Career Intelligence
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="max-w-5xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          <span className="block text-foreground">YOUR CAREER.</span>
          <span className="gradient-text block">POWERED BY AI.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
        >
          Experience the future of job searching. ROLIO uses advanced AI to match 
          your skills with perfect opportunities, optimize your resume, and accelerate 
          your career growth.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={textVariants}
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="group relative overflow-hidden bg-primary px-8 py-6 text-lg font-semibold text-primary-foreground transition-all hover:scale-105 glow-violet"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Your AI Career Journey
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" 
                 style={{ backgroundSize: "200% 100%", animation: "aurora 3s ease infinite" }} />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="group glass border-glass-border px-8 py-6 text-lg font-semibold text-foreground hover:bg-white/10"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Floating job cards */}
        <div className="absolute left-4 top-1/3 hidden lg:block">
          <FloatingCard delay={1.2} className="max-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neon-blue/20">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Match Score</p>
                <p className="text-lg font-bold text-neon-cyan">94%</p>
              </div>
            </div>
          </FloatingCard>
        </div>

        <div className="absolute right-4 top-1/4 hidden lg:block">
          <FloatingCard delay={1.5} className="max-w-[220px]">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Senior AI Engineer</p>
              <p className="font-semibold text-foreground">OpenAI</p>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neon-emerald/20 px-2 py-0.5 text-xs text-neon-emerald">
                  Remote
                </span>
                <span className="text-xs text-muted-foreground">$180k-$250k</span>
              </div>
            </div>
          </FloatingCard>
        </div>

        <div className="absolute bottom-1/4 right-8 hidden lg:block">
          <FloatingCard delay={1.8} className="max-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-neon-emerald animate-pulse" />
              <p className="text-sm text-foreground">Resume optimized</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">+34% visibility boost</p>
          </FloatingCard>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-10 w-6 rounded-full border border-border flex items-start justify-center p-1"
            >
              <div className="h-2 w-1 rounded-full bg-primary" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

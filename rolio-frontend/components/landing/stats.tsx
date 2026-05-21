"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView, useSpring, useTransform } from "framer-motion"
import { Users, Briefcase, Target, TrendingUp } from "lucide-react"

const stats = [
  {
    icon: Users,
    value: 150000,
    suffix: "+",
    label: "Active Users",
    description: "Career professionals trust ROLIO",
  },
  {
    icon: Briefcase,
    value: 2500000,
    suffix: "+",
    label: "Jobs Matched",
    description: "Perfect matches made by AI",
  },
  {
    icon: Target,
    value: 94,
    suffix: "%",
    label: "Match Accuracy",
    description: "AI-powered precision matching",
  },
  {
    icon: TrendingUp,
    value: 3.2,
    suffix: "x",
    label: "Faster Hiring",
    description: "Average time to offer",
  },
]

function AnimatedCounter({ 
  value, 
  suffix,
  isInView 
}: { 
  value: number
  suffix: string
  isInView: boolean 
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps
    const increment = value / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value, isInView])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K"
    }
    return num.toFixed(value % 1 !== 0 ? 1 : 0)
  }

  return (
    <span className="tabular-nums">
      {formatNumber(displayValue)}{suffix}
    </span>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 50% 0%, oklch(0.62 0.25 290 / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 0% 100%, oklch(0.75 0.15 200 / 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 100%, oklch(0.65 0.25 350 / 0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Trusted by{" "}
            <span className="gradient-text">Thousands</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Join the growing community of professionals who have transformed their careers with ROLIO.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative"
              >
                {/* Glow effect */}
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20" />
                
                {/* Card */}
                <div className="relative flex flex-col items-center rounded-2xl border border-border bg-card/50 p-8 text-center backdrop-blur-sm transition-colors group-hover:border-primary/30">
                  {/* Icon */}
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>

                  {/* Value */}
                  <div className="text-4xl font-bold text-foreground sm:text-5xl">
                    <AnimatedCounter 
                      value={stat.value} 
                      suffix={stat.suffix} 
                      isInView={isInView} 
                    />
                  </div>

                  {/* Label */}
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {stat.label}
                  </p>

                  {/* Description */}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

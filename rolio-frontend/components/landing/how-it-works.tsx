"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Upload, Cpu, Sparkles, Briefcase } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload Your Resume",
    description: "Drop your resume and let our AI instantly parse your skills, experience, and career trajectory.",
    visual: "resume",
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    description: "Our neural networks analyze your profile against millions of job postings and career paths.",
    visual: "analysis",
  },
  {
    icon: Sparkles,
    title: "Semantic Matching",
    description: "Advanced algorithms find the perfect matches based on skills, culture fit, and growth potential.",
    visual: "matching",
  },
  {
    icon: Briefcase,
    title: "Land Your Dream Job",
    description: "Apply with one click using AI-optimized applications tailored to each position.",
    visual: "success",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

function ProcessVisual({ step, index }: { step: typeof steps[number]; index: number }) {
  return (
    <div className="relative h-full w-full rounded-2xl border border-border bg-card/30 p-6 backdrop-blur-sm overflow-hidden">
      {/* Animated background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at ${30 + index * 20}% ${40 + index * 10}%, oklch(0.62 0.25 290 / 0.3) 0%, transparent 50%),
            radial-gradient(circle at ${70 - index * 15}% ${60 - index * 10}%, oklch(0.75 0.15 200 / 0.2) 0%, transparent 50%)
          `,
        }}
      />

      {/* Content based on step */}
      <div className="relative z-10">
        {step.visual === "resume" && (
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-foreground/10" />
            <div className="h-4 w-1/2 rounded bg-foreground/10" />
            <div className="mt-6 space-y-2">
              <div className="h-3 w-full rounded bg-primary/30" />
              <div className="h-3 w-5/6 rounded bg-primary/20" />
              <div className="h-3 w-4/6 rounded bg-primary/20" />
            </div>
            <div className="mt-6 flex gap-2">
              <span className="rounded-full bg-neon-violet/20 px-3 py-1 text-xs text-neon-violet">React</span>
              <span className="rounded-full bg-neon-blue/20 px-3 py-1 text-xs text-neon-cyan">TypeScript</span>
              <span className="rounded-full bg-neon-emerald/20 px-3 py-1 text-xs text-neon-emerald">Node.js</span>
            </div>
          </div>
        )}

        {step.visual === "analysis" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/20 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded bg-foreground/10" />
                <div className="h-3 w-24 rounded bg-foreground/10" />
              </div>
            </div>
            {/* Neural network visualization */}
            <div className="relative h-32">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                {/* Connection lines */}
                {[0, 1, 2].map((i) =>
                  [0, 1, 2, 3].map((j) => (
                    <motion.line
                      key={`${i}-${j}`}
                      x1={30}
                      y1={25 + i * 25}
                      x2={100}
                      y2={12.5 + j * 25}
                      stroke="oklch(0.62 0.25 290 / 0.3)"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: i * 0.1 + j * 0.05, duration: 0.5 }}
                    />
                  ))
                )}
                {[0, 1, 2, 3].map((i) =>
                  [0, 1, 2].map((j) => (
                    <motion.line
                      key={`second-${i}-${j}`}
                      x1={100}
                      y1={12.5 + i * 25}
                      x2={170}
                      y2={25 + j * 25}
                      stroke="oklch(0.75 0.15 200 / 0.3)"
                      strokeWidth="1"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 + j * 0.05, duration: 0.5 }}
                    />
                  ))
                )}
                {/* Nodes */}
                {[0, 1, 2].map((i) => (
                  <motion.circle
                    key={`input-${i}`}
                    cx={30}
                    cy={25 + i * 25}
                    r={6}
                    fill="oklch(0.62 0.25 290)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                ))}
                {[0, 1, 2, 3].map((i) => (
                  <motion.circle
                    key={`hidden-${i}`}
                    cx={100}
                    cy={12.5 + i * 25}
                    r={6}
                    fill="oklch(0.75 0.15 200)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  />
                ))}
                {[0, 1, 2].map((i) => (
                  <motion.circle
                    key={`output-${i}`}
                    cx={170}
                    cy={25 + i * 25}
                    r={6}
                    fill="oklch(0.65 0.25 350)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  />
                ))}
              </svg>
            </div>
          </div>
        )}

        {step.visual === "matching" && (
          <div className="space-y-3">
            {[94, 87, 82].map((score, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-3"
              >
                <div className="relative h-10 w-10">
                  <svg className="h-10 w-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="oklch(0.25 0.03 265)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke={i === 0 ? "oklch(0.7 0.18 155)" : i === 1 ? "oklch(0.75 0.15 200)" : "oklch(0.62 0.25 290)"}
                      strokeWidth="3"
                      strokeDasharray={`${score} 100`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {score}%
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-2 w-24 rounded bg-foreground/10" />
                  <div className="mt-1 h-2 w-16 rounded bg-foreground/5" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {step.visual === "success" && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-emerald/20"
            >
              <Sparkles className="h-8 w-8 text-neon-emerald" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">Interview Scheduled!</p>
            <p className="mt-1 text-sm text-muted-foreground">Senior Engineer at TechCorp</p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">$180k - $220k</span>
              <span className="rounded-full bg-neon-cyan/20 px-3 py-1 text-xs text-neon-cyan">Remote</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How AI Matching{" "}
            <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            From resume to dream job in four intelligent steps. Our AI handles the complexity 
            so you can focus on what matters.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative"
        >
          {/* Connection line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-primary/30 hidden lg:block" />

          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  variants={stepVariants}
                  className={`flex flex-col gap-8 lg:flex-row lg:items-center ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Step indicator - mobile */}
                  <div className="flex items-center gap-4 lg:hidden">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 ring-4 ring-background">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 1 ? "lg:text-right" : ""}`}>
                    <div className="hidden lg:flex items-center gap-4 mb-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 ring-4 ring-background relative z-10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="hidden lg:block text-2xl font-semibold text-foreground mb-4">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed max-w-md">
                      {step.description}
                    </p>
                  </div>

                  {/* Visual */}
                  <div className="flex-1 h-64 lg:h-72">
                    <ProcessVisual step={step} index={index} />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

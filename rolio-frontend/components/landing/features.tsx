"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { 
  Brain, 
  FileSearch, 
  Target, 
  Wand2, 
  TrendingUp, 
  Zap,
  Cpu
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Our neural networks analyze millions of data points to find jobs that perfectly align with your skills, experience, and career goals.",
    color: "from-neon-violet to-neon-blue",
    glow: "glow-violet",
  },
  {
    icon: FileSearch,
    title: "Resume Intelligence",
    description: "Advanced NLP scans your resume, identifies strengths, and provides actionable insights to boost your visibility to recruiters.",
    color: "from-neon-blue to-neon-cyan",
    glow: "glow-blue",
  },
  {
    icon: Target,
    title: "Smart Semantic Search",
    description: "Go beyond keywords. Our AI understands context and meaning to surface opportunities you might have missed.",
    color: "from-neon-cyan to-neon-emerald",
    glow: "glow-blue",
  },
  {
    icon: Wand2,
    title: "AI Resume Optimizer",
    description: "Let AI rewrite and enhance your resume sections for maximum impact. Tailored suggestions for every application.",
    color: "from-neon-pink to-neon-violet",
    glow: "glow-pink",
  },
  {
    icon: TrendingUp,
    title: "Career Insights",
    description: "Data-driven recommendations on skills to develop, salary benchmarks, and industry trends to guide your career path.",
    color: "from-neon-emerald to-neon-cyan",
    glow: "glow-blue",
  },
  {
    icon: Zap,
    title: "One-Click Apply",
    description: "Save hours with intelligent auto-fill. Apply to matched positions instantly with personalized cover letters.",
    color: "from-neon-violet to-neon-pink",
    glow: "glow-violet",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

function FeatureCard({ 
  feature, 
  index 
}: { 
  feature: typeof features[number]
  index: number 
}) {
  const Icon = feature.icon

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        transition: { duration: 0.3 }
      }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div 
        className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30`} 
      />
      
      {/* Card */}
      <div className="relative flex h-full flex-col rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-colors group-hover:border-primary/30">
        {/* Icon */}
        <div 
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} p-[1px]`}
        >
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-card">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
        </div>

        {/* Content */}
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          {feature.title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {feature.description}
        </p>

        {/* Decorative line */}
        <div 
          className={`mt-4 h-1 w-16 rounded-full bg-gradient-to-r ${feature.color} opacity-50 transition-all duration-300 group-hover:w-full group-hover:opacity-100`} 
        />
      </div>
    </motion.div>
  )
}

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="relative overflow-hidden py-24 sm:py-32">
      {/* Background elements */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px]"
        style={{
          background: "radial-gradient(ellipse at center, oklch(0.62 0.25 290 / 0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-2">
            <Cpu className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Advanced AI Features
            </span>
          </div>
          
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Your AI Career{" "}
            <span className="gradient-text">Copilot</span>
          </h2>
          
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            ROLIO combines cutting-edge AI with deep industry insights to transform 
            how you discover opportunities and advance your career.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

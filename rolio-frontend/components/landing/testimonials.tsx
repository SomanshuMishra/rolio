"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    id: 1,
    quote: "ROLIO completely transformed my job search. The AI matched me with my dream role at a FAANG company within two weeks. The resume optimization alone was worth it.",
    author: "Sarah Chen",
    role: "Senior Software Engineer",
    company: "Google",
    avatar: "SC",
  },
  {
    id: 2,
    quote: "I was skeptical about AI job matching, but ROLIO's semantic search found opportunities I never would have discovered. The match accuracy is genuinely impressive.",
    author: "Marcus Johnson",
    role: "Product Manager",
    company: "Stripe",
    avatar: "MJ",
  },
  {
    id: 3,
    quote: "The one-click apply feature with personalized cover letters saved me countless hours. I went from application to offer in just 10 days.",
    author: "Emily Rodriguez",
    role: "Data Scientist",
    company: "OpenAI",
    avatar: "ER",
  },
  {
    id: 4,
    quote: "As a career changer, I needed guidance. ROLIO's AI not only found relevant positions but also identified transferable skills I didn't know I had.",
    author: "David Park",
    role: "Engineering Manager",
    company: "Vercel",
    avatar: "DP",
  },
  {
    id: 5,
    quote: "The career insights and salary benchmarking gave me the confidence to negotiate a 40% higher offer. ROLIO is an essential tool for any job seeker.",
    author: "Alexandra Foster",
    role: "UX Director",
    company: "Figma",
    avatar: "AF",
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const navigate = (dir: number) => {
    setDirection(dir)
    setCurrentIndex((prev) => {
      if (dir === 1) return (prev + 1) % testimonials.length
      return prev === 0 ? testimonials.length - 1 : prev - 1
    })
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  return (
    <section id="testimonials" className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px]"
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
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Loved by{" "}
            <span className="gradient-text">Professionals</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            See how ROLIO has helped thousands land their dream careers.
          </p>
        </motion.div>

        {/* Testimonial carousel */}
        <div className="relative mx-auto max-w-4xl">
          {/* Main testimonial card */}
          <div className="relative min-h-[300px] sm:min-h-[250px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="glass rounded-2xl p-8 sm:p-12">
                  {/* Quote icon */}
                  <Quote className="h-10 w-10 text-primary/30 mb-6" />

                  {/* Quote text */}
                  <blockquote className="text-lg sm:text-xl text-foreground leading-relaxed mb-8">
                    {`"${testimonials[currentIndex].quote}"`}
                  </blockquote>

                  {/* Author info */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                      {testimonials[currentIndex].avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonials[currentIndex].author}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="glass border-glass-border hover:bg-white/10"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentIndex ? 1 : -1)
                    setCurrentIndex(index)
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-border hover:bg-muted-foreground"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(1)}
              className="glass border-glass-border hover:bg-white/10"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

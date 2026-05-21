"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Sparkles, Mail, Lock, User, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/src/store/authStore"
import { FloatingParticles } from "@/src/components/FloatingParticles"

const features = [
  "AI-powered job matching",
  "Resume optimization",
  "Career insights & analytics",
  "One-click applications",
]

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const { register, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fullName || !email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    try {
      await register(email, password, fullName)
      router.push("/dashboard")
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Registration failed. Please try again."
      setError(errorMsg)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 80% 20%, oklch(0.62 0.25 290 / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, oklch(0.75 0.15 200 / 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, oklch(0.65 0.25 350 / 0.08) 0%, transparent 60%)
            `,
          }}
        />
        
        {/* Floating particles */}
        <FloatingParticles />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left side - Benefits */}
        <div className="hidden w-1/2 flex-col justify-center p-12 lg:flex xl:p-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="mb-12 flex items-center gap-2">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <span className="text-xl font-bold text-primary-foreground">R</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground">ROLIO</span>
            </Link>

            <h1 className="text-4xl font-bold tracking-tight text-foreground xl:text-5xl">
              Start Your AI-Powered
              <br />
              <span className="gradient-text">Career Journey</span>
            </h1>

            <p className="mt-6 max-w-md text-lg text-muted-foreground leading-relaxed">
              Join thousands of professionals who have transformed their careers 
              with intelligent job matching and AI-driven insights.
            </p>

            {/* Feature list */}
            <ul className="mt-10 space-y-4">
              {features.map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </motion.li>
              ))}
            </ul>

            {/* Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-12 glass rounded-xl p-6"
            >
              <p className="text-sm text-muted-foreground italic">
                {`"ROLIO found me my dream job in just 2 weeks. The AI matching 
                is incredibly accurate."`}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
                  SC
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sarah Chen</p>
                  <p className="text-xs text-muted-foreground">Senior Engineer at Google</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right side - Form */}
        <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <Link href="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <span className="text-xl font-bold text-primary-foreground">R</span>
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground">ROLIO</span>
            </Link>

            {/* Form card */}
            <div className="glass rounded-2xl p-8">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Free forever. No credit card required.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Error alert */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 sm:h-5 w-4 sm:w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="h-11 sm:h-12 bg-secondary/50 pl-10 border-border focus:border-primary focus:ring-primary text-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 sm:h-5 w-4 sm:w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11 sm:h-12 bg-secondary/50 pl-10 border-border focus:border-primary focus:ring-primary text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 sm:h-5 w-4 sm:w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="h-11 sm:h-12 bg-secondary/50 pl-10 pr-10 border-border focus:border-primary focus:ring-primary text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative h-11 sm:h-12 w-full overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent"
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>

                {/* Terms */}
                <p className="text-center text-xs text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Social login */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  className="h-11 sm:h-12 border-border bg-secondary/30 hover:bg-secondary/50 text-xs sm:text-sm"
                >
                  <svg className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="h-12 border-border bg-secondary/30 hover:bg-secondary/50"
                >
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </Button>
              </div>

              {/* Sign in link */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Join 150,000+ professionals</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

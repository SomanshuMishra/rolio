"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Sparkles, Mail, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/src/store/authStore"
import { FloatingParticles } from "@/src/components/FloatingParticles"
import GoogleSignInButton from "@/src/components/GoogleSignInButton"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.")
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
              radial-gradient(ellipse at 20% 30%, oklch(0.62 0.25 290 / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, oklch(0.75 0.15 200 / 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 100%, oklch(0.65 0.25 350 / 0.1) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Floating particles */}
        <FloatingParticles />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
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
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to continue your AI career journey
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs sm:text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 sm:h-5 w-4 sm:w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Google Sign-In */}
            <GoogleSignInButton />

            {/* Sign up link */}
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up for free
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
            <span>Trusted by 150,000+ professionals</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

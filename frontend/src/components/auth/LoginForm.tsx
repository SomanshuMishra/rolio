'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AnimatedInput from './AnimatedInput'
import NeuralBackground from '@/components/ui/NeuralBackground'
import api from '@/lib/api'
import { setTokens } from '@/lib/auth'
import { AuthResponse } from '@/lib/types'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (searchParams.get('registered')) {
      setSuccessMessage('Account created successfully! Please log in.')
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    setSuccessMessage('')

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      const { access_token, refresh_token } = response.data
      setTokens(access_token, refresh_token)

      onSuccess?.()
      router.push('/dashboard')
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please try again.'
      setSubmitError(errorMessage)
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center relative overflow-hidden">
      <NeuralBackground />

      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-md relative z-10 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Card background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-2xl blur-xl" />

          <div className="relative cyber-glass rounded-2xl p-8 border border-cyan-500/30">
            {/* Header */}
            <div className="mb-8">
              <motion.h1
                className="text-3xl font-bold mb-2 ai-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                Welcome Back
              </motion.h1>
              <motion.p
                className="text-slate-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Log in to your account to continue
              </motion.p>
            </div>

            {/* Success message */}
            <motion.div
              className="mb-6 h-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: successMessage ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {successMessage && (
                <motion.div
                  className="bg-slate-900/60 border border-cyan-500/50 rounded-lg p-3 text-cyan-300 text-sm"
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ✓ {successMessage}
                </motion.div>
              )}
            </motion.div>

            {/* Error message */}
            <motion.div
              className="mb-6 h-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: submitError ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {submitError && (
                <motion.div
                  className="bg-slate-900/60 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm"
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {submitError}
                </motion.div>
              )}
            </motion.div>

            {/* Form fields */}
            <AnimatedInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              required
            />

            <AnimatedInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              required
            />

            {/* Forgot password link */}
            <motion.div
              className="mb-6 text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Link href="#" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group neon-glow-cyan"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.span
                className="relative z-10 flex items-center justify-center"
                animate={{ opacity: isLoading ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                Sign In
              </motion.span>

              {/* Loading spinner */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: isLoading ? 1 : 0, rotate: isLoading ? 360 : 0 }}
                transition={{
                  opacity: { duration: 0.2 },
                  rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                }}
              >
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              </motion.div>
            </motion.button>

            {/* Register link */}
            <motion.p
              className="text-center mt-6 text-slate-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                Sign up now
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.form>
    </div>
  )
}

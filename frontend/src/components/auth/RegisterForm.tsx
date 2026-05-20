'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnimatedInput from './AnimatedInput'
import api from '@/lib/api'
import { setTokens } from '@/lib/auth'
import { AuthResponse } from '@/lib/types'

interface RegisterFormProps {
  onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
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

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await api.post<AuthResponse>('/api/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
      })

      // Store tokens for auto-login
      const { access_token, refresh_token } = response.data
      setTokens(access_token, refresh_token)

      onSuccess?.()
      router.push('/dashboard')
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.'
      setSubmitError(errorMessage)
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {/* Card background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl blur-xl" />

        <div className="relative backdrop-blur-md bg-white border border-gray-100 rounded-2xl p-8">
          {/* Header */}
          <div className="mb-8">
            <motion.h1
              className="text-3xl font-bold mb-2 gradient-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Create Account
            </motion.h1>
            <motion.p
              className="text-gray-600 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Join our platform and start matching with jobs
            </motion.p>
          </div>

          {/* Error message */}
          <motion.div
            className="mb-6 h-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: submitError ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                {submitError}
              </div>
            )}
          </motion.div>

          {/* Form fields */}
          <AnimatedInput
            label="Full Name"
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            error={errors.full_name}
            placeholder="John Doe"
            required
          />

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

          <AnimatedInput
            label="Confirm Password"
            name="confirm_password"
            type="password"
            value={formData.confirm_password}
            onChange={handleChange}
            error={errors.confirm_password}
            placeholder="••••••••"
            required
          />

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-[#0f172a] font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
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
              Create Account
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

            {/* Hover shine effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10"
              animate={{ x: ['0%', '100%'] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </motion.button>

          {/* Login link */}
          <motion.p
            className="text-center mt-6 text-gray-600 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Login here
            </Link>
          </motion.p>
        </div>
      </div>
    </motion.form>
  )
}

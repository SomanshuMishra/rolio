'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'

export default function ProfilePage() {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        const response = await fetch(`${apiUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setFormData({
            full_name: data.full_name || '',
            email: data.email || '',
          })
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
        addToast('Failed to load profile', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [addToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.full_name.trim()) {
      addToast('Full name is required', 'error')
      return
    }

    setIsSaving(true)

    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const response = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save profile')
      }

      addToast('Profile updated successfully!', 'success')
    } catch (error) {
      console.error('Save error:', error)
      addToast(error instanceof Error ? error.message : 'Failed to save profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-2 ai-text">Profile Settings</h1>
        <p className="text-slate-400 mb-8 text-sm md:text-base">Manage your personal information</p>

        <div className="max-w-2xl">
          <motion.div
            className="cyber-glass border border-cyan-500/30 rounded-xl p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  className="w-8 h-8 border-3 border-cyan-500 border-t-purple-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={isSaving}
                    className="w-full px-4 py-2 bg-slate-900/60 border border-cyan-500/30 rounded-lg text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 bg-slate-900/40 border border-slate-600/30 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                </div>

                <motion.button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-sm font-medium neon-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: isSaving ? 1 : 1.02 }}
                  whileTap={{ scale: isSaving ? 1 : 0.98 }}
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

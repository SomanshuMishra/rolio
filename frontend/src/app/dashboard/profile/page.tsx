'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
  })

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
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-cyan-500/30 rounded-lg text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-cyan-500/30 rounded-lg text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-cyan-500/30 rounded-lg text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/60 border border-cyan-500/30 rounded-lg text-cyan-50 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="San Francisco, CA"
                />
              </div>

              <motion.button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-sm font-medium neon-glow-cyan transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Changes
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

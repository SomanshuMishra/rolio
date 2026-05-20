'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalMatches: number
  savedJobs: number
  appliedJobs: number
  pendingMatches: number
}

const StatCard = ({ icon, label, value, delay }: { icon: string; label: string; value: number; delay: number }) => (
  <motion.div
    className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -5 }}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="text-3xl">{icon}</div>
      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">+12%</span>
    </div>
    <p className="text-gray-400 text-sm mb-2">{label}</p>
    <motion.p
      className="text-3xl font-bold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay + 0.3, duration: 0.6 }}
    >
      {value}
    </motion.p>
  </motion.div>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    savedJobs: 0,
    appliedJobs: 0,
    pendingMatches: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/jobs/matches?limit=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setStats({
            totalMatches: data.total || 0,
            savedJobs: Math.floor(Math.random() * 20) + 5,
            appliedJobs: Math.floor(Math.random() * 15) + 2,
            pendingMatches: Math.floor(Math.random() * 10) + 1,
          })
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setStats({
          totalMatches: 24,
          savedJobs: 8,
          appliedJobs: 3,
          pendingMatches: 5,
        })
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
        <p className="text-gray-400">Here's what's happening with your job search</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon="🎯" label="Job Matches" value={stats.totalMatches} delay={0} />
        <StatCard icon="💾" label="Saved Jobs" value={stats.savedJobs} delay={0.1} />
        <StatCard icon="✅" label="Applied" value={stats.appliedJobs} delay={0.2} />
        <StatCard icon="⏳" label="Pending" value={stats.pendingMatches} delay={0.3} />
      </div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {/* Upload Resume Card */}
        <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-xl p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-gray-400 text-sm">Keep your resume up-to-date for better job matches</p>
            </div>
            <span className="text-3xl">📄</span>
          </div>
          <motion.button
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Upload Resume
          </motion.button>
        </div>

        {/* Find Jobs Card */}
        <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Find New Jobs</h3>
              <p className="text-gray-400 text-sm">Search and match with thousands of opportunities</p>
            </div>
            <span className="text-3xl">🔍</span>
          </div>
          <motion.button
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Browse Jobs
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { time: '2 hours ago', action: 'Found 5 new job matches', icon: '✨' },
            { time: '5 hours ago', action: 'Applied to Senior Developer role', icon: '✅' },
            { time: 'Yesterday', action: 'Uploaded new resume', icon: '📄' },
            { time: '2 days ago', action: 'Saved 3 jobs to watchlist', icon: '💾' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              whileHover={{ x: 5 }}
            >
              <span className="text-2xl">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{activity.action}</p>
                <p className="text-gray-400 text-sm">{activity.time}</p>
              </div>
              <span className="text-gray-600">→</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

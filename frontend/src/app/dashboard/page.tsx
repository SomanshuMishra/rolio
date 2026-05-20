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
    className="cyber-glass border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] relative overflow-hidden group"
    initial={{ opacity: 0, y: 20, rotateX: 10 }}
    animate={{ opacity: 1, y: 0, rotateX: 0 }}
    transition={{ delay, duration: 0.5, type: 'spring' }}
    whileHover={{ y: -8, rotateX: 5 }}
    style={{ perspective: 1000 }}
  >
    {/* Glow effect on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300" />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <motion.div
          className="text-4xl"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {icon}
        </motion.div>
        <motion.span
          className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          +12%
        </motion.span>
      </div>
      <p className="text-slate-400 text-xs md:text-sm mb-3">{label}</p>
      <motion.p
        className="text-2xl md:text-3xl font-bold ai-text"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.6 }}
      >
        {value}
      </motion.p>
    </div>
  </motion.div>
)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, type: 'spring', stiffness: 100 },
  },
}

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
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Header */}
      <motion.div
        className="mb-8 md:mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 ai-text bg-clip-text">Welcome back! 👋</h1>
        <p className="text-sm md:text-base text-slate-400">Here's what's happening with your job search today</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <StatCard icon="🎯" label="Job Matches" value={stats.totalMatches} delay={0} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard icon="💾" label="Saved Jobs" value={stats.savedJobs} delay={0.1} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard icon="✅" label="Applied" value={stats.appliedJobs} delay={0.2} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard icon="⏳" label="Pending" value={stats.pendingMatches} delay={0.3} />
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Upload Resume Card */}
        <motion.div
          variants={itemVariants}
          className="cyber-glass border border-cyan-500/30 rounded-xl p-6 md:p-8 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] relative overflow-hidden group"
          whileHover={{ scale: 1.02, rotateY: 5 }}
          style={{ perspective: 1000 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-cyan-300">Upload Your Resume</h3>
                <p className="text-xs md:text-sm text-slate-400">Keep your resume up-to-date for better job matches</p>
              </div>
              <motion.span
                className="text-3xl md:text-4xl flex-shrink-0 ml-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                📄
              </motion.span>
            </div>
            <motion.button
              className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500/40 to-purple-500/40 hover:from-cyan-500/60 hover:to-purple-500/60 rounded-lg text-xs md:text-sm font-medium text-cyan-300 transition-all border border-cyan-500/50 neon-glow-cyan"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Upload Resume
            </motion.button>
          </div>
        </motion.div>

        {/* Find Jobs Card */}
        <motion.div
          variants={itemVariants}
          className="cyber-glass border border-purple-500/30 rounded-xl p-6 md:p-8 hover:border-purple-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] relative overflow-hidden group"
          whileHover={{ scale: 1.02, rotateY: -5 }}
          style={{ perspective: 1000 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-purple-300">Find New Jobs</h3>
                <p className="text-xs md:text-sm text-slate-400">Search and match with thousands of opportunities</p>
              </div>
              <motion.span
                className="text-3xl md:text-4xl flex-shrink-0 ml-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🔍
              </motion.span>
            </div>
            <motion.button
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-500/40 to-pink-500/40 hover:from-purple-500/60 hover:to-pink-500/60 rounded-lg text-xs md:text-sm font-medium text-purple-300 transition-all border border-purple-500/50 neon-glow-purple"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Jobs
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="mt-8 md:mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, type: 'spring' }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-cyan-300">Recent Activity</h2>
        <div className="space-y-3 md:space-y-4">
          {[
            { time: '2 hours ago', action: 'Found 5 new job matches', icon: '✨' },
            { time: '5 hours ago', action: 'Applied to Senior Developer role', icon: '✅' },
            { time: 'Yesterday', action: 'Uploaded new resume', icon: '📄' },
            { time: '2 days ago', action: 'Saved 3 jobs to watchlist', icon: '💾' },
          ].map((activity, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cyber-glass border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden group"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              whileHover={{ x: 5, scale: 1.02 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />
              <motion.span
                className="text-xl md:text-2xl flex-shrink-0"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
              >
                {activity.icon}
              </motion.span>
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base text-slate-300 font-medium truncate">{activity.action}</p>
                <p className="text-xs md:text-sm text-slate-500">{activity.time}</p>
              </div>
              <motion.span
                className="text-cyan-400 flex-shrink-0"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

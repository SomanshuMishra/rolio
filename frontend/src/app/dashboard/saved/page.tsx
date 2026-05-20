'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface Job {
  id: string
  jsearch_id: string
  title: string
  company: string
  location: string
  salary_min?: number
  salary_max?: number
  is_remote: boolean
  description: string
  match_score?: number
  match_reasons?: string[]
  apply_url?: string
  posted_at?: string
}

interface SavedJob {
  match_id: string
  job: Job
  match_score: number
  match_reasons: string[]
  user_action?: string
  created_at: string
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'score' | 'date'>('date')

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        const response = await fetch(`${apiUrl}/api/jobs/matches?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch saved jobs')
        }

        const data = await response.json()
        // Filter to only show saved jobs
        const saved = (data.matches || []).filter((match: SavedJob) => match.user_action === 'saved')
        setSavedJobs(saved)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch saved jobs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSavedJobs()
  }, [])

  const handleRemoveJob = (matchId: string) => {
    setSavedJobs(savedJobs.filter(job => job.match_id !== matchId))
  }

  const sortedJobs = [...savedJobs].sort((a, b) => {
    if (sortBy === 'score') {
      return b.match_score - a.match_score
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (isLoading) {
    return (
      <div className="min-h-screen text-slate-300 pt-8 px-4 md:px-6">
        <motion.div
          className="flex justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 border-3 border-cyan-500 border-t-purple-500 rounded-full"
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-300 pt-8 px-4 md:px-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 ai-text">❤️ SAVED JOBS</h1>
          <p className="text-slate-400 text-sm md:text-base">{sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''} saved</p>
        </div>

        {/* Sort Options */}
        {sortedJobs.length > 0 && (
          <div className="mb-6 flex gap-3 flex-wrap">
            <motion.button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                sortBy === 'date' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white neon-glow-cyan' : 'cyber-glass border border-cyan-500/30 text-slate-400 hover:border-cyan-400/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Newest First
            </motion.button>
            <motion.button
              onClick={() => setSortBy('score')}
              className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                sortBy === 'score' ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white neon-glow-cyan' : 'cyber-glass border border-cyan-500/30 text-slate-400 hover:border-cyan-400/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Best Match First
            </motion.button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-glass border border-red-500/50 text-red-400 px-6 py-4 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Empty State */}
        {sortedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📭
            </motion.div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 text-cyan-300">No Saved Jobs Yet</h2>
            <p className="text-slate-400 text-sm md:text-base mb-6">Save jobs from the Jobs page to review them later</p>
            <motion.a
              href="/dashboard/jobs"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Jobs
            </motion.a>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sortedJobs.map((savedJob, index) => (
                <motion.div
                  key={savedJob.match_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-gradient-to-r from-white/50 to-gray-800/50 border border-purple-100 rounded-2xl p-6 hover:border-white/30 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {/* Match Score Badge */}
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="inline-block"
                        >
                          <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm font-bold">
                            {Math.round(savedJob.match_score)}% Match
                          </span>
                        </motion.div>
                        <span className="text-xs text-gray-700">
                          {new Date(savedJob.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold mb-2">{savedJob.job.title}</h3>
                      <p className="text-lg text-gray-300 mb-2">{savedJob.job.company}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                        <span>📍 {savedJob.job.location}</span>
                        {savedJob.job.is_remote && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-bold">
                            REMOTE
                          </span>
                        )}
                        {savedJob.job.salary_min && savedJob.job.salary_max && (
                          <span>
                            💰 ${savedJob.job.salary_min.toLocaleString()} - ${savedJob.job.salary_max.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <motion.a
                        href={savedJob.job.apply_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-sm transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Apply
                      </motion.a>
                      <motion.button
                        onClick={() => handleRemoveJob(savedJob.match_id)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg font-bold text-sm transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Unsave
                      </motion.button>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {savedJob.match_reasons && savedJob.match_reasons.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.15 }}
                      className="mt-4 pt-4 border-t border-purple-100"
                    >
                      <p className="text-xs font-bold uppercase text-gray-600 mb-3">Why you'd be great</p>
                      <ul className="space-y-2">
                        {savedJob.match_reasons.slice(0, 3).map((reason, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            className="text-sm text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-green-400 mt-0.5">✓</span>
                            <span>{reason}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}

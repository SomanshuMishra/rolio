'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const MIN_MATCH_SCORE = 60

interface JobMatch {
  match_id: string
  job: {
    id: string
    jsearch_id: string
    title: string
    company: string
    location: string
    is_remote: boolean
    salary_min?: number
    salary_max?: number
    description?: string
    apply_url?: string
  }
  match_score: number
  match_reasons: string[]
  user_action?: string
}

interface SearchStatus {
  search_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  total_jobs_searched: number
  total_matches: number
}

export default function JobsPage() {
  const searchParams = useSearchParams()
  const [hasResume, setHasResume] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Search state
  const [searchInProgress, setSearchInProgress] = useState(false)
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null)
  const [searchStatus, setSearchStatus] = useState<SearchStatus | null>(null)
  const [searchResults, setSearchResults] = useState<JobMatch[]>([])

  // Check for search_id in URL on mount
  useEffect(() => {
    const urlSearchId = searchParams.get('search_id')
    if (urlSearchId) {
      setCurrentSearchId(urlSearchId)
      setSearchInProgress(true)
      setSearchStatus({ search_id: urlSearchId, status: 'pending', total_jobs_searched: 0, total_matches: 0 })
      startPolling(urlSearchId)
    }
  }, [searchParams])

  // Check if resume exists
  useEffect(() => {
    const checkResume = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        const resumeResponse = await fetch(`${apiUrl}/api/resume/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setHasResume(resumeResponse.ok)
      } catch (error) {
        console.error('Failed to check resume:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkResume()
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const startPolling = (searchId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    const token = localStorage.getItem('access_token')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${apiUrl}/api/jobs/search-status/${searchId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })

        const statusData = await statusResponse.json()
        setSearchStatus(statusData)

        if (statusData.status === 'completed' || statusData.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
          }
          setSearchInProgress(false)

          if (statusData.status === 'completed') {
            // Fetch results
            try {
              const resultsResponse = await fetch(
                `${apiUrl}/api/jobs/search-results/${searchId}?limit=50&min_score=${MIN_MATCH_SCORE}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              )
              const resultsData = await resultsResponse.json()
              console.log('Search results:', resultsData)
              setSearchResults(resultsData.matches || [])
            } catch (error) {
              console.error('Failed to fetch results:', error)
            }

            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Rolio Job Search Complete', {
                body: `Found ${resultsData.matches?.length || 0} matching jobs!`,
                icon: '/favicon.svg',
              })
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000)
  }

  const handleStartSearch = async () => {
    setSearchInProgress(true)

    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      // Start async search
      const response = await fetch(`${apiUrl}/api/jobs/search-async`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 50,
          force_refresh: true,
          required_skills: [],
        }),
      })

      const data = await response.json()
      const searchId = data.search_id

      setCurrentSearchId(searchId)
      setSearchStatus({ search_id: searchId, status: 'pending', total_jobs_searched: 0, total_matches: 0 })

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }

      startPolling(searchId)
    } catch (error) {
      console.error('Failed to start search:', error)
      setSearchInProgress(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (!currentSearchId) return

    try {
      const token = localStorage.getItem('access_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

      const response = await fetch(
        `${apiUrl}/api/jobs/search-results/${currentSearchId}/export?min_score=${MIN_MATCH_SCORE}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rolio_job_matches_${currentSearchId?.slice(0, 8)}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download Excel:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-3 border-white/20 border-t-white rounded-full"
        />
      </div>
    )
  }

  if (!hasResume) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-white text-2xl mb-4">📄 Upload resume first</p>
          <a href="/dashboard/resume">
            <button className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200">
              Go to Resume
            </button>
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-bold mb-8">Job Search</h1>

        {/* Show accumulating message if search just started from settings redirect */}
        <AnimatePresence>
          {searchInProgress && searchStatus?.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-12 mb-8 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"
              />
              <h2 className="text-2xl font-semibold mb-2">✨ Accumulating Jobs for You</h2>
              <p className="text-gray-300">We're searching multiple job sources and matching them to your profile. You'll be notified when done.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Form - only show if no active search */}
        {!searchInProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold mb-6">Start New Search</h2>

            <motion.button
              onClick={handleStartSearch}
              disabled={searchInProgress}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold flex items-center gap-3 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔍 Find Jobs
            </motion.button>
          </motion.div>
        )}

        {/* Search Status */}
        <AnimatePresence>
          {searchStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8 mb-8"
            >
              <h3 className="text-xl font-semibold mb-4">Search Status</h3>

              {searchStatus.status === 'pending' && (
                <div className="flex items-center gap-3 text-yellow-400">
                  <div className="animate-spin w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full" />
                  <span>Initializing search...</span>
                </div>
              )}

              {searchStatus.status === 'in_progress' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-blue-400">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
                    <span>Searching jobs from multiple sources...</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Jobs found: {searchStatus.total_jobs_searched} • Matching: {searchStatus.total_matches}
                  </p>
                </div>
              )}

              {searchStatus.status === 'completed' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-green-400">
                    <span className="text-2xl">✓</span>
                    <span>Search completed successfully!</span>
                  </div>
                  <div className="bg-white/5 rounded p-4 space-y-2">
                    <p className="text-sm text-gray-300">
                      Total jobs searched: <span className="font-bold text-white">{searchStatus.total_jobs_searched}</span>
                    </p>
                    <p className="text-sm text-gray-300">
                      Matches found (≥60%): <span className="font-bold text-white">{searchStatus.total_matches}</span>
                    </p>
                  </div>

                  {searchResults.length > 0 && (
                    <motion.button
                      onClick={handleDownloadExcel}
                      className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      📥 Download Excel (.xlsx)
                    </motion.button>
                  )}
                </div>
              )}

              {searchStatus.status === 'failed' && (
                <div className="flex items-center gap-3 text-red-400">
                  <span className="text-2xl">✗</span>
                  <span>Search failed. Please try again.</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results */}
        <AnimatePresence>
          {searchStatus?.status === 'completed' && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-semibold mb-4">
                Matched Jobs ({searchResults.length})
              </h2>

              {searchResults.map((match, index) => (
                <motion.div
                  key={match.match_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{match.job.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span>{match.job.company}</span>
                        <span>📍 {match.job.location}</span>
                        {match.job.is_remote && <span className="text-green-400">🌍 Remote</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-black text-green-400">{Math.round(match.match_score)}%</div>
                      <div className="text-xs text-gray-400">Match Score</div>
                    </div>
                  </div>

                  {match.match_reasons.length > 0 && (
                    <div className="mb-4 p-3 bg-white/5 rounded">
                      <p className="text-xs text-gray-400 mb-2">Why matched:</p>
                      <ul className="space-y-1">
                        {match.match_reasons.slice(0, 3).map((reason, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">✓</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {match.job.salary_min && (
                    <p className="text-sm text-gray-400 mb-4">
                      💰 ${match.job.salary_min.toLocaleString()} - ${match.job.salary_max?.toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <motion.a
                      href={match.job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-center"
                      whileHover={{ scale: 1.02 }}
                    >
                      Apply Now →
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        <AnimatePresence>
          {searchStatus?.status === 'completed' && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-xl text-gray-400">No jobs matched your criteria. Try adjusting your preferences.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

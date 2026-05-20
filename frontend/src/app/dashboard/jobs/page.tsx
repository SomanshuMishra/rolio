'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import * as XLSX from 'xlsx'
import AIAssistantOrb from '@/components/ai/AIAssistantOrb'

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
  const [searchStatus, setSearchStatus] = useState<SearchStatus | null>(null)
  const [searchResults, setSearchResults] = useState<JobMatch[]>([])

  // Selected job state
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null)
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)

  // Success animation state (shows for 3s after search completes)
  const [isSuccess, setIsSuccess] = useState(false)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check for search_id in URL on mount
  useEffect(() => {
    const urlSearchId = searchParams.get('search_id')
    if (urlSearchId) {
      setSearchInProgress(true)
      setSearchStatus({ search_id: urlSearchId, status: 'pending', total_jobs_searched: 0, total_matches: 0 })
      startPolling(urlSearchId)
    }
  }, [searchParams])

  // Check if resume exists and load old cached matches
  useEffect(() => {
    const checkResume = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        const resumeResponse = await fetch(`${apiUrl}/api/resume/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        setHasResume(resumeResponse.ok)

        // Load old cached matches if no active search
        if (!searchParams.get('search_id')) {
          try {
            const matchesResponse = await fetch(`${apiUrl}/api/jobs/matches?limit=1000`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const matchesData = await matchesResponse.json()
            console.log('Old cached matches:', matchesData)
            if (matchesData.matches && matchesData.matches.length > 0) {
              setSearchResults(matchesData.matches)
              setSelectedJob(matchesData.matches[0])
              // Set a dummy status to show old results
              setSearchStatus({
                search_id: 'cached',
                status: 'completed',
                total_jobs_searched: matchesData.total || 0,
                total_matches: matchesData.matches.length,
              })
            }
          } catch (error) {
            console.error('Failed to load cached matches:', error)
          }
        }
      } catch (error) {
        console.error('Failed to check resume:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkResume()
  }, [])

  // Cleanup polling and success timeout on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
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
              const jobs = resultsData.matches || []
              setSearchResults(jobs)
              if (jobs.length > 0) {
                setSelectedJob(jobs[0])
              }

              // Trigger success animation for 3s
              setIsSuccess(true)
              if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
              successTimeoutRef.current = setTimeout(() => setIsSuccess(false), 3000)

              // Show notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Rolio Job Search Complete', {
                  body: `Found ${jobs.length} matching jobs!`,
                  icon: '/favicon.svg',
                })
              }
            } catch (error) {
              console.error('Failed to fetch results:', error)
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

  const handleDownloadExcel = () => {
    if (!searchResults.length) return

    try {
      // Prepare data for Excel
      const excelData = searchResults.map((match, index) => ({
        'Rank': index + 1,
        'Job Title': match.job.title,
        'Company': match.job.company,
        'Location': match.job.location,
        'Remote': match.job.is_remote ? 'Yes' : 'No',
        'Match %': `${Math.round(match.match_score)}%`,
        'Salary Min': match.job.salary_min || '',
        'Salary Max': match.job.salary_max || '',
        'Why Matched': match.match_reasons.slice(0, 3).join('; '),
        'Apply URL': match.job.apply_url,
      }))

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Job Matches')

      // Adjust column widths
      ws['!cols'] = [
        { wch: 6 },   // Rank
        { wch: 35 },  // Job Title
        { wch: 20 },  // Company
        { wch: 20 },  // Location
        { wch: 8 },   // Remote
        { wch: 10 },  // Match %
        { wch: 12 },  // Salary Min
        { wch: 12 },  // Salary Max
        { wch: 40 },  // Why Matched
        { wch: 50 },  // Apply URL
      ]

      // Download file
      XLSX.writeFile(wb, `rolio_job_matches_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error('Failed to download Excel:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-3 border-gray-200 border-t-white rounded-full"
        />
      </div>
    )
  }

  if (!hasResume) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-[#0f172a] text-2xl mb-4">📄 Upload resume first</p>
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
    <div className="min-h-screen text-[#4a4a5e] p-4 md:p-6 lg:p-8">
      {/* AI Assistant Orb */}
      <AIAssistantOrb
        isThinking={searchInProgress && searchStatus?.status === 'pending'}
        isSearching={searchInProgress && searchStatus?.status === 'in_progress'}
        isSuccess={isSuccess}
        matchCount={searchResults.length}
        onClick={handleStartSearch}
        size={typeof window !== 'undefined' && window.innerWidth < 768 ? 56 : 80}
        position="bottom-right"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black mb-2 gradient-text"
          >
            Job Opportunities
          </motion.h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-600">AI-matched roles tailored to your profile</p>
        </div>

        {/* Accumulating Jobs Message */}
        <AnimatePresence>
          {searchInProgress && searchStatus?.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-gradient-to-br from-cyan-300/20 to-blue-300/20 border-2 border-cyan-300/50 rounded-2xl p-10 text-center backdrop-blur-sm"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center"
              >
                <span className="text-2xl">✨</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Accumulating Jobs for You</h2>
              <p className="text-gray-700">Searching multiple sources and matching with your profile...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Section */}
        {!searchInProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <motion.button
              onClick={handleStartSearch}
              disabled={searchInProgress}
              className="w-full md:w-auto px-8 py-5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl transition-all disabled:opacity-50"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(244, 114, 182, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">🔍</span> Find Jobs Now
            </motion.button>
          </motion.div>
        )}

        {/* Status Cards Section */}
        <AnimatePresence>
          {searchStatus && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              {searchStatus.status === 'pending' && (
                <motion.div
                  className="bg-gradient-to-br from-yellow-300/30 to-amber-300/30 border-2 border-yellow-300/50 rounded-2xl p-8 flex items-center gap-4"
                  animate={{ boxShadow: '0 0 20px rgba(253, 224, 71, 0.2)' }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-8 h-8 border-3 border-yellow-400 border-t-transparent rounded-full flex-shrink-0"
                  />
                  <span className="text-gray-900 font-semibold">Initializing search...</span>
                </motion.div>
              )}

              {searchStatus.status === 'in_progress' && (
                <div className="space-y-4">
                  <motion.div
                    className="bg-gradient-to-br from-blue-300/30 to-cyan-300/30 border-2 border-blue-300/50 rounded-2xl p-8 flex items-center gap-4"
                    animate={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)' }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full flex-shrink-0"
                    />
                    <span className="text-gray-900 font-semibold">Searching jobs from multiple sources...</span>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div className="bg-gradient-to-br from-orange-300/30 to-yellow-300/30 border-2 border-orange-300/50 rounded-2xl p-6">
                      <p className="text-sm text-gray-600 mb-1">Total Jobs Searched</p>
                      <p className="text-4xl font-black text-orange-600">{searchStatus.total_jobs_searched}</p>
                    </motion.div>
                    <motion.div className="bg-gradient-to-br from-green-300/30 to-emerald-300/30 border-2 border-green-300/50 rounded-2xl p-6">
                      <p className="text-sm text-gray-600 mb-1">Matches Found</p>
                      <p className="text-4xl font-black text-green-600">{searchStatus.total_matches}</p>
                    </motion.div>
                  </div>
                </div>
              )}

              {searchStatus.status === 'completed' && (
                <div className="space-y-4">
                  <motion.div
                    className="bg-gradient-to-br from-emerald-400/30 to-green-400/30 border-2 border-emerald-400/50 rounded-2xl p-8 flex items-center gap-4"
                    animate={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                  >
                    <span className="text-4xl">✓</span>
                    <div>
                      <p className="text-lg font-bold text-gray-900">Search Completed!</p>
                      <p className="text-sm text-gray-700">Your job matches are ready</p>
                    </div>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div className="bg-gradient-to-br from-blue-300/30 to-purple-300/30 border-2 border-blue-300/50 rounded-2xl p-6">
                      <p className="text-sm text-gray-600 mb-1">Total Searched</p>
                      <p className="text-4xl font-black text-blue-600">{searchStatus.total_jobs_searched}</p>
                    </motion.div>
                    <motion.div className="bg-gradient-to-br from-pink-300/30 to-rose-300/30 border-2 border-pink-300/50 rounded-2xl p-6">
                      <p className="text-sm text-gray-600 mb-1">Qualified Matches</p>
                      <p className="text-4xl font-black text-pink-600">{searchStatus.total_matches}</p>
                    </motion.div>
                  </div>
                  {searchResults.length > 0 && (
                    <motion.button
                      onClick={handleDownloadExcel}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      📥 Download All Results (Excel)
                    </motion.button>
                  )}
                </div>
              )}

              {searchStatus.status === 'failed' && (
                <motion.div className="bg-gradient-to-br from-red-300/30 to-rose-300/30 border-2 border-red-300/50 rounded-2xl p-8 flex items-center gap-4">
                  <span className="text-4xl">✗</span>
                  <span className="text-gray-900 font-semibold">Search failed. Please try again.</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job Results - Two Column Layout */}
        <AnimatePresence>
          {searchStatus?.status === 'completed' && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-2 gradient-text">
                    {searchResults.length} Opportunities
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600">Click a job to see details</p>
                </div>
                {searchResults.length > 0 && (
                  <motion.button
                    onClick={handleDownloadExcel}
                    className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-400 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-sm md:text-base whitespace-nowrap shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    📥 Download (Excel)
                  </motion.button>
                )}
              </div>

              {/* Two Column Layout */}
              <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-300px)] md:h-[calc(100vh-280px)]">
                {/* Left: Job List */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-full md:w-96 flex-shrink-0 space-y-2 overflow-y-auto pr-2"
                >
                  {searchResults.map((match, index) => {
                    const scoreColor = match.match_score >= 75 ? 'from-emerald-400 to-green-400' :
                                      match.match_score >= 60 ? 'from-amber-400 to-yellow-400' :
                                      'from-red-400 to-rose-400'
                    const accentBg = match.match_score >= 75 ? 'bg-gradient-to-r from-emerald-400 to-green-400' :
                                    match.match_score >= 60 ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
                                    'bg-gradient-to-r from-red-400 to-rose-400'
                    const glowColor = match.match_score >= 75 ? 'shadow-emerald-300/40' :
                                     match.match_score >= 60 ? 'shadow-amber-300/40' :
                                     'shadow-red-300/40'
                    const isSelected = selectedJob?.match_id === match.match_id

                    return (
                      <motion.button
                        key={match.match_id}
                        onClick={() => {
                          setSelectedJob(match)
                          setIsMobileDetailOpen(true)
                        }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`w-full rounded-xl text-left transition-all overflow-hidden relative group ${
                          isSelected
                            ? `bg-gradient-to-r from-pink-300 to-purple-300 text-white shadow-lg`
                            : `bg-white hover:shadow-xl ${glowColor}`
                        }`}
                        style={isSelected ? undefined : {
                          boxShadow: `0 4px 20px var(--tw-shadow-color)`,
                          '--tw-shadow-color': match.match_score >= 75 ? 'rgb(52, 211, 153, 0.2)' :
                                             match.match_score >= 60 ? 'rgb(251, 191, 36, 0.2)' :
                                             'rgb(248, 113, 113, 0.2)'
                        } as React.CSSProperties}
                      >
                        {/* Top Accent Bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 ${accentBg}`} />

                        {/* Gradient Border Effect */}
                        <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                          style={{
                            border: '2px solid transparent',
                            backgroundImage: isSelected ? undefined : `linear-gradient(135deg, ${
                              match.match_score >= 75 ? 'rgb(52, 211, 153, 0.5)' :
                              match.match_score >= 60 ? 'rgb(251, 191, 36, 0.5)' :
                              'rgb(248, 113, 113, 0.5)'
                            }, rgba(255,255,255,0))`,
                            backgroundClip: 'padding-box',
                          }}
                        />

                        <div className="p-4 relative z-10 flex items-start gap-3">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${scoreColor} flex items-center justify-center shadow-md`}>
                            <span className="text-sm font-black text-white">{Math.round(match.match_score)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                              {match.job.title}
                            </h3>
                            <p className={`text-xs truncate ${isSelected ? 'text-white/90' : 'text-purple-600'}`}>
                              {match.job.company}
                            </p>
                            {match.job.salary_min && (
                              <p className={`text-xs font-semibold mt-1 ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                                ${(match.job.salary_min / 1000).toFixed(0)}K - ${(match.job.salary_max! / 1000).toFixed(0)}K
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </motion.div>

                {/* Right: Job Detail Panel (Desktop Only) */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden md:flex flex-1 flex-col"
                >
                  {selectedJob ? (
                    <div className={`bg-white rounded-2xl overflow-hidden h-full sticky top-0 flex flex-col`}
                      style={{
                        boxShadow: selectedJob.match_score >= 75 ? '0 20px 40px rgba(52, 211, 153, 0.15)' :
                                  selectedJob.match_score >= 60 ? '0 20px 40px rgba(251, 191, 36, 0.15)' :
                                  '0 20px 40px rgba(248, 113, 113, 0.15)',
                        borderLeft: selectedJob.match_score >= 75 ? '8px solid rgb(52, 211, 153)' :
                                   selectedJob.match_score >= 60 ? '8px solid rgb(251, 191, 36)' :
                                   '8px solid rgb(248, 113, 113)',
                      }}
                    >
                      {/* Top Accent Bar */}
                      <div className={`h-3 bg-gradient-to-r ${
                        selectedJob.match_score >= 75 ? 'from-emerald-400 to-green-400' :
                        selectedJob.match_score >= 60 ? 'from-amber-400 to-yellow-400' :
                        'from-red-400 to-rose-400'
                      }`} />

                      <div className="p-8 overflow-y-auto flex-1">
                        {/* Score and Title */}
                        <div className="flex items-start gap-6 mb-8">
                        <div className={`flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br ${
                          selectedJob.match_score >= 75 ? 'from-emerald-400 to-green-400' :
                          selectedJob.match_score >= 60 ? 'from-amber-400 to-yellow-400' :
                          'from-red-400 to-rose-400'
                        } flex items-center justify-center shadow-xl`}>
                          <div className="text-center">
                            <p className="text-4xl font-black text-white">{Math.round(selectedJob.match_score)}</p>
                            <p className="text-xs font-bold text-white">match</p>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-3xl font-black text-gray-900 mb-2">{selectedJob.job.title}</h2>
                          <p className="text-xl font-bold text-purple-600 mb-4">{selectedJob.job.company}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-bold rounded-full">
                              📍 {selectedJob.job.location}
                            </span>
                            {selectedJob.job.is_remote && (
                              <span className="px-3 py-1 bg-emerald-200 text-emerald-800 text-sm font-bold rounded-full">
                                🌍 Remote
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Salary */}
                      {selectedJob.job.salary_min && (
                        <div className="mb-8 pb-8 border-b-2 border-gray-200">
                          <p className="text-sm text-gray-500 font-semibold mb-2">Salary Range</p>
                          <p className="text-3xl font-black text-gray-900">
                            ${(selectedJob.job.salary_min / 1000).toFixed(0)}K - ${(selectedJob.job.salary_max! / 1000).toFixed(0)}K
                          </p>
                        </div>
                      )}

                      {/* Why Match */}
                      <div className="mb-8">
                        <h3 className="text-xl font-black text-gray-900 mb-4">Why This Matches</h3>
                        <div className="space-y-3">
                          {selectedJob.match_reasons && selectedJob.match_reasons.length > 0 ? (
                            selectedJob.match_reasons.map((reason, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400"
                              >
                                <span className="text-xl flex-shrink-0 text-emerald-500">✓</span>
                                <p className="text-gray-800 font-semibold">{reason}</p>
                              </motion.div>
                            ))
                          ) : (
                            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                              <span className="text-xl flex-shrink-0 text-emerald-500">✓</span>
                              <p className="text-gray-800 font-semibold">Strong match for your profile</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <motion.a
                        href={selectedJob.job.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-6 py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Apply Now →
                      </motion.a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-lg font-semibold">Select a job to view details</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Mobile Detail Bottom Sheet */}
              <AnimatePresence>
                {selectedJob && isMobileDetailOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMobileDetailOpen(false)}
                      className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 400 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 400 }}
                      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 md:hidden max-h-[90vh] overflow-hidden flex flex-col"
                      style={{
                        borderLeft: selectedJob.match_score >= 75 ? '8px solid rgb(52, 211, 153)' :
                                   selectedJob.match_score >= 60 ? '8px solid rgb(251, 191, 36)' :
                                   '8px solid rgb(248, 113, 113)',
                      }}
                    >
                      {/* Top Accent Bar */}
                      <div className={`h-2 bg-gradient-to-r ${
                        selectedJob.match_score >= 75 ? 'from-emerald-400 to-green-400' :
                        selectedJob.match_score >= 60 ? 'from-amber-400 to-yellow-400' :
                        'from-red-400 to-rose-400'
                      }`} />

                      {/* Close Button */}
                      <div className="sticky top-0 bg-white border-b-2 border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
                        <motion.button
                          onClick={() => setIsMobileDetailOpen(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          whileTap={{ scale: 0.9 }}
                        >
                          <X size={24} className="text-gray-600" />
                        </motion.button>
                      </div>

                      <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Score and Title */}
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br ${
                            selectedJob.match_score >= 75 ? 'from-emerald-400 to-green-400' :
                            selectedJob.match_score >= 60 ? 'from-amber-400 to-yellow-400' :
                            'from-red-400 to-rose-400'
                          } flex items-center justify-center shadow-lg`}>
                            <div className="text-center">
                              <p className="text-3xl font-black text-white">{Math.round(selectedJob.match_score)}</p>
                              <p className="text-xs font-bold text-white">match</p>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedJob.job.title}</h2>
                            <p className="text-lg font-bold text-purple-600 mb-3">{selectedJob.job.company}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-bold rounded-full">
                                📍 {selectedJob.job.location}
                              </span>
                              {selectedJob.job.is_remote && (
                                <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                                  🌍 Remote
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Salary */}
                        {selectedJob.job.salary_min && (
                          <div className="pb-6 border-b-2 border-gray-200">
                            <p className="text-sm text-gray-500 font-semibold mb-2">Salary Range</p>
                            <p className="text-2xl font-black text-gray-900">
                              ${(selectedJob.job.salary_min / 1000).toFixed(0)}K - ${(selectedJob.job.salary_max! / 1000).toFixed(0)}K
                            </p>
                          </div>
                        )}

                        {/* Why Match */}
                        <div>
                          <h3 className="text-lg font-black text-gray-900 mb-3">Why This Matches</h3>
                          <div className="space-y-2">
                            {selectedJob.match_reasons && selectedJob.match_reasons.length > 0 ? (
                              selectedJob.match_reasons.map((reason, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400"
                                >
                                  <span className="text-lg flex-shrink-0 text-emerald-500">✓</span>
                                  <p className="text-sm text-gray-800 font-semibold">{reason}</p>
                                </div>
                              ))
                            ) : (
                              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                                <span className="text-lg flex-shrink-0 text-emerald-500">✓</span>
                                <p className="text-sm text-gray-800 font-semibold">Strong match for your profile</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Apply Button */}
                        <motion.a
                          href={selectedJob.job.apply_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Apply Now →
                        </motion.a>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        <AnimatePresence>
          {searchStatus?.status === 'completed' && searchResults.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">No Matches Yet</p>
              <p className="text-gray-600 text-lg">Try adjusting your preferences in settings</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

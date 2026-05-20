'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import * as XLSX from 'xlsx'

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const JOBS_PER_PAGE = 5
  const totalPages = Math.ceil(searchResults.length / JOBS_PER_PAGE)
  const paginatedJobs = searchResults.slice(
    (currentPage - 1) * JOBS_PER_PAGE,
    currentPage * JOBS_PER_PAGE
  )

  // Flip state for cards
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

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

              // Show notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Rolio Job Search Complete', {
                  body: `Found ${resultsData.matches?.length || 0} matching jobs!`,
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

  const toggleFlip = (cardId: string) => {
    const newFlipped = new Set(flippedCards)
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId)
    } else {
      newFlipped.add(cardId)
    }
    setFlippedCards(newFlipped)
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

        {/* Job Results */}
        <AnimatePresence>
          {searchStatus?.status === 'completed' && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-3 gradient-text">
                  {searchResults.length} Opportunities
                </h2>
                <p className="text-xs md:text-sm lg:text-base text-gray-600">Click cards to flip • Page {currentPage} of {totalPages}</p>
              </div>

              <div className="space-y-3 md:space-y-5">
                {paginatedJobs.map((match, index) => {
                  const scoreColor = match.match_score >= 75 ? 'from-emerald-400 to-green-400' :
                                    match.match_score >= 60 ? 'from-amber-400 to-yellow-400' :
                                    'from-red-400 to-rose-400'
                  const borderColor = match.match_score >= 75 ? 'border-emerald-300' :
                                     match.match_score >= 60 ? 'border-amber-300' :
                                     'border-red-300'
                  const isFlipped = flippedCards.has(match.match_id)

                  return (
                    <motion.div
                      key={match.match_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      onClick={() => toggleFlip(match.match_id)}
                      className={`h-64 md:h-72 rounded-2xl md:rounded-3xl border-2 md:border-3 ${borderColor} bg-white hover:shadow-2xl transition-all cursor-pointer overflow-hidden perspective`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <motion.div
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6 }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className="w-full h-full"
                      >
                        {/* Front */}
                        <div
                          style={{ backfaceVisibility: 'hidden' }}
                          className="w-full h-full p-8 flex flex-col justify-between bg-gradient-to-br from-white via-white to-gray-50"
                        >
                          <div className="flex items-start gap-3 md:gap-8">
                            {/* Score Circle */}
                            <motion.div
                              className={`flex-shrink-0 w-20 md:w-32 h-20 md:h-32 rounded-full bg-gradient-to-br ${scoreColor} flex flex-col items-center justify-center shadow-xl`}
                              animate={{ rotate: isFlipped ? 180 : 0 }}
                              transition={{ duration: 0.6 }}
                            >
                              <p className="text-3xl md:text-5xl font-black text-white">{Math.round(match.match_score)}</p>
                              <p className="text-xs md:text-sm font-bold text-white">match</p>
                            </motion.div>

                            {/* Job Details */}
                            <div className="flex-1 pt-1 md:pt-2">
                              <h3 className="text-base md:text-2xl lg:text-3xl font-black text-gray-900 mb-1 md:mb-2 leading-tight">{match.job.title}</h3>
                              <p className="text-sm md:text-lg lg:text-xl text-purple-600 font-bold mb-2 md:mb-4">{match.job.company}</p>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2 md:gap-3">
                                <span className="px-2 md:px-4 py-1 md:py-2 bg-gray-200 text-gray-800 text-xs md:text-sm font-bold rounded-full">
                                  📍 {match.job.location}
                                </span>
                                {match.job.is_remote && (
                                  <span className="px-2 md:px-4 py-1 md:py-2 bg-emerald-200 text-emerald-800 text-xs md:text-sm font-bold rounded-full">
                                    🌍 Remote
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Section */}
                          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-4 mt-3 md:mt-6 pt-3 md:pt-6 border-t-2 border-gray-200">
                            {match.job.salary_min && (
                              <div>
                                <p className="text-xs md:text-sm text-gray-500 font-semibold mb-1">Salary</p>
                                <p className="text-lg md:text-2xl font-black text-gray-900">
                                  ${(match.job.salary_min / 1000).toFixed(0)}K - ${(match.job.salary_max! / 1000).toFixed(0)}K
                                </p>
                              </div>
                            )}
                            <motion.a
                              href={match.job.apply_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full md:w-auto px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg md:rounded-xl text-sm md:text-lg font-bold hover:shadow-xl transition-all text-center"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Apply →
                            </motion.a>
                          </div>
                        </div>

                        {/* Back */}
                        <div
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          className="w-full h-full p-8 flex flex-col justify-between bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100"
                        >
                          <div>
                            <h4 className="text-3xl font-black text-gray-900 mb-6">Why Match?</h4>
                            <div className="space-y-3">
                              {match.match_reasons && match.match_reasons.length > 0 ? (
                                match.match_reasons.slice(0, 3).map((reason, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-3 p-3 bg-white/90 rounded-lg border-l-4 border-emerald-400"
                                  >
                                    <span className="text-2xl flex-shrink-0 text-emerald-500">✓</span>
                                    <p className="text-gray-800 font-semibold text-base leading-tight">{reason}</p>
                                  </motion.div>
                                ))
                              ) : (
                                <>
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-start gap-3 p-3 bg-white/90 rounded-lg border-l-4 border-emerald-400"
                                  >
                                    <span className="text-2xl flex-shrink-0 text-emerald-500">✓</span>
                                    <p className="text-gray-800 font-semibold">Strong match for your skills</p>
                                  </motion.div>
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-start gap-3 p-3 bg-white/90 rounded-lg border-l-4 border-emerald-400"
                                  >
                                    <span className="text-2xl flex-shrink-0 text-emerald-500">✓</span>
                                    <p className="text-gray-800 font-semibold">Experience level aligns well</p>
                                  </motion.div>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 text-center font-medium">← Click to flip back</p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-3 mt-12 pb-8 flex-wrap"
                >
                  <motion.button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    ← Prev
                  </motion.button>

                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-2 border-2 border-pink-200">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <motion.button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-md font-bold text-sm transition-all ${
                          page === currentPage
                            ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {page}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    Next →
                  </motion.button>
                </motion.div>
              )}
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

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

interface Job {
  id: string
  jsearch_id: string
  title: string
  company: string
  location: string
  salary?: string
  salary_min?: number
  salary_max?: number
  is_remote: boolean
  description: string
  match_score?: number
  match_reasons?: string[]
  posted_at?: string
  apply_url?: string
}

const SWIPE_THRESHOLD = 50

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasResume, setHasResume] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedCards, setSwipedCards] = useState<Set<string>>(new Set())
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ searchTerm: '', remoteOnly: false, requiredSkills: [] as string[] })
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const dragRef = useRef<HTMLDivElement>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        // Fetch available skills
        try {
          const skillsResponse = await fetch(`${apiUrl}/api/jobs/skills`)
          if (skillsResponse.ok) {
            const skillsData = await skillsResponse.json()
            setAvailableSkills(skillsData.skills || [])
          }
        } catch (skillsError) {
          console.error('Failed to fetch skills:', skillsError)
        }

        const resumeResponse = await fetch(`${apiUrl}/api/resume/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (resumeResponse.ok) {
          setHasResume(true)
          const jobsResponse = await fetch(`${apiUrl}/api/jobs/matches?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (jobsResponse.ok) {
            const data = await jobsResponse.json()
            const formattedJobs = (data.matches || []).map((match: any) => ({
              id: match.job?.id || match.match_id,
              jsearch_id: match.job?.jsearch_id || '',
              title: match.job?.title || '',
              company: match.job?.company || '',
              location: match.job?.location || '',
              salary_min: match.job?.salary_min,
              salary_max: match.job?.salary_max,
              is_remote: match.job?.is_remote || false,
              description: match.job?.description || '',
              match_score: match.match_score,
              match_reasons: match.match_reasons || [],
              posted_at: match.job?.posted_at,
              apply_url: match.job?.apply_url || '',
            }))
            setJobs(formattedJobs)
          }
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleSwipe('left')
      if (e.key === 'ArrowRight') handleSwipe('right')
      if (e.key === 'Enter') currentJob && window.open(currentJob.apply_url, '_blank')
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentIndex, jobs])

  const handleSwipe = async (direction: 'left' | 'right') => {
    const job = jobs[currentIndex]
    if (!job) return

    const token = localStorage.getItem('access_token')
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    try {
      if (direction === 'right') {
        // Save the job
        await fetch(`${apiUrl}/api/jobs/jobs/${job.jsearch_id}/save`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        setSavedCards(new Set([...savedCards, job.id]))
      } else {
        // Dismiss the job
        await fetch(`${apiUrl}/api/jobs/jobs/${job.jsearch_id}/dismiss`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error('Failed to update job action:', error)
    }

    setSwipedCards(new Set([...swipedCards, job.id]))
    setCurrentIndex(currentIndex + 1)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return
    const deltaX = e.clientX - dragStart.x
    dragRef.current.style.transform = `translateX(${deltaX}px) rotateZ(${deltaX * 0.1}deg)`
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return
    setIsDragging(false)

    const deltaX = e.clientX - dragStart.x

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      handleSwipe(deltaX > 0 ? 'right' : 'left')
      if (dragRef.current) {
        dragRef.current.style.transform = ''
      }
    } else {
      if (dragRef.current) {
        dragRef.current.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        dragRef.current.style.transform = 'translateX(0) rotateZ(0)'
        setTimeout(() => {
          if (dragRef.current) dragRef.current.style.transition = ''
        }, 300)
      }
    }
  }

  const currentJob = jobs[currentIndex]
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !filters.searchTerm ||
      job.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(filters.searchTerm.toLowerCase())
    const matchesRemote = !filters.remoteOnly || job.is_remote

    // Skills filtering - if skills are selected, description must contain at least one skill
    let matchesSkills = true
    if (filters.requiredSkills.length > 0) {
      const jobText = (job.description || '').toLowerCase()
      matchesSkills = filters.requiredSkills.some(skill =>
        jobText.includes(skill.toLowerCase())
      )
    }

    return matchesSearch && matchesRemote && matchesSkills && !swipedCards.has(job.id)
  })

  const remainingCount = filteredJobs.length - (currentIndex - swipedCards.size)

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
          <button className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200">
            Go to Resume
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black">JOBS</h1>
          <p className="text-sm text-gray-400">{remainingCount} remaining</p>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="text-2xl"
          >
            ⚙️
          </motion.button>
        </div>
      </motion.div>

      {/* Filters Sidebar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-0 w-80 h-screen bg-gradient-to-b from-gray-900 to-black border-r border-white/10 p-6 pt-20 z-40 overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6">FILTER</h2>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  placeholder="Job title, company..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-white outline-none transition-colors"
                />
              </div>

              {/* Remote Toggle */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setFilters({ ...filters, remoteOnly: !filters.remoteOnly })}
                  className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                    filters.remoteOnly ? 'bg-white border-white' : 'border-white/30'
                  }`}
                >
                  {filters.remoteOnly && <span className="text-black text-sm font-bold">✓</span>}
                </motion.button>
                <label className="text-sm font-medium cursor-pointer">Remote only</label>
              </div>

              {/* Skills Filter */}
              {availableSkills.length > 0 && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                    Skills
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableSkills.map((skill) => (
                      <label key={skill} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.requiredSkills.includes(skill)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...filters.requiredSkills, skill]
                              : filters.requiredSkills.filter((s) => s !== skill)
                            setFilters({ ...filters, requiredSkills: updated })
                          }}
                          className="w-4 h-4 accent-white cursor-pointer rounded"
                        />
                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{skill}</span>
                      </label>
                    ))}
                  </div>

                  {/* Selected skills tags */}
                  {filters.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                      {filters.requiredSkills.map((skill) => (
                        <button
                          key={skill}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              requiredSkills: filters.requiredSkills.filter((s) => s !== skill),
                            })
                          }
                          className="px-2 py-1 bg-white/20 text-white text-xs rounded hover:bg-white/30 transition-colors"
                        >
                          {skill} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reset */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters({ searchTerm: '', remoteOnly: false, requiredSkills: [] })}
                className="w-full py-2 border border-white/30 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-white/5 transition-colors"
              >
                Reset
              </motion.button>

              {/* Info */}
              <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-white/10">
                <p>← Swipe left to skip</p>
                <p>→ Swipe right to save</p>
                <p>↵ Press Enter to apply</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card Area */}
      <div className="pt-20 px-6 pb-6 flex items-center justify-center min-h-screen">
        {filteredJobs.length > currentIndex ? (
          <div className="w-full max-w-2xl h-screen max-h-[600px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentJob?.id}
                ref={dragRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                initial={{ opacity: 0, scale: 0.95, rotateZ: -5 }}
                animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 500, rotateZ: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/20 rounded-3xl p-8 flex flex-col justify-between cursor-grab active:cursor-grabbing overflow-hidden group"
              >
                {/* Background gradient animation */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-br from-white to-transparent transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Top Section */}
                  <div>
                    {/* Match Score - Huge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="mb-6 inline-block"
                    >
                      <div className="text-6xl font-black">{Math.round(currentJob?.match_score || 0)}%</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Match</div>
                    </motion.div>

                    {/* Job Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-4xl md:text-5xl font-black mb-2 leading-tight"
                    >
                      {currentJob?.title}
                    </motion.h2>

                    {/* Company & Location */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2 mb-6"
                    >
                      <div className="text-lg font-bold text-gray-300">{currentJob?.company}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>📍 {currentJob?.location}</span>
                        {currentJob?.is_remote && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-bold">
                            REMOTE
                          </span>
                        )}
                      </div>
                    </motion.div>

                    {/* Quick reasons */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-2 text-sm text-gray-300 border-t border-white/10 pt-4"
                    >
                      {currentJob?.match_reasons?.slice(0, 3).map((reason, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="flex items-start gap-2"
                        >
                          <span className="text-green-400 mt-1">✓</span>
                          <span>{reason}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex gap-4 mt-8"
                  >
                    {/* Skip Button */}
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSwipe('left')}
                      className="flex-1 py-3 border-2 border-white/30 rounded-xl font-bold uppercase tracking-wider text-sm hover:border-white/50 transition-colors"
                    >
                      ✕ Skip
                    </motion.button>

                    {/* Apply Button */}
                    <motion.button
                      whileHover={{ scale: 1.05, backgroundColor: 'white' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => currentJob && window.open(currentJob.apply_url, '_blank')}
                      className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-gray-200 transition-colors"
                    >
                      ⚡ Apply
                    </motion.button>

                    {/* Save Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSwipe('right')}
                      className={`flex-1 py-3 font-bold uppercase tracking-wider text-sm rounded-xl transition-colors ${
                        savedCards.has(currentJob?.id || '')
                          ? 'bg-green-500 text-white'
                          : 'border-2 border-white/30 hover:border-white/50'
                      }`}
                    >
                      {savedCards.has(currentJob?.id || '') ? '♥ Saved' : '♡ Save'}
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Hints */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-16 left-0 right-0 flex justify-center gap-8 text-xs text-gray-500"
            >
              <span>← Swipe Left to Skip</span>
              <span>→ Swipe Right to Save</span>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">No more jobs</h2>
            <p className="text-gray-400">You've reviewed all {savedCards.size} matches!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setCurrentIndex(0)
                setSwipedCards(new Set())
              }}
              className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200"
            >
              Start Over
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface JobFiltersProps {
  onFiltersChange: (filters: {
    searchTerm: string
    minSalary: number
    maxSalary: number
    remoteOnly: boolean
    requiredSkills: string[]
  }) => void
}

export default function JobFilters({ onFiltersChange }: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [filters, setFilters] = useState({
    searchTerm: '',
    minSalary: 0,
    maxSalary: 250000,
    remoteOnly: false,
    requiredSkills: [] as string[],
  })
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)

  // Fetch available skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/jobs/skills')
        const data = await response.json()
        setAvailableSkills(data.skills || [])
      } catch (error) {
        console.error('Failed to fetch skills:', error)
      }
    }
    fetchSkills()
  }, [])

  const handleFilterChange = (newFilters: any) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange(updated)
  }

  return (
    <motion.div
      className="backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 mb-8 bg-gradient-to-br from-purple-900/20 via-slate-900/10 to-blue-900/20 shadow-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-white">Smart Filters</h3>
        </div>
        <motion.span
          className="text-xl text-purple-400"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Filter content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mt-6 space-y-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <label className="block text-sm font-semibold text-purple-200 mb-3">Search Jobs</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                placeholder="Software Engineer, Product Manager..."
                className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-white text-sm placeholder-purple-400/50 focus:border-purple-400 focus:bg-purple-500/20 outline-none transition-all duration-200"
              />
            </motion.div>

            {/* Salary range */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <label className="block text-sm font-semibold text-purple-200 mb-4">Salary Range</label>
              <div className="space-y-4 bg-purple-500/5 p-4 rounded-lg border border-purple-500/20">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-purple-300">Minimum Salary</label>
                    <span className="text-sm font-bold text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
                      ${(filters.minSalary / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <motion.input
                    type="range"
                    min="0"
                    max="300000"
                    step="10000"
                    value={filters.minSalary}
                    onChange={(e) => handleFilterChange({ minSalary: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gradient-to-r from-purple-500/30 to-purple-500/50 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-blue-300">Maximum Salary</label>
                    <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
                      ${(filters.maxSalary / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <motion.input
                    type="range"
                    min="0"
                    max="300000"
                    step="10000"
                    value={filters.maxSalary}
                    onChange={(e) => handleFilterChange({ maxSalary: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gradient-to-r from-blue-500/30 to-blue-500/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Skills filter */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-semibold text-purple-200 mb-3">Required Skills</label>
              <div className="relative">
                <motion.button
                  onClick={() => setShowSkillDropdown(!showSkillDropdown)}
                  className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-white text-sm text-left flex items-center justify-between hover:bg-purple-500/20 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span>
                    {filters.requiredSkills.length === 0
                      ? 'Select skills (optional)'
                      : `${filters.requiredSkills.length} skill${filters.requiredSkills.length !== 1 ? 's' : ''} selected`}
                  </span>
                  <span className="text-purple-400">▼</span>
                </motion.button>

                <AnimatePresence>
                  {showSkillDropdown && (
                    <motion.div
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-purple-500/30 rounded-lg p-4 max-h-48 overflow-y-auto z-50"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-2">
                        {availableSkills.map((skill) => (
                          <label key={skill} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={filters.requiredSkills.includes(skill)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...filters.requiredSkills, skill]
                                  : filters.requiredSkills.filter((s) => s !== skill)
                                handleFilterChange({ requiredSkills: updated })
                              }}
                              className="w-4 h-4 accent-purple-500 cursor-pointer rounded"
                            />
                            <span className="text-xs text-purple-200 group-hover:text-purple-100 transition-colors">{skill}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected skills tags */}
              {filters.requiredSkills.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2 mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {filters.requiredSkills.map((skill) => (
                    <motion.button
                      key={skill}
                      onClick={() =>
                        handleFilterChange({
                          requiredSkills: filters.requiredSkills.filter((s) => s !== skill),
                        })
                      }
                      className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-full hover:bg-purple-500/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {skill} ×
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* Remote toggle */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20"
            >
              <motion.div
                className="relative w-5 h-5"
                whileHover={{ scale: 1.1 }}
              >
                <input
                  type="checkbox"
                  id="remote"
                  checked={filters.remoteOnly}
                  onChange={(e) => handleFilterChange({ remoteOnly: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
                />
              </motion.div>
              <label htmlFor="remote" className="text-sm font-medium text-emerald-200 cursor-pointer">
                Remote positions only 🌍
              </label>
            </motion.div>

            {/* Reset button */}
            <motion.button
              onClick={() => {
                const defaultFilters = {
                  searchTerm: '',
                  minSalary: 0,
                  maxSalary: 250000,
                  remoteOnly: false,
                  requiredSkills: [],
                }
                setFilters(defaultFilters)
                onFiltersChange(defaultFilters)
                setShowSkillDropdown(false)
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600/50 to-blue-600/50 hover:from-purple-600 hover:to-blue-600 rounded-lg text-sm font-semibold text-white transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50"
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)' }}
              whileTap={{ scale: 0.98 }}
            >
              ↺ Reset All Filters
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

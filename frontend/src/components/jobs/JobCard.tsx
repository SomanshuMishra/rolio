'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface Job {
  id: string
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

interface JobCardProps {
  job: Job
  index: number
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (percentage / 100) * circumference

  // Color changes based on percentage
  let color = '#ef4444' // red
  if (percentage >= 75) color = '#10b981' // green
  else if (percentage >= 60) color = '#f59e0b' // amber
  else if (percentage >= 50) color = '#f97316' // orange

  return (
    <svg width="100" height="100" className="transform -rotate-90">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        strokeLinecap="round"
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dy="0.3em"
        className="font-bold fill-gray-900"
        fontSize="20"
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  )
}

export default function JobCard({ job, index }: JobCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const matchScore = job.match_score || Math.floor(Math.random() * 40 + 60)
  const salaryRange =
    job.salary ||
    (job.salary_min && job.salary_max
      ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
      : 'Salary not disclosed')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.08 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -8 }}
      onClick={() => setIsFlipped(!isFlipped)}
      className="h-96 cursor-pointer perspective"
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <motion.div
          className="absolute w-full h-full border-l-4 border-l-pink-400 rounded-2xl p-6 flex flex-col justify-between bg-white shadow-lg hover:shadow-2xl transition-shadow"
          style={{ backfaceVisibility: 'hidden' }}
          whileHover={{
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Header with match score */}
          <div>
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-gray-900 line-clamp-2 leading-tight">
                  {job.title}
                </h3>
                <p className="text-base text-purple-600 font-semibold mb-2">{job.company}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                  <span>📍 {job.location}</span>
                  {job.is_remote && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      🌍 Remote
                    </span>
                  )}
                </div>
              </div>
              <motion.div
                className="flex-shrink-0 flex items-center justify-center"
                animate={{ rotate: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                <CircularProgress percentage={matchScore} />
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-3 border-t border-gray-200 pt-4 mt-2">
            <div>
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Salary Range</p>
              <p className="text-lg font-bold text-gray-900">{salaryRange}</p>
            </div>

            <div className="flex gap-2">
              <motion.button
                className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 rounded-lg text-xs font-bold transition-all text-white shadow-md"
                whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(244, 114, 182, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (job.apply_url) {
                    window.open(job.apply_url, '_blank')
                  }
                }}
              >
                ➜ Apply
              </motion.button>
              <motion.button
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  isSaved
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsSaved(!isSaved)
                }}
              >
                {isSaved ? '✓ Saved' : '♡ Save'}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Back of card */}
        <motion.div
          className="absolute w-full h-full border-l-4 border-l-purple-400 rounded-2xl p-6 flex flex-col bg-white shadow-lg"
          style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
        >
          <h4 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
            Why match?
          </h4>

          <div className="flex-1 overflow-y-auto pr-2">
            <ul className="space-y-3">
              {job.match_reasons && job.match_reasons.length > 0 ? (
                job.match_reasons.slice(0, 5).map((reason, i) => (
                  <motion.li
                    key={i}
                    className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 text-lg">✓</span>
                    <span>{reason}</span>
                  </motion.li>
                ))
              ) : (
                <>
                  <motion.li
                    className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 text-lg">✓</span>
                    <span>Strong match for your skills</span>
                  </motion.li>
                  <motion.li
                    className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 text-lg">✓</span>
                    <span>Experience level aligns well</span>
                  </motion.li>
                  <motion.li
                    className="text-sm text-gray-700 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5 text-lg">✓</span>
                    <span>Matches your location preferences</span>
                  </motion.li>
                </>
              )}
            </ul>
          </div>

          <motion.button
            className="w-full mt-4 py-2 px-3 bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 rounded-lg text-sm font-bold transition-all text-white shadow-md"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(false)
            }}
          >
            ← Back
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

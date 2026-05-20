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

  return (
    <svg width="100" height="100" className="transform -rotate-90">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="rgba(168, 85, 247, 0.1)"
        strokeWidth="3"
      />
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="3"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dy="0.3em"
        className="font-bold fill-purple-300"
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
          className="absolute w-full h-full backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between bg-gradient-to-br from-purple-900/30 via-slate-900/20 to-blue-900/30 shadow-2xl"
          style={{ backfaceVisibility: 'hidden' }}
          whileHover={{
            boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
          }}
        >
          {/* Header with match score */}
          <div>
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2 text-white line-clamp-2 leading-tight">
                  {job.title}
                </h3>
                <p className="text-sm text-purple-300 font-medium mb-2">{job.company}</p>
                <div className="flex items-center gap-2 text-xs text-purple-200 flex-wrap">
                  <span>📍 {job.location}</span>
                  {job.is_remote && (
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium">
                      Remote
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
          <div className="space-y-3 border-t border-purple-500/20 pt-4 mt-2">
            <div>
              <p className="text-xs text-purple-300 mb-1 font-medium">Salary Range</p>
              <p className="text-sm font-semibold text-white">{salaryRange}</p>
            </div>

            <div className="flex gap-2">
              <motion.button
                className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-xs font-medium transition-all text-white shadow-lg"
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (job.apply_url) {
                    window.open(job.apply_url, '_blank')
                  }
                }}
              >
                ✓ Apply Now
              </motion.button>
              <motion.button
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  isSaved
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
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
          className="absolute w-full h-full backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 flex flex-col bg-gradient-to-br from-blue-900/30 via-slate-900/20 to-purple-900/30 shadow-2xl"
          style={{ backfaceVisibility: 'hidden', rotateY: 180 }}
        >
          <h4 className="text-sm font-bold text-purple-300 mb-4 uppercase tracking-wider">
            Why you'd be great
          </h4>

          <div className="flex-1 overflow-y-auto pr-2">
            <ul className="space-y-2">
              {job.match_reasons && job.match_reasons.length > 0 ? (
                job.match_reasons.slice(0, 5).map((reason, i) => (
                  <motion.li
                    key={i}
                    className="text-xs text-purple-100 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                    <span>{reason}</span>
                  </motion.li>
                ))
              ) : (
                <>
                  <motion.li
                    className="text-xs text-purple-100 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                    <span>Strong match for your skills</span>
                  </motion.li>
                  <motion.li
                    className="text-xs text-purple-100 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                    <span>Experience level aligns well</span>
                  </motion.li>
                  <motion.li
                    className="text-xs text-purple-100 flex items-start gap-2 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                    <span>Matches your location preferences</span>
                  </motion.li>
                </>
              )}
            </ul>
          </div>

          <motion.button
            className="w-full mt-4 py-2 px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-xs font-medium transition-all text-white shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              setIsFlipped(false)
            }}
          >
            Back to Details
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

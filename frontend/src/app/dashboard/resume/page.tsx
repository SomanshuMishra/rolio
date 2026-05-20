'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import ScanBeam from '@/components/ui/ScanBeam'

interface ParsedResume {
  name?: string
  email?: string
  phone?: string
  summary?: string
  skills?: string[]
  experience?: Array<{
    company: string
    role: string
    duration: string
  }>
}

export default function ResumePage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isScanActive, setIsScanActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        await uploadResume(file)
      } else {
        setUploadError('Please upload a PDF file')
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        await uploadResume(file)
      } else {
        setUploadError('Please upload a PDF file')
      }
    }
  }

  const uploadResume = async (file: File) => {
    setUploadError('')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('access_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        setUploadError(error.detail || 'Failed to upload resume')
        return
      }

      const data = await response.json()
      setIsScanActive(true)
      setTimeout(() => {
        setParsedData(data.parsed_data || {})
      }, 1500)
      addToast('Resume uploaded successfully!', 'success')
    } catch (error) {
      setUploadError('An error occurred while uploading the resume')
      addToast('Failed to upload resume', 'error')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirmResume = async () => {
    setIsConfirming(true)
    try {
      addToast('Resume confirmed! Ready to match jobs.', 'success')
      // Navigate to settings/preferences or jobs page
      setTimeout(() => {
        router.push('/dashboard/settings')
      }, 500)
    } catch (error) {
      addToast('Failed to confirm resume', 'error')
      console.error('Confirm error:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Header */}
      <motion.div
        className="mb-8 md:mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 ai-text">Your Resume</h1>
        <p className="text-sm md:text-base text-slate-400">Upload and manage your resume for job matching</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Upload Section */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className={`border-2 border-dashed rounded-xl p-6 md:p-8 transition-all duration-300 cyber-glass relative overflow-hidden group ${
              isDragging
                ? 'border-cyan-500 border-opacity-100 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                : 'border-cyan-500/40 border-opacity-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />

            <div className="text-center relative z-10">
              <motion.div
                className="text-5xl md:text-6xl mb-4"
                animate={isDragging ? { scale: 1.2, rotate: 12, y: -10 } : { scale: 1, rotate: 0, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                📄
              </motion.div>

              <h3 className="text-lg md:text-xl font-semibold mb-2 text-cyan-300">Drop your resume here</h3>
              <p className="text-xs md:text-sm text-slate-400 mb-4">or click to browse</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500/40 to-purple-500/40 hover:from-cyan-500/60 hover:to-purple-500/60 rounded-lg text-xs md:text-sm font-medium text-cyan-300 disabled:opacity-50 transition-all border border-cyan-500/50 neon-glow-cyan"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </motion.button>

              <p className="text-xs text-slate-500 mt-4">PDF up to 10MB</p>
            </div>

            {/* Progress indicator */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  className="mt-4 pt-4 border-t border-cyan-500/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <span className="text-xs text-slate-400">Processing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  className="mt-4 pt-4 border-t border-red-500/20 text-red-400 text-xs md:text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {uploadError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Preview Section */}
        {(parsedData || isScanActive) && (
          <motion.div
            className="lg:col-span-2 relative"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            ref={previewRef}
          >
            <ScanBeam isActive={isScanActive} onComplete={() => setIsScanActive(false)} />
            <motion.div
              className="cyber-glass border border-cyan-500/30 rounded-xl p-6 md:p-8 relative overflow-hidden group"
              whileHover={{ borderColor: 'rgba(6, 182, 212, 0.5)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-cyan-300">Parsed Resume Data</h2>

              {/* Basic Info */}
              {parsedData && parsedData.name && (
                <motion.div
                  className="mb-6 pb-6 border-b border-cyan-500/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-cyan-300 mb-2">{parsedData.name}</h3>
                  {parsedData.email && (
                    <p className="text-sm text-slate-400">📧 {parsedData.email}</p>
                  )}
                  {parsedData.phone && (
                    <p className="text-sm text-slate-400">📱 {parsedData.phone}</p>
                  )}
                </motion.div>
              )}

              {/* Summary */}
              {parsedData && parsedData.summary && (
                <motion.div
                  className="mb-6 pb-6 border-b border-cyan-500/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-sm font-semibold text-cyan-300 mb-2">Summary</h4>
                  <p className="text-sm text-slate-400 line-clamp-3">{parsedData.summary}</p>
                </motion.div>
              )}

              {/* Skills */}
              {parsedData && parsedData.skills && parsedData.skills.length > 0 && (
                <motion.div
                  className="mb-6 pb-6 border-b border-cyan-500/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="text-sm font-semibold text-cyan-300 mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.slice(0, 8).map((skill, index) => (
                      <motion.span
                        key={index}
                        className="px-3 py-1 bg-cyan-900/40 text-cyan-300 rounded-full text-xs border border-cyan-500/30"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                    {parsedData.skills.length > 8 && (
                      <span className="px-3 py-1 bg-slate-900/40 text-slate-300 rounded-full text-xs border border-slate-500/30">
                        +{parsedData.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Experience */}
              {parsedData && parsedData.experience && parsedData.experience.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-semibold text-cyan-300 mb-3">Experience</h4>
                  <div className="space-y-3">
                    {parsedData.experience.slice(0, 3).map((exp, index) => (
                      <motion.div
                        key={index}
                        className="p-3 bg-slate-800/30 rounded-lg border-l-4 border-l-purple-500/50 border border-slate-700/50"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <p className="font-medium text-sm text-slate-300">{exp.role}</p>
                        <p className="text-xs text-slate-500">{exp.company}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

                {parsedData && (
                  <motion.button
                    onClick={handleConfirmResume}
                    disabled={isConfirming}
                    className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-xs md:text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden neon-glow-cyan"
                    whileHover={{ scale: isConfirming ? 1 : 1.05 }}
                    whileTap={{ scale: isConfirming ? 1 : 0.95 }}
                  >
                    <motion.span
                      animate={{ opacity: isConfirming ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      ✓ Confirm Resume
                    </motion.span>
                    {isConfirming && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        animate={{ opacity: 1 }}
                      >
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </motion.div>
                    )}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

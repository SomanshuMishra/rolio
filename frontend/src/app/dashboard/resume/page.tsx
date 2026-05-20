'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setParsedData(data.parsed_data || {})
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
    <div className="p-8">
      {/* Header */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-bold mb-2">Your Resume</h1>
        <p className="text-gray-400">Upload and manage your resume for job matching</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <motion.div
            className={`border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center">
              <motion.div
                className="text-5xl mb-4"
                animate={isDragging ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
              >
                📄
              </motion.div>

              <h3 className="text-lg font-semibold mb-2">Drop your resume here</h3>
              <p className="text-gray-400 text-sm mb-4">or click to browse</p>

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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isUploading ? 'Uploading...' : 'Choose File'}
              </motion.button>

              <p className="text-xs text-gray-500 mt-4">PDF up to 10MB</p>
            </div>

            {/* Progress indicator */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  className="mt-4 pt-4 border-t border-white/10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        animate={{ x: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                    <span className="text-xs text-gray-400">Processing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  className="mt-4 pt-4 border-t border-red-500/20 text-red-400 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {uploadError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Preview Section */}
        {parsedData && (
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-semibold mb-6">Parsed Resume Data</h2>

              {/* Basic Info */}
              {parsedData.name && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">{parsedData.name}</h3>
                  {parsedData.email && (
                    <p className="text-sm text-gray-400">📧 {parsedData.email}</p>
                  )}
                  {parsedData.phone && (
                    <p className="text-sm text-gray-400">📱 {parsedData.phone}</p>
                  )}
                </motion.div>
              )}

              {/* Summary */}
              {parsedData.summary && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Summary</h4>
                  <p className="text-sm text-gray-400 line-clamp-3">{parsedData.summary}</p>
                </motion.div>
              )}

              {/* Skills */}
              {parsedData.skills && parsedData.skills.length > 0 && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.slice(0, 8).map((skill, index) => (
                      <motion.span
                        key={index}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))}
                    {parsedData.skills.length > 8 && (
                      <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                        +{parsedData.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Experience */}
              {parsedData.experience && parsedData.experience.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Experience</h4>
                  <div className="space-y-3">
                    {parsedData.experience.slice(0, 3).map((exp, index) => (
                      <motion.div
                        key={index}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <p className="font-medium text-sm">{exp.role}</p>
                        <p className="text-xs text-gray-400">{exp.company}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.button
                onClick={handleConfirmResume}
                disabled={isConfirming}
                className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                whileHover={{ scale: isConfirming ? 1 : 1.02 }}
                whileTap={{ scale: isConfirming ? 1 : 0.98 }}
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
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

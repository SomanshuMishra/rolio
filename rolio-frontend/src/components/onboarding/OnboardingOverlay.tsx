'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Upload, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/src/store/authStore'
import { profileAPI, resumeAPI, jobsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const CARDS = [
  { id: 0, title: 'Profile Details', description: 'Let\'s set up your profile' },
  { id: 1, title: 'Upload Resume', description: 'Add your resume for better job matching' },
  { id: 2, title: 'Add AI API Key', description: 'Connect Gemini or Grok for job search' },
  { id: 3, title: 'All Set!', description: 'Your profile is complete' },
]

export default function OnboardingOverlay() {
  const { user, markOnboardingComplete } = useAuthStore()
  const [currentCard, setCurrentCard] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Card 1: Profile
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone_number || '')

  // Card 2: Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  // Card 3: API Key
  const [selectedProvider, setSelectedProvider] = useState<'gemini' | 'grok'>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyAdded, setApiKeyAdded] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // Card 1: Save profile
  const handleProfileNext = async () => {
    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }

    setIsLoading(true)
    try {
      await profileAPI.update({
        full_name: fullName,
        phone_number: phone,
      })
      setCurrentCard(1)
      toast.success('Profile saved!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  // Card 2: Upload resume
  const handleResumeSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    setResumeFile(file)
  }

  const handleResumeUpload = async () => {
    if (!resumeFile) return

    setIsLoading(true)
    try {
      await resumeAPI.upload(resumeFile)
      setResumeUploaded(true)
      toast.success('Resume uploaded!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to upload resume')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeNext = () => {
    if (!resumeUploaded) {
      toast.error('Please upload your resume first')
      return
    }
    setCurrentCard(2)
  }

  // Card 3: Save API key
  const handleApiKeySave = async () => {
    if (!apiKey.trim()) {
      toast.error('API key is required')
      return
    }

    setIsLoading(true)
    try {
      const provider = selectedProvider === 'gemini' ? 'google' : 'grok'
      await profileAPI.addApiKey(provider, apiKey, undefined, true)
      setApiKeyAdded(true)
      toast.success(`${selectedProvider === 'gemini' ? 'Gemini' : 'Grok'} API key added!`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save API key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApiKeySkip = () => {
    setCurrentCard(3)
  }

  const handleApiKeyNext = () => {
    if (!apiKeyAdded) {
      toast.error('Please add an API key or skip this step')
      return
    }
    setCurrentCard(3)
  }

  // Card 4: Complete
  const handleComplete = async () => {
    setIsLoading(true)
    try {
      await markOnboardingComplete()
      toast.success('Welcome to ROLIO!')
    } catch (err: any) {
      toast.error('Failed to complete onboarding')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/60 p-4">
      {/* Progress Indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex gap-3">
        {CARDS.map((card) => (
          <motion.div
            key={card.id}
            className={`h-2 w-8 rounded-full transition-all ${
              card.id === currentCard
                ? 'bg-primary shadow-lg shadow-primary/50'
                : card.id < currentCard
                  ? 'bg-primary/60'
                  : 'bg-primary/20'
            }`}
            layout
          />
        ))}
      </div>

      {/* Card Container */}
      <motion.div
        className="w-full max-w-md glass rounded-2xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {currentCard === 0 && (
            <motion.div
              key="profile"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {CARDS[0].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {CARDS[0].description}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Phone Number *
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="bg-secondary/50 border-border"
                  />
                </div>

                <Button
                  onClick={handleProfileNext}
                  disabled={isLoading}
                  className="w-full mt-6 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'Saving...' : 'Next →'}
                </Button>
              </div>
            </motion.div>
          )}

          {currentCard === 1 && (
            <motion.div
              key="resume"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {CARDS[1].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {CARDS[1].description}
              </p>

              <div className="space-y-4">
                {resumeUploaded ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-400">{resumeFile?.name}</p>
                      <p className="text-xs text-green-400/70">Uploaded successfully</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleResumeSelect(e.target.files[0])
                        }
                      }}
                      className="hidden"
                    />
                    <div
                      onClick={() => resumeInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-foreground mb-1">
                        {resumeFile ? resumeFile.name : 'Click to upload'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF format only
                      </p>
                    </div>

                    {resumeFile && (
                      <Button
                        onClick={handleResumeUpload}
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {isLoading ? 'Uploading...' : 'Upload Resume'}
                      </Button>
                    )}
                  </>
                )}

                <Button
                  onClick={handleResumeNext}
                  disabled={isLoading || !resumeUploaded}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  Next →
                </Button>
              </div>
            </motion.div>
          )}

          {currentCard === 2 && (
            <motion.div
              key="apikey"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {CARDS[2].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {CARDS[2].description}
              </p>

              <div className="space-y-4">
                {/* Provider Tabs */}
                <div className="flex gap-2">
                  {(['gemini', 'grok'] as const).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setSelectedProvider(provider)}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        selectedProvider === provider
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {provider === 'gemini' ? 'Gemini' : 'Grok'}
                    </button>
                  ))}
                </div>

                {/* API Key Input */}
                {apiKeyAdded ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-400">API Key Added</p>
                      <p className="text-xs text-green-400/70">
                        {selectedProvider === 'gemini' ? 'Gemini' : 'Grok'} is ready
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Paste your API key here"
                        className="bg-secondary/50 border-border pr-10"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => setShowGuide(!showGuide)}
                      className="text-sm text-primary hover:underline"
                    >
                      {showGuide ? '← Back' : 'How to get API key?'}
                    </button>

                    {showGuide && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm"
                      >
                        <p className="font-medium text-foreground">Getting your API key:</p>
                        <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                          <li>Go to{' '}
                            <a
                              href="https://aistudio.google.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              aistudio.google.com
                            </a>
                          </li>
                          <li>Click "Get API Key" in the menu</li>
                          <li>Create a new key in Google Cloud</li>
                          <li>Copy the key and paste it above</li>
                        </ol>
                      </motion.div>
                    )}

                    <Button
                      onClick={handleApiKeySave}
                      disabled={isLoading}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {isLoading ? 'Saving...' : 'Save API Key'}
                    </Button>
                  </>
                )}

                <button
                  onClick={handleApiKeySkip}
                  className="text-sm text-muted-foreground hover:text-foreground w-full py-2"
                >
                  Skip for now
                </button>

                {apiKeyAdded && (
                  <Button
                    onClick={handleApiKeyNext}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Next →
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {currentCard === 3 && (
            <motion.div
              key="complete"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="mb-6"
              >
                <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-3xl font-bold text-foreground mb-2"
              >
                Profile Complete!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-muted-foreground mb-8"
              >
                You're all set. Let's find your next opportunity!
              </motion.p>

              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? 'Getting started...' : 'Go to Dashboard →'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
